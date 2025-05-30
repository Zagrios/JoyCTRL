use std::sync::OnceLock;

use services::config_service::{CONFIG_SERVICE, ConfigService};
use tauri::AppHandle;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod ipcs;
mod model;
mod services;

pub static APP: OnceLock<AppHandle> = OnceLock::new();

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let _ = APP.set(app.handle().clone());

            tauri::async_runtime::block_on(async {
                ipcs::init(app.handle().clone()).await;
                let _ = CONFIG_SERVICE.set(ConfigService::new(app.handle().clone()));
            });

            std::thread::spawn(|| {
                let _ = services::gamepad_service::start_gamepad_monitor();
            });

            let handle = app.handle().clone();

            tauri::async_runtime::spawn(async move {
                if let Err(e) = crate::services::mapping_service::start_mapping_system(handle).await
                {
                    eprintln!("Erreur du système de mapping: {}", e);
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![services::ipc_service::joyctrl_ipc])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
