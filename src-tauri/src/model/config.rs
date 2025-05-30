use serde::{Deserialize, Serialize};
use ts_rs::TS;

use super::mapping::Mapping;

#[derive(Debug, Serialize, Deserialize, Default, Clone, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../src/ts/bindings/config.ts")]
pub struct Config {
    pub start_on_boot: bool,
    pub mappings: Vec<Mapping>,
    pub mouse_sensitivity: f32,
    pub scroll_distance: f32,
    pub deadzone: f32,
}

impl Config {
    pub fn default() -> Self {
        Self {
            start_on_boot: true,
            mappings: vec![],
            mouse_sensitivity: 5.0,
            scroll_distance: 1.0,
            deadzone: 0.1,
        }
    }

    pub fn set(&mut self, key: &str, value: serde_json::Value) {
        match key {
            "start_on_boot" => self.start_on_boot = serde_json::from_value(value).unwrap_or(true),
            "mappings" => self.mappings = serde_json::from_value(value).unwrap(),
            "mouse_sensitivity" => {
                self.mouse_sensitivity = serde_json::from_value(value).unwrap_or(5.0)
            }
            "scroll_distance" => {
                self.scroll_distance = serde_json::from_value(value).unwrap_or(1.0)
            }
            "deadzone" => self.deadzone = serde_json::from_value(value).unwrap_or(0.1),
            _ => {}
        }
    }
}
