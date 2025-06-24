use serde::{Deserialize, Serialize};
use ts_rs::TS;

use super::mapping::Mapping;

#[derive(Debug, Serialize, Deserialize, Default, Clone, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../src/ts/bindings/config.ts")]
pub struct Config {
    pub mapping_active_on_boot: bool,
    pub mappings: Vec<Mapping>,
    pub deadzone: f32,
    pub keyboard_layout: Option<String>,
}

impl Config {
    pub fn default() -> Self {
        Self {
            mapping_active_on_boot: true,
            mappings: vec![],
            deadzone: 0.1,
            keyboard_layout: None,
        }
    }

    pub fn set(&mut self, key: &str, value: serde_json::Value) {
        match key {
            "mapping_active_on_boot" => {
                self.mapping_active_on_boot = serde_json::from_value(value).unwrap_or(true)
            }
            "mappings" => self.mappings = serde_json::from_value(value).unwrap(),
            "deadzone" => self.deadzone = serde_json::from_value(value).unwrap_or(0.1),
            _ => {}
        }
    }
}
