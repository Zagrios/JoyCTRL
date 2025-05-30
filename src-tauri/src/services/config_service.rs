use std::{
    path::PathBuf,
    sync::{Arc, OnceLock},
};

use serde::{Serialize, de::DeserializeOwned};
use tauri::{AppHandle, Wry};
use tauri_plugin_store::{Store, StoreExt, resolve_store_path};
use tokio::sync::watch;

use crate::model::config::Config;

const ROOT_KEY: &str = "config";

pub static CONFIG_SERVICE: OnceLock<ConfigService> = OnceLock::new();

pub struct ConfigService {
    app: AppHandle,
    store: Arc<Store<Wry>>,
    tx: watch::Sender<Config>,
}

impl ConfigService {
    pub fn get_instance(app: &AppHandle) -> &'static ConfigService {
        CONFIG_SERVICE.get_or_init(|| ConfigService::new(app.clone()))
    }

    pub fn new(app: AppHandle) -> Self {
        let store = app.store("config.cfg").unwrap();
        let (tx, _) = watch::channel(
            store
                .get(ROOT_KEY)
                .map(|value| serde_json::from_value(value).unwrap_or(Config::default()))
                .unwrap_or(Config::default()),
        );
        Self { app, store, tx }
    }

    pub fn get_config(&self) -> Config {
        self.store
            .get(ROOT_KEY)
            .map(|value| serde_json::from_value(value).unwrap_or(Config::default()))
            .unwrap_or(Config::default())
    }

    pub fn watch(&self) -> watch::Receiver<Config> {
        self.tx.subscribe()
    }

    pub fn set(&self, key: &str, value: serde_json::Value) {
        println!("set config AA: {:?} {:?}", key, value);
        let mut config = self.get_config();
        config.set(key, value.clone());
        self.store
            .set(ROOT_KEY, serde_json::to_value(config).unwrap());
        let _ = self.store.save();
        let _ = self.tx.send(self.get_config());
    }
}
