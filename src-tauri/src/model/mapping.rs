use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use tauri::Url;
use ts_rs::TS;

use super::gamepad::{GamepadAxis, GamepadButton};

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../src/ts/bindings/mapping.ts")]
pub enum BooleanOperator {
    And,
    Or,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(tag = "type", rename_all = "camelCase")]
#[ts(export, export_to = "../../src/ts/bindings/mapping.ts")]
pub enum Condition {
    ButtonPressed { button: GamepadButton },
    ButtonNotPressed { button: GamepadButton },
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(tag = "operator", rename_all = "camelCase")]
#[ts(export, export_to = "../../src/ts/bindings/mapping.ts")]
pub enum ConditionType {
    And(Condition),
    Or(Condition),
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(tag = "type", rename_all = "camelCase")]
#[ts(export, export_to = "../../src/ts/bindings/mapping.ts")]
pub enum Action {
    // Keyboard actions
    PressKeys { keys: Vec<String> },
    WriteText { text: String },

    // Mouse actions - for buttons (with direction)
    MouseMoveDirection { direction: Direction },
    MouseClick { button: MouseButton },

    // Mouse actions - for sticks (all directions)
    MouseMoveStick { mode: MouseMoveMode },

    // Scroll actions - for buttons (with direction)
    ScrollDirection { direction: Direction },

    // Scroll actions - for sticks (all directions)
    ScrollStick,

    // App actions
    ToogleMappingActive,
    SetMouseSensitivity { sensitivity: f32 },

    // System actions
    OpenWebsite { url: String },
    OpenFile { path: PathBuf },
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../src/ts/bindings/mapping.ts")]
pub enum MouseButton {
    Left,
    Right,
    Middle,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../src/ts/bindings/mapping.ts")]
pub enum Direction {
    Up,
    Down,
    Left,
    Right,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../src/ts/bindings/mapping.ts")]
pub enum MouseMoveMode {
    Relative, // Comportement souris normal
    Absolute, // Position stick mappée sur écran
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../src/ts/bindings/mapping.ts")]
pub enum StickType {
    LeftStick,  // LeftX (0) + LeftY (1)
    RightStick, // RightX (2) + RightY (3)
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../src/ts/bindings/mapping.ts")]
pub struct ButtonMapping {
    pub id: String,
    pub button: GamepadButton,
    pub action: Action,
    #[serde(default = "Vec::default")]
    pub conditions: Vec<ConditionType>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../src/ts/bindings/mapping.ts")]
pub struct AxisTriggerMapping {
    pub id: String,
    pub axis: GamepadAxis,
    pub threshold: f32,
    #[serde(default = "Vec::default")]
    pub conditions: Vec<ConditionType>,
    pub action: Action,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../src/ts/bindings/mapping.ts")]
pub struct AxisStickMapping {
    pub id: String,
    pub stick: StickType,
    pub action: Action,
    #[serde(default = "Vec::default")]
    pub conditions: Vec<ConditionType>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(tag = "type", rename_all = "camelCase")]
#[ts(export, export_to = "../../src/ts/bindings/mapping.ts")]
pub enum Mapping {
    ButtonPressed(ButtonMapping),
    AxisTrigger(AxisTriggerMapping),
    AxisStick(AxisStickMapping),
}
