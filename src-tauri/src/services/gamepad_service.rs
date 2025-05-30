use std::{
    collections::HashMap,
    error::Error,
    sync::{Arc, LazyLock, RwLock},
};

use sdl2::{
    EventPump, GameControllerSubsystem, Sdl, VideoSubsystem,
    controller::{Axis, Button, GameController},
    event::Event,
};
use tokio::sync::watch;

use crate::model::gamepad::{GamepadAxis, GamepadButton, GamepadState};

pub static GAMEPAD_STATE: LazyLock<Arc<RwLock<GamepadsState>>> =
    LazyLock::new(|| Arc::new(RwLock::new(GamepadsState::new())));

pub fn start_gamepad_monitor() -> Result<(), Box<dyn Error>> {
    let mut monitor = GamepadsMonitor::new()?;
    monitor.start()?;
    Ok(())
}

pub struct GamepadsState {
    gamepads: HashMap<u32, GamepadState>,
    gamepads_tx: watch::Sender<HashMap<u32, GamepadState>>,
}

impl GamepadsState {
    pub fn new() -> Self {
        let gamepads = HashMap::new();
        let (tx, _) = watch::channel(gamepads.clone());
        Self {
            gamepads,
            gamepads_tx: tx,
        }
    }

    fn broadcast(&self, gamepads: HashMap<u32, GamepadState>) {
        let _ = self.gamepads_tx.send(gamepads);
    }

    pub fn watch_gamepads(&self) -> watch::Receiver<HashMap<u32, GamepadState>> {
        self.gamepads_tx.subscribe()
    }

    pub fn get_gamepads(&self) -> HashMap<u32, GamepadState> {
        self.gamepads.clone()
    }
}
struct GamepadsMonitor {
    sdl_context: Sdl,
    controller_subsystem: GameControllerSubsystem,
    video_subsystem: VideoSubsystem,
    gamepads: HashMap<u32, GameController>,
}

impl GamepadsMonitor {
    pub fn new() -> Result<Self, Box<dyn Error>> {
        sdl2::hint::set("SDL_INIT_GAMEPAD", "1");
        sdl2::hint::set("SDL_HINT_JOYSTICK_ALLOW_BACKGROUND_EVENTS", "1");
        sdl2::hint::set("SDL_JOYSTICK_THREAD", "1");

        let sdl_context = sdl2::init().map_err(|e| format!("Échec d'initialisation SDL: {}", e))?;
        let controller_subsystem = sdl_context
            .game_controller()
            .map_err(|e| format!("Échec d'initialisation du sous-système de manette: {}", e))?;
        let video_subsystem = sdl_context.video()?;

        Ok(Self {
            sdl_context,
            controller_subsystem,
            video_subsystem,
            gamepads: HashMap::new(),
        })
    }

    pub fn start(&mut self) -> Result<(), Box<dyn Error>> {
        println!("Starting gamepad monitor");

        self.controller_subsystem.set_event_state(true);
        let mut event_pump = self
            .sdl_context
            .event_pump()
            .map_err(|e| format!("Failed to create event pump: {}", e))?;

        self.update_events(&mut event_pump)?;

        Ok(())
    }

    fn update_events(&mut self, event_pump: &mut EventPump) -> Result<(), Box<dyn Error>> {
        for event in event_pump.wait_iter() {
            let mut state = GAMEPAD_STATE.write().unwrap();

            match event {
                Event::Quit { .. } => {
                    break;
                }
                Event::ControllerButtonDown { which, button, .. }
                | Event::ControllerButtonUp { which, button, .. } => {
                    let pressed = matches!(event, Event::ControllerButtonDown { .. });

                    if let Some(gamepad) = state.gamepads.get_mut(&which) {
                        gamepad.set_button(sdl_button_to_gamepad_button(&button), pressed);
                        state.broadcast(state.gamepads.clone());
                    }
                }
                Event::ControllerAxisMotion {
                    timestamp: _,
                    which,
                    axis,
                    value,
                } => {
                    if let Some(gamepad) = state.gamepads.get_mut(&which) {
                        gamepad.set_axis(sdl_axis_to_gamepad_axis(&axis), value);
                        state.broadcast(state.gamepads.clone());
                    }
                }
                Event::ControllerDeviceAdded { .. } => {
                    if let Ok(gamepad) = self.add_device() {
                        state.gamepads.insert(gamepad.id(), gamepad);
                        state.broadcast(state.gamepads.clone());
                    }
                }
                Event::ControllerDeviceRemoved { which, .. } => {
                    state.gamepads.remove(&which);
                    state.broadcast(state.gamepads.clone());
                }
                _ => {}
            }
        }

        Ok(())
    }

    fn add_device(&mut self) -> Result<GamepadState, Box<dyn Error>> {
        let num_joysticks = self.controller_subsystem.num_joysticks()?;

        for i in 0..num_joysticks {
            if !self.controller_subsystem.is_game_controller(i) {
                continue;
            }

            let gamepadcontroller = match self.controller_subsystem.open(i) {
                Ok(controller) => controller,
                Err(_) => continue,
            };

            if !gamepadcontroller.attached() {
                continue;
            }

            let gamepad = GamepadState::from_sdl_gamepad(&gamepadcontroller);

            self.gamepads
                .insert(gamepadcontroller.instance_id(), gamepadcontroller);
            return Ok(gamepad);
        }

        Err("No gamepad found".to_string().into())
    }
}

pub fn sdl_button_to_gamepad_button(button: &Button) -> GamepadButton {
    match button {
        Button::A => GamepadButton::A,
        Button::B => GamepadButton::B,
        Button::X => GamepadButton::X,
        Button::Y => GamepadButton::Y,
        Button::Back => GamepadButton::Back,
        Button::Guide => GamepadButton::Guide,
        Button::Start => GamepadButton::Start,
        Button::LeftStick => GamepadButton::LeftStick,
        Button::RightStick => GamepadButton::RightStick,
        Button::LeftShoulder => GamepadButton::LeftShoulder,
        Button::RightShoulder => GamepadButton::RightShoulder,
        Button::DPadUp => GamepadButton::DPadUp,
        Button::DPadDown => GamepadButton::DPadDown,
        Button::DPadLeft => GamepadButton::DPadLeft,
        Button::DPadRight => GamepadButton::DPadRight,
        Button::Misc1 => GamepadButton::Misc1,
        Button::Paddle1 => GamepadButton::Paddle1,
        Button::Paddle2 => GamepadButton::Paddle2,
        Button::Paddle3 => GamepadButton::Paddle3,
        Button::Paddle4 => GamepadButton::Paddle4,
        Button::Touchpad => GamepadButton::Touchpad,
    }
}

pub fn sdl_axis_to_gamepad_axis(axis: &Axis) -> GamepadAxis {
    match axis {
        Axis::LeftX => GamepadAxis::LeftX,
        Axis::LeftY => GamepadAxis::LeftY,
        Axis::RightX => GamepadAxis::RightX,
        Axis::RightY => GamepadAxis::RightY,
        Axis::TriggerLeft => GamepadAxis::TriggerLeft,
        Axis::TriggerRight => GamepadAxis::TriggerRight,
    }
}
