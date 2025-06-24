use std::{
    cell::RefCell,
    collections::HashMap,
    sync::{
        LazyLock, OnceLock,
        atomic::{AtomicBool, Ordering},
    },
    time::{Duration, Instant},
};

use crate::{
    model::{
        config::Config,
        gamepad::{GamepadAxis, GamepadState},
        mapping::*,
    },
    services::{config_service::CONFIG_SERVICE, gamepad_service::GAMEPAD_STATE, virtual_keyboard},
};

use enigo::{Axis, Button as EnigoButton, Coordinate, Enigo, Key, Keyboard, Mouse, Settings};
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
    mouse_sensitivity: f32,
    scroll_speed: i32,
    active_actions: HashMap<String, Instant>,
    pressed_buttons: HashMap<String, bool>,
    previous_gamepad_state: Option<GamepadState>,
}

impl MappingState {
    pub fn new() -> Self {
        Self {
            mouse_sensitivity: 5.0,
            scroll_speed: 90, // Between 0 and 100
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
    last_frame_time: Instant,
    scroll_accumulator_x: f32,
    scroll_accumulator_y: f32,
    last_scroll_time: Instant,
}

impl MappingExecutor {
    pub fn new(app: AppHandle) -> Result<Self, Box<dyn std::error::Error>> {
        let enigo = Enigo::new(&Settings::default())?;

        if let Some(config_service) = CONFIG_SERVICE.get() {
            set_mapping_active(config_service.get_config().start_on_boot);
        }

        Ok(Self {
            app: app.clone(),
            enigo,
            config: Config::default(),
            mapping_state: MappingState::new(),
            last_frame_time: Instant::now(),
            scroll_accumulator_x: 0.0,
            scroll_accumulator_y: 0.0,
            last_scroll_time: Instant::now(),
        })
    }

    pub async fn start_mapping_loop(app: AppHandle) -> Result<(), Box<dyn std::error::Error>> {
        let mut executor = MappingExecutor::new(app)?;

        loop {
            executor.config = {
                let config = CONFIG_SERVICE.get().unwrap();
                config.get_config()
            };

            let gamepads = {
                let state = GAMEPAD_STATE.read().unwrap();
                state.get_gamepads()
            };

            if let Some(gamepad) = gamepads.values().next() {
                executor.process_gamepad_state(gamepad.clone());
            }

            sleep(Duration::from_millis(4)).await;
        }
    }

    fn process_gamepad_state(&mut self, gamepad: GamepadState) {
        let now = Instant::now();
        let delta_time = now.duration_since(self.last_frame_time).as_secs_f32();
        self.last_frame_time = now;

        for mapping in self.config.mappings.clone().iter() {
            match mapping {
                Mapping::ButtonPressed(mapping) => {
                    let once = self.is_action_once(&mapping.action);
                    self.process_button_mapping(&gamepad, mapping, delta_time, once)
                }
                Mapping::AxisTrigger(mapping) => {
                    self.process_axis_trigger_mapping(&gamepad, mapping, delta_time)
                }
                Mapping::AxisStick(mapping) => {
                    self.process_axis_stick_mapping(&gamepad, mapping, delta_time)
                }
            }
        }

        self.mapping_state.previous_gamepad_state = Some(gamepad);
    }

    fn process_button_mapping(
        &mut self,
        gamepad: &GamepadState,
        mapping: &ButtonMapping,
        delta_time: f32,
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
                self.execute_action(&mapping.action, Some(action_key.clone()), delta_time);
            }
        } else {
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
        delta_time: f32,
    ) {
        let axis_value = gamepad.axis().get(&mapping.axis).copied().unwrap_or(0);
        let normalized_value = (axis_value.abs() as f32 / 32767.0) * 100.0;

        let action_key = mapping.id.clone();

        let threshold_met = normalized_value >= mapping.threshold;
        let condition_met = self.evaluate_conditions(gamepad, mapping.conditions.clone());

        if !MAPPING_ACTIVE.load(Ordering::Relaxed) {
            return;
        }

        if threshold_met && condition_met && !self.is_action_active(&action_key) {
            return self.execute_action(&mapping.action, Some(action_key.clone()), delta_time);
        }

        if !self.is_action_active(&action_key) {
            return self.stop_action(&action_key);
        }

        self.execute_auto_reset_action(&mapping.action);

        self.stop_action(&action_key);
    }

    fn process_axis_stick_mapping(
        &mut self,
        gamepad: &GamepadState,
        mapping: &AxisStickMapping,
        delta_time: f32,
    ) {
        if !self.evaluate_conditions(gamepad, mapping.conditions.clone()) {
            return;
        }

        if !MAPPING_ACTIVE.load(Ordering::Relaxed) {
            return;
        }

        let (axis_x, axis_y) = match mapping.stick {
            StickType::LeftStick => (GamepadAxis::LeftX, GamepadAxis::LeftY),
            StickType::RightStick => (GamepadAxis::RightX, GamepadAxis::RightY),
        };

        let x_value = gamepad.get_normalized_axis_value(&axis_x);
        let y_value = gamepad.get_normalized_axis_value(&axis_y);

        match &mapping.action {
            Action::MouseMoveStick { .. } => {
                self.execute_mouse_move_stick(x_value, y_value, &mapping.action, delta_time);
            }
            Action::ScrollStick => {
                self.execute_scroll_stick(x_value, y_value, &mapping.action, delta_time);
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

        let ors = conditions
            .clone()
            .into_iter()
            .filter(|condition| matches!(condition, ConditionType::Or(_condition)));

        let ands = conditions
            .clone()
            .into_iter()
            .filter(|condition| matches!(condition, ConditionType::And(_condition)));

        let ors_res = ors.into_iter().any(|condition| match condition {
            ConditionType::Or(condition) => self.evaluate_condition(gamepad, &condition),
            _ => false,
        });

        let ands_res = ands.into_iter().all(|condition| match condition {
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

    fn execute_action(&mut self, action: &Action, action_key: Option<String>, delta_time: f32) {
        self.perform_action(action, delta_time);

        if let Some(key) = action_key {
            self.mark_action_active(key);
        }
    }

    fn perform_action(&mut self, action: &Action, delta_time: f32) {
        if !MAPPING_ACTIVE.load(Ordering::Relaxed) && !matches!(action, Action::ToogleMappingActive)
        {
            return;
        }

        match action {
            Action::PressKeys { keys } => {
                for key in keys.iter() {
                    let _ = virtual_keyboard::press_key(key, &mut self.enigo);
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
            Action::MouseMoveDirection { direction } => {
                self.execute_mouse_move_direction(direction, delta_time);
            }
            Action::ScrollDirection { direction } => {
                self.execute_scroll_direction(direction);
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
                println!("Set mapping active: {}", set);
            }
            _ => {}
        }
    }

    fn execute_mouse_move_stick(
        &mut self,
        x_value: f32,
        y_value: f32,
        action: &Action,
        delta_time: f32,
    ) {
        let base_speed =
            self.mapping_state.mouse_sensitivity * self.mapping_state.mouse_sensitivity * 100.0;

        let velocity_x = x_value * base_speed;
        let velocity_y = y_value * base_speed;

        let delta_x = (velocity_x * delta_time) as i32;
        let delta_y = (velocity_y * delta_time) as i32;

        let mouse_mode = match action {
            Action::MouseMoveStick { mode } => mode.to_owned(),
            _ => MouseMoveMode::Relative,
        };

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

            let target_x = ((x_value * 1.314 + 1.0) / 2.0) * screen_size.size().width as f32;
            let target_y = ((y_value * 1.314 + 1.0) / 2.0) * screen_size.size().height as f32;

            let _ = self
                .enigo
                .move_mouse(target_x as i32, target_y as i32, Coordinate::Abs);
        }
    }

    fn execute_scroll_stick(
        &mut self,
        x_value: f32,
        y_value: f32,
        _action: &Action,
        delta_time: f32,
    ) {
        let scroll_velocity_x = x_value * self.get_scroll_speed();
        let scroll_velocity_y = y_value * self.get_scroll_speed();

        self.scroll_accumulator_x += scroll_velocity_x * delta_time;
        self.scroll_accumulator_y += scroll_velocity_y * delta_time;

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
                if scroll_amount > 0 {
                    let _ = self.enigo.scroll(scroll_amount, Axis::Horizontal);
                } else {
                    let _ = self.enigo.scroll(-scroll_amount, Axis::Horizontal);
                }
            }
        }

        if x_value.abs() < 0.1 && y_value.abs() < 0.1 {
            self.scroll_accumulator_x = 0.0;
            self.scroll_accumulator_y = 0.0;
        }
    }

    fn execute_mouse_move_direction(&mut self, direction: &Direction, delta_time: f32) {
        let speed_accumulator = self.mapping_state.mouse_sensitivity * 100.0 * delta_time;

        let (dx, dy) = match direction {
            Direction::Up => (0, -(speed_accumulator as i32)),
            Direction::Down => (0, speed_accumulator as i32),
            Direction::Left => (-(speed_accumulator as i32), 0),
            Direction::Right => (speed_accumulator as i32, 0),
        };

        let _ = self.enigo.move_mouse(dx, dy, Coordinate::Rel);
    }

    fn execute_scroll_direction(&mut self, direction: &Direction) {
        let time_since_last_scroll = self.last_scroll_time.elapsed().as_secs_f32();

        if time_since_last_scroll < self.get_scroll_speed() {
            return;
        }

        let res = match direction {
            Direction::Up => Some(self.enigo.scroll(-1, Axis::Vertical)),
            Direction::Down => Some(self.enigo.scroll(1, Axis::Vertical)),
            Direction::Left => Some(self.enigo.scroll(-1, Axis::Horizontal)),
            Direction::Right => Some(self.enigo.scroll(1, Axis::Horizontal)),
            _ => None,
        };

        if res.is_some() {
            self.last_scroll_time = Instant::now();
        }
    }

    fn is_action_once(&self, action: &Action) -> bool {
        !matches!(
            action,
            Action::MouseMoveDirection { .. }
                | Action::MouseMoveStick { .. }
                | Action::ScrollDirection { .. }
                | Action::ScrollStick
        )
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

    fn get_scroll_speed(&self) -> f32 {
        (100 - self.mapping_state.scroll_speed) as f32 / 100.0
    }
}

pub async fn start_mapping_system(app: AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    MappingExecutor::start_mapping_loop(app).await
}
