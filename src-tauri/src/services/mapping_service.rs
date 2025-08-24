use std::{
    collections::{HashMap, HashSet},
    sync::{
        OnceLock,
        atomic::{AtomicBool, Ordering},
    },
    time::{Duration, Instant},
};

use crate::{
    APP, get_app_handle,
    model::{
        config::Config,
        gamepad::{GamepadAxis, GamepadState},
        mapping::*,
    },
    services::{config_service::CONFIG_SERVICE, gamepad_service::GAMEPAD_STATE, virtual_keyboard},
};

use enigo::{Axis, Button as EnigoButton, Coordinate, Enigo, Keyboard, Mouse, Settings};
use tauri::AppHandle;
use tauri_plugin_opener::OpenerExt;
use tokio::{sync::watch, time::sleep};

static MAPPING_ACTIVE: AtomicBool = AtomicBool::new(true);
static MAPPING_ACTIVE_WATCHER: OnceLock<watch::Sender<bool>> = OnceLock::new();

pub fn get_mapping_active() -> bool {
    MAPPING_ACTIVE.load(Ordering::Relaxed)
}

pub fn set_mapping_active(set: bool) {
    MAPPING_ACTIVE.store(set, Ordering::Relaxed);
    let sender = MAPPING_ACTIVE_WATCHER.get_or_init(|| {
        let (tx, _) = watch::channel(set);
        tx
    });
    let _ = sender.send(set);
}

pub fn watch_mapping_active() -> Option<watch::Receiver<bool>> {
    MAPPING_ACTIVE_WATCHER
        .get()
        .map(|sender| sender.subscribe())
}

#[derive(Debug, Clone)]
pub struct MappingState {
    scroll_speed: i32,
    active_actions: HashMap<String, Instant>,
    continuous_actions: HashSet<String>,
    pressed_buttons: HashMap<String, bool>,
    previous_gamepad_state: Option<GamepadState>,
}

impl MappingState {
    pub fn new() -> Self {
        Self {
            scroll_speed: 20, // Between 0 and 100
            continuous_actions: HashSet::new(),
            active_actions: HashMap::new(),
            pressed_buttons: HashMap::new(),
            previous_gamepad_state: None,
        }
    }
}

pub struct MappingExecutor {
    app: AppHandle,
    enigo: Enigo,
    config: Config,
    mapping_state: MappingState,
    scroll_accumulator_x: f32,
    scroll_accumulator_y: f32,
    last_scroll_time: Instant,
}

impl MappingExecutor {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let enigo = Enigo::new(&Settings::default())?;

        if let Some(config_service) = CONFIG_SERVICE.get() {
            set_mapping_active(config_service.get_config().mapping_active_on_boot);
        }

