use std::collections::HashMap;

use sdl2::{controller::GameController, sensor::SensorType};
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../src/ts/bindings/gamepad.ts")]
pub enum GamepadButton {
    A,
    B,
    X,
    Y,
    Back,
    Guide,
    Start,
    LeftStick,
    RightStick,
    LeftShoulder,
    RightShoulder,
    DPadUp,
    DPadDown,
    DPadLeft,
    DPadRight,
    Misc1,
    Paddle1,
    Paddle2,
    Paddle3,
    Paddle4,
    Touchpad,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../src/ts/bindings/gamepad.ts")]
pub enum GamepadAxis {
    LeftX,
    LeftY,
    RightX,
    RightY,
    TriggerLeft,
    TriggerRight,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../src/ts/bindings/gamepad.ts")]
pub struct GamepadState {
    id: u32,
    name: String,
    #[ts(type = "Record<GamepadButton, boolean>")]
    buttons: HashMap<GamepadButton, bool>,
    #[ts(type = "Record<GamepadAxis, number>")]
    axis: HashMap<GamepadAxis, i16>,
}

impl GamepadState {
    pub fn new(id: u32, name: String) -> Self {
        let mut buttons: HashMap<GamepadButton, bool> = HashMap::with_capacity(21);
        let mut axis: HashMap<GamepadAxis, i16> = HashMap::with_capacity(6);

        buttons.insert(GamepadButton::A, false);
        buttons.insert(GamepadButton::B, false);
        buttons.insert(GamepadButton::X, false);
        buttons.insert(GamepadButton::Y, false);
        buttons.insert(GamepadButton::Back, false);
        buttons.insert(GamepadButton::Guide, false);
        buttons.insert(GamepadButton::Start, false);
        buttons.insert(GamepadButton::LeftStick, false);
        buttons.insert(GamepadButton::RightStick, false);
        buttons.insert(GamepadButton::LeftShoulder, false);
        buttons.insert(GamepadButton::RightShoulder, false);
        buttons.insert(GamepadButton::DPadUp, false);
        buttons.insert(GamepadButton::DPadDown, false);
        buttons.insert(GamepadButton::DPadLeft, false);
        buttons.insert(GamepadButton::DPadRight, false);
        buttons.insert(GamepadButton::Misc1, false);
        buttons.insert(GamepadButton::Paddle1, false);
        buttons.insert(GamepadButton::Paddle2, false);
        buttons.insert(GamepadButton::Paddle3, false);
        buttons.insert(GamepadButton::Paddle4, false);
        buttons.insert(GamepadButton::Touchpad, false);

        axis.insert(GamepadAxis::LeftX, 0);
        axis.insert(GamepadAxis::LeftY, 0);
        axis.insert(GamepadAxis::RightX, 0);
        axis.insert(GamepadAxis::RightY, 0);
        axis.insert(GamepadAxis::TriggerLeft, 0);
        axis.insert(GamepadAxis::TriggerRight, 0);

        Self {
            id,
            name,
            buttons,
            axis,
        }
    }

    pub fn from_sdl_gamepad(gamepad: &GameController) -> Self {
        Self::new(gamepad.instance_id(), gamepad.name())
    }

    pub fn set_button(&mut self, button: GamepadButton, pressed: bool) {
        self.buttons.insert(button, pressed);
    }

    pub fn set_axis(&mut self, axis: GamepadAxis, value: i16) {
        self.axis
            .insert(axis, value.clamp(i16::MIN + 1, i16::MAX - 1)); // prevent overflow errors
    }

    pub fn id(&self) -> u32 {
        self.id
    }

    pub fn axis(&self) -> &HashMap<GamepadAxis, i16> {
        &self.axis
    }

    pub fn is_button_pressed(&self, button: &GamepadButton) -> bool {
        self.buttons.get(button).unwrap_or(&false).to_owned()
    }

    pub fn get_normalized_axis_value(&self, axis: &GamepadAxis) -> f32 {
        // contrain coords between -1 and 1
        let coord = *self.axis.get(axis).unwrap_or(&0);

        if coord == 0 {
            return 0.0;
        }

        (coord as f32 / i16::MAX as f32).clamp(-1.0, 1.0)
    }
}
