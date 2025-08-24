use sdl3::{
    EventPump, GamepadSubsystem, Sdl,
    event::Event,
    gamepad::{Axis, Button, Gamepad},
};
use std::{
    collections::HashMap,
    error::Error,
    sync::{Arc, LazyLock, OnceLock, RwLock},
};
use tokio::sync::watch;

use crate::model::gamepad::{GamepadAxis, GamepadButton, GamepadState};

static GAMEPAD_STATE_RECEIVER: OnceLock<watch::Receiver<HashMap<u32, GamepadState>>> =
    OnceLock::new();

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
        let (tx, rx) = watch::channel(gamepads.clone());

        let _ = GAMEPAD_STATE_RECEIVER.set(rx);

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
    controller_subsystem: GamepadSubsystem,
    gamepads: HashMap<u32, Gamepad>,
}

impl GamepadsMonitor {
    pub fn new() -> Result<Self, Box<dyn Error>> {
        let sdl_context: Sdl = sdl3::init()?;
        let controller_subsystem = sdl_context.gamepad()?;

        Ok(Self {
            sdl_context,
            controller_subsystem,
            gamepads: HashMap::new(),
        })
    }

    pub fn start(&mut self) -> Result<(), Box<dyn Error>> {
        println!("Starting gamepad monitor");

        self.controller_subsystem.set_events_processing_state(true);

        let mut event_pump = self
            .sdl_context
            .event_pump()
            .map_err(|e| format!("Failed to create event pump: {}", e))?;

        self.update_events(&mut event_pump)?;

        Ok(())
    }

    fn update_events(&mut self, event_pump: &mut EventPump) -> Result<(), Box<dyn Error>> {
        for event in event_pump.wait_iter() {
            let mut state = { GAMEPAD_STATE.write().unwrap() };

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
                    let res = self.add_device();
                    if let Ok(gamepad) = &res {
                        println!("Gamepad added: {}", gamepad.id());
                        state.gamepads.insert(gamepad.id(), gamepad.clone());
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
        let pad_ids = self.controller_subsystem.gamepads()?;

        for id in pad_ids {
            if !self.controller_subsystem.is_gamepad(id) {
                continue;
            }

            let gamepadcontroller = match self.controller_subsystem.open(id) {
                Ok(controller) => controller,
                Err(_) => continue,
            };

            if !gamepadcontroller.connected() {
                continue;
            }

            let gamepad = GamepadState::from_sdl_gamepad(&gamepadcontroller);

            self.gamepads
                .insert(gamepadcontroller.id().unwrap(), gamepadcontroller);

            return Ok(gamepad);
        }

        Err("No gamepad found".to_string().into())
    }
}

pub fn sdl_button_to_gamepad_button(button: &Button) -> GamepadButton {
    match button {
        Button::South => GamepadButton::A,
        Button::East => GamepadButton::B,
        Button::West => GamepadButton::X,
        Button::North => GamepadButton::Y,
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
        Button::LeftPaddle1 => GamepadButton::Paddle1,
        Button::RightPaddle1 => GamepadButton::Paddle2,
        Button::LeftPaddle2 => GamepadButton::Paddle3,
        Button::RightPaddle2 => GamepadButton::Paddle4,
        Button::Touchpad => GamepadButton::Touchpad,
        _ => GamepadButton::A,
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
