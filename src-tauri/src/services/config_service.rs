use std::sync::{Arc, OnceLock};
use tauri::{AppHandle, Wry};
use tauri_plugin_store::{Store, StoreExt};
use tokio::sync::watch;

use crate::{get_app_handle, model::config::Config};

const ROOT_KEY: &str = "config";

static CONFIG_RECEIVER: OnceLock<watch::Receiver<Config>> = OnceLock::new();
pub static CONFIG_SERVICE: OnceLock<ConfigService> = OnceLock::new();

pub struct ConfigService {
    store: Arc<Store<Wry>>,
    tx: watch::Sender<Config>,
}

impl ConfigService {
    pub fn get_instance() -> &'static ConfigService {
        CONFIG_SERVICE.get_or_init(|| ConfigService::new(get_app_handle()))
    }

    pub fn new(app: AppHandle) -> Self {
        let store = app.store("config.cfg").unwrap();
        let (tx, rx) = watch::channel(
            store
                .get(ROOT_KEY)
                .map(|value| serde_json::from_value(value).unwrap_or(Config::default()))
                .unwrap_or(Config::default()),
        );

        let _ = CONFIG_RECEIVER.set(rx);

        Self { store, tx }
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