        Ok(Self {
            app: get_app_handle(),
            enigo,
            config: Config::default(),
            mapping_state: MappingState::new(),
            scroll_accumulator_x: 0.0,
            scroll_accumulator_y: 0.0,
            last_scroll_time: Instant::now(),
        })
    }

    pub async fn start_mapping_loop() -> Result<(), Box<dyn std::error::Error>> {
        let mut executor = MappingExecutor::new()?;
        let mut watcher = { GAMEPAD_STATE.read().unwrap().watch_gamepads() };

        loop {
            let mapping_active = MAPPING_ACTIVE.load(Ordering::Relaxed);

            let allowed_actions = if mapping_active {
                None
            } else {
                Some(vec![Action::ToogleMappingActive])
            };

            if !mapping_active {
                sleep(Duration::from_millis(100)).await;
            }

            let has_continuous_actions = !executor.mapping_state.continuous_actions.is_empty();

            if has_continuous_actions {
                tokio::select! {
                    _ = watcher.changed() => {}
                    _ = sleep(Duration::from_millis(8)) => {}
                }
            } else if watcher.changed().await.is_err() {
                continue;
            }

            executor.config = {
                let config = CONFIG_SERVICE.get().unwrap();
                config.get_config()
            };

            let gamepads_map = watcher.borrow_and_update();
            let gamepads: Vec<&GamepadState> = gamepads_map.values().collect();
            gamepads.into_iter().for_each(|gamepad| {
                executor.process_gamepad_state(gamepad, &allowed_actions);
            });
        }
    }

    fn process_gamepad_state(
        &mut self,
        gamepad: &GamepadState,
        allowed_actions: &Option<Vec<Action>>,
    ) {
        for mapping in self.config.mappings.clone().iter() {
            if let Some(allowed_actions) = allowed_actions {
                let action = match mapping {
                    Mapping::ButtonPressed(mapping) => &mapping.action,
                    Mapping::AxisTrigger(mapping) => &mapping.action,
                    Mapping::AxisStick(mapping) => &mapping.action,
                };

                if !allowed_actions.contains(&action) {
                    continue;
                }
            }

            match mapping {
                Mapping::ButtonPressed(mapping) => {
                    if self.is_action_continuous(&mapping.action) {
                        self.mapping_state
                            .continuous_actions
                            .insert(mapping.id.clone());
                    }

                    let once = self.is_action_once(&mapping.action);
                    self.process_button_mapping(gamepad, mapping, once)
                }
                Mapping::AxisTrigger(mapping) => {
                    if self.is_action_continuous(&mapping.action) {
                        self.mapping_state
                            .continuous_actions
                            .insert(mapping.id.clone());
                    }

                    self.process_axis_trigger_mapping(gamepad, mapping)
                }
                Mapping::AxisStick(mapping) => {
                    if self.is_action_continuous(&mapping.action) {
                        self.mapping_state
                            .continuous_actions
                            .insert(mapping.id.clone());
                    }

                    self.process_axis_stick_mapping(gamepad, mapping)
                }
            }
        }

        self.mapping_state.previous_gamepad_state = Some(gamepad.clone());
    }

    fn process_button_mapping(
        &mut self,
        gamepad: &GamepadState,
        mapping: &ButtonMapping,
        once: bool,
    ) {
        let is_pressed: bool = gamepad.is_button_pressed(&mapping.button);
        let action_key: String = mapping.id.clone();

        if is_pressed && self.evaluate_conditions(gamepad, mapping.conditions.clone()) {
            let just_pressed = {
                let was_pressed = self
                    .mapping_state
                    .pressed_buttons
                    .get(&action_key)
                    .copied()
                    .unwrap_or(false);

                if !was_pressed {
                    self.mapping_state
                        .pressed_buttons
                        .insert(action_key.clone(), true);
                    true
                } else {
                    false
                }
            };

            let should_execute: bool = match once {
                true => !self.is_action_active(&action_key) && just_pressed,
                false => is_pressed,
            };

            if should_execute {
                self.execute_action(&mapping.action, Some(action_key.clone()));
            } else {
                self.mapping_state.continuous_actions.remove(&action_key);
            }
        } else {
            self.mapping_state.continuous_actions.remove(&action_key);

            if self.is_action_active(&action_key) {
                self.execute_auto_reset_action(&mapping.action);
            }

            self.stop_action(&action_key);
            self.mapping_state
                .pressed_buttons
                .insert(action_key.clone(), false);
        }
    }

    fn process_axis_trigger_mapping(
        &mut self,
        gamepad: &GamepadState,
        mapping: &AxisTriggerMapping,
    ) {
        let axis_value = gamepad.axis().get(&mapping.axis).copied().unwrap_or(0);
        let normalized_value = axis_value.abs() as f32 / 32767.0;

        let action_key = mapping.id.clone();

        let threshold_met = normalized_value >= mapping.threshold;
        let condition_met = self.evaluate_conditions(gamepad, mapping.conditions.clone());

        if !MAPPING_ACTIVE.load(Ordering::Relaxed) {
            return;
        }

        if threshold_met && condition_met && !self.is_action_active(&action_key) {
            return self.execute_action(&mapping.action, Some(action_key.clone()));
        }

        self.mapping_state.continuous_actions.remove(&action_key);

        if !self.is_action_active(&action_key) {
            return self.stop_action(&action_key);
        }

        self.execute_auto_reset_action(&mapping.action);

        self.stop_action(&action_key);
    }

    fn process_axis_stick_mapping(&mut self, gamepad: &GamepadState, mapping: &AxisStickMapping) {
        let (axis_x, axis_y) = match mapping.stick {
            StickType::LeftStick => (GamepadAxis::LeftX, GamepadAxis::LeftY),
            StickType::RightStick => (GamepadAxis::RightX, GamepadAxis::RightY),
        };

        let ignore_deadzone = match mapping.action.clone() {
            Action::MouseMoveStick { mode, .. } => mode == MouseMoveMode::Absolute,
            _ => false,
        };

        let is_over_deadzone = ignore_deadzone
            || self.stick_is_over_deadzone(
                gamepad.axis().get(&axis_x).copied().unwrap_or(0),
                gamepad.axis().get(&axis_y).copied().unwrap_or(0),
            );

        if !self.evaluate_conditions(gamepad, mapping.conditions.clone()) || !is_over_deadzone {
            self.mapping_state
                .continuous_actions
                .remove(&mapping.id.clone());
            return;
        }

        if !MAPPING_ACTIVE.load(Ordering::Relaxed) {
            return;
        }

        let x_value = gamepad.get_normalized_axis_value(&axis_x);
        let y_value = gamepad.get_normalized_axis_value(&axis_y);

        match &mapping.action {
            Action::MouseMoveStick { .. } => {
                self.execute_mouse_move_stick(x_value, y_value, &mapping.action);
            }
            Action::ScrollStick { .. } => {
                self.execute_scroll_stick(x_value, y_value, &mapping.action);
            }
            _ => {}
        }
    }

    fn execute_auto_reset_action(&mut self, original_action: &Action) {
        match original_action {
            Action::MouseClick { button } => {
                let enigo_button = match button {
                    MouseButton::Left => EnigoButton::Left,
                    MouseButton::Right => EnigoButton::Right,
                    MouseButton::Middle => EnigoButton::Middle,
                };
                let _ = self.enigo.button(enigo_button, enigo::Direction::Release);
            }
            Action::PressKeys { keys } => {
                for key in keys.iter().rev() {
                    let _ = virtual_keyboard::release_key(key, &mut self.enigo);
                }
            }
            _ => {}
        }
    }

    fn evaluate_conditions(&self, gamepad: &GamepadState, conditions: Vec<ConditionType>) -> bool {
        if conditions.is_empty() {
            return true;
        }

        let ors_res = conditions
            .clone()
            .into_iter()
            .filter(|condition| matches!(condition, ConditionType::Or(_condition)))
            .any(|condition| match condition {
                ConditionType::Or(condition) => self.evaluate_condition(gamepad, &condition),
                _ => false,
            });

        let ands_res = conditions
            .clone()
            .into_iter()
            .filter(|condition| matches!(condition, ConditionType::And(_condition)))
            .all(|condition| match condition {
                ConditionType::And(condition) => self.evaluate_condition(gamepad, &condition),
                _ => false,
            });

        ors_res || ands_res
    }

    fn evaluate_condition(&self, gamepad: &GamepadState, condition: &Condition) -> bool {
        match condition {
            Condition::ButtonPressed { button } => gamepad.is_button_pressed(button),
            Condition::ButtonNotPressed { button } => !gamepad.is_button_pressed(button),
        }
    }

    fn execute_action(&mut self, action: &Action, action_key: Option<String>) {
        self.perform_action(action);

        if let Some(key) = action_key {
            self.mark_action_active(key);
        }
    }

    fn perform_action(&mut self, action: &Action) {
        if !MAPPING_ACTIVE.load(Ordering::Relaxed) && !matches!(action, Action::ToogleMappingActive)
        {
            return;
        }

        match action {
            Action::PressKeys { keys } => {
                for key in keys.iter() {
                    let _ = virtual_keyboard::press_key(key, &mut self.enigo, false);
                }
            }
            Action::WriteText { text } => {
                let _ = self.enigo.text(text);
            }
            Action::MouseClick { button } => {
                let enigo_button = match button {
                    MouseButton::Left => EnigoButton::Left,
                    MouseButton::Right => EnigoButton::Right,
                    MouseButton::Middle => EnigoButton::Middle,
                };
                let _ = self.enigo.button(enigo_button, enigo::Direction::Press);
            }
            Action::MouseMoveDirection { direction, speed } => {
                self.execute_mouse_move_direction(direction, *speed);
            }
            Action::ScrollDirection { direction, speed } => {
                self.execute_scroll_direction(direction, *speed);
            }
            Action::OpenWebsite { url } => {
                let _ = self.app.opener().open_url(url, None::<&str>);
            }
            Action::OpenFile { path } => {
                let str_path = path.to_str().unwrap();
                let _ = self.app.opener().open_path(str_path, None::<&str>);
            }
            Action::ToogleMappingActive => {
                let set = !MAPPING_ACTIVE.load(Ordering::Relaxed);
                set_mapping_active(set);
            }
            Action::ToogleVirtualKeyboard => {
                let _ = virtual_keyboard::toogle_vk_window(&get_app_handle());
            }
            _ => {}
        }
    }

    fn execute_mouse_move_stick(&mut self, x_value: f32, y_value: f32, action: &Action) {
        let (mouse_mode, speed) = match action {
            Action::MouseMoveStick { mode, speed } => (mode.to_owned(), speed),
            _ => (MouseMoveMode::Relative, &0),
        };

        let base_speed = *speed as f32;

        let velocity_x = x_value * base_speed;
        let velocity_y = y_value * base_speed;

        let delta_x = velocity_x as i32;
        let delta_y = velocity_y as i32;

        if (delta_x != 0 || delta_y != 0) && mouse_mode == MouseMoveMode::Relative {
            let _ = self.enigo.move_mouse(delta_x, delta_y, Coordinate::Rel);
        } else if mouse_mode == MouseMoveMode::Absolute {
            let mouse_pos = self.app.cursor_position();

            if mouse_pos.is_err() {
                return;
            }

            let mouse_pos = mouse_pos.unwrap();
            let screen_size = self.app.monitor_from_point(mouse_pos.x, mouse_pos.y);

            if screen_size.is_err() {
                return;
            }

            let screen_size = screen_size.unwrap().unwrap();

            let target_x = (((x_value * 1.314159 + 1.0) / 2.0) * screen_size.size().width as f32)
                .round() as i32;
            let target_y = (((y_value * 1.314159 + 1.0) / 2.0) * screen_size.size().height as f32)
                .round() as i32;

            let _ = self.enigo.move_mouse(target_x, target_y, Coordinate::Abs);
        }
    }

    fn execute_scroll_stick(&mut self, x_value: f32, y_value: f32, action: &Action) {
        let speed = match action {
            Action::ScrollStick { speed } => *speed as f32 / 100.0,
            _ => 0.0,
        };

        let scroll_velocity_x = x_value * speed;
        let scroll_velocity_y = y_value * speed;

        self.scroll_accumulator_x += scroll_velocity_x;
        self.scroll_accumulator_y += scroll_velocity_y;

        if self.scroll_accumulator_y.abs() >= 1.0 {
            let scroll_amount = self.scroll_accumulator_y as i32;
            self.scroll_accumulator_y -= scroll_amount as f32;

            if scroll_amount != 0 {
                let _ = self.enigo.scroll(scroll_amount, Axis::Vertical);
            }
        }

        if self.scroll_accumulator_x.abs() >= 1.0 {
            let scroll_amount = self.scroll_accumulator_x as i32;
            self.scroll_accumulator_x -= scroll_amount as f32;

            if scroll_amount != 0 {
                let _ = self.enigo.scroll(scroll_amount, Axis::Horizontal);
            }
        }

        if x_value.abs() < self.config.deadzone && y_value.abs() < self.config.deadzone {
            self.scroll_accumulator_x = 0.0;
            self.scroll_accumulator_y = 0.0;
        }
    }

    fn execute_mouse_move_direction(&mut self, direction: &Direction, speed: u8) {
        let speed_accumulator = speed as i32;

        let (dx, dy) = match direction {
            Direction::Up => (0, -(speed_accumulator)),
            Direction::Down => (0, speed_accumulator),
            Direction::Left => (-(speed_accumulator), 0),
            Direction::Right => (speed_accumulator, 0),
        };

        let _ = self.enigo.move_mouse(dx, dy, Coordinate::Rel);
    }

    fn execute_scroll_direction(&mut self, direction: &Direction, speed: u8) {
        let speed = speed as f32 / 100.0;

        match direction {
            Direction::Up => self.scroll_accumulator_y -= speed,
            Direction::Down => self.scroll_accumulator_y += speed,
            Direction::Left => self.scroll_accumulator_x -= speed,
            Direction::Right => self.scroll_accumulator_x += speed,
        }

        if self.scroll_accumulator_y.abs() >= 1.0 {
            let scroll_amount = self.scroll_accumulator_y as i32;
            self.scroll_accumulator_y -= scroll_amount as f32;

            if scroll_amount != 0 {
                let _ = self.enigo.scroll(scroll_amount, Axis::Vertical);
            }
        }

        if self.scroll_accumulator_x.abs() >= 1.0 {
            let scroll_amount = self.scroll_accumulator_x as i32;
            self.scroll_accumulator_x -= scroll_amount as f32;

            if scroll_amount != 0 {
                let _ = self.enigo.scroll(scroll_amount, Axis::Horizontal);
            }
        }
    }

    fn is_action_once(&self, action: &Action) -> bool {
        !matches!(
            action,
            Action::MouseMoveDirection { .. }
                | Action::MouseMoveStick { .. }
                | Action::ScrollDirection { .. }
                | Action::ScrollStick { .. }
        )
    }

    fn is_action_continuous(&self, action: &Action) -> bool {
        matches!(
            action,
            Action::MouseMoveDirection { .. }
                | Action::MouseMoveStick {
                    mode: MouseMoveMode::Relative,
                    ..
                }
                | Action::ScrollDirection { .. }
                | Action::ScrollStick { .. }
        )
    }

    fn stick_is_over_deadzone(&self, x_value: i16, y_value: i16) -> bool {
        let normalized_x = x_value.abs() as f32 / 32767.0;
        let normalized_y = y_value.abs() as f32 / 32767.0;

        normalized_x > self.config.deadzone || normalized_y > self.config.deadzone
    }

    fn is_action_active(&self, action_key: &str) -> bool {
        self.mapping_state.active_actions.contains_key(action_key)
    }

    fn mark_action_active(&mut self, action_key: String) {
        self.mapping_state
            .active_actions
            .insert(action_key, Instant::now());
    }

    fn stop_action(&mut self, action_key: &str) {
        self.mapping_state.active_actions.remove(action_key);
    }
}

pub async fn start_mapping_system() -> Result<(), Box<dyn std::error::Error>> {
    MappingExecutor::start_mapping_loop().await
}
