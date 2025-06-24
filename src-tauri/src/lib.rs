use std::sync::OnceLock;

use services::config_service::{CONFIG_SERVICE, ConfigService};
use tauri::{AppHandle, Manager, menu::Menu, menu::MenuItem, tray::TrayIconBuilder};

use crate::services::{mapping_service, virtual_keyboard};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod ipcs;
mod model;
mod services;

pub static APP: OnceLock<AppHandle> = OnceLock::new();

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _, _| {
            let _ = app
                .get_webview_window("main")
                .expect("Failed to get main window")
                .set_focus();
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let _ = APP.set(app.handle().clone());

            tauri::async_runtime::block_on(async {
                ipcs::init().await;
                let _ = CONFIG_SERVICE.set(ConfigService::new(app.handle().clone()));
            });

            std::thread::spawn(|| {
                let _ = services::gamepad_service::start_gamepad_monitor();
            });

            tauri::async_runtime::spawn(async move {
                mapping_service::start_mapping_system().await.unwrap();
            });

            let open_i = MenuItem::with_id(app, "open", "Open", true, None::<&str>)?;
            let keyboard_i =
                MenuItem::with_id(app, "keyboard", "Virtual keyboard", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open_i, &keyboard_i, &quit_i])?;

            let tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "open" => {
                        let _ = app
                            .get_webview_window("main")
                            .expect("Failed to get main window")
                            .set_focus();
                    }
                    "keyboard" => {
                        virtual_keyboard::toogle_vk_window(app).unwrap_or_else(|e| {
                            eprintln!("Error toggling virtual keyboard: {}", e);
                        });
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![services::ipc_service::joyctrl_ipc])
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    app.run(|_handle, event| {
        if let tauri::RunEvent::Exit = event {
            println!("App exit requested");

            virtual_keyboard::release_all_keys(&mut virtual_keyboard::get_vk_enigo())
                .unwrap_or_else(|e| {
                    eprintln!("Error releasing all keys: {}", e);
                });
        }
    });
}

pub fn get_app_handle() -> AppHandle {
    APP.get().unwrap().clone()
}
