use crate::{
    APP,
    services::{ipc_service::IpcService, virtual_keyboard},
};

pub async fn register() {
    let ipc = IpcService::get_instance();

    ipc.on(
        "toogle-virtual-keyboard",
        async |_, _replier| -> Result<(), Box<dyn std::error::Error>> {
            let app = APP.get().ok_or("App not found")?;
            virtual_keyboard::toogle_vk_window(app)?;
            Ok(())
        },
    )
    .await;

    ipc.on(
        "press-keys",
        async |data, _replier| -> Result<(), Box<dyn std::error::Error>> {
            let keys: Vec<String> = serde_json::from_value(data.unwrap_or(serde_json::json!([])))?;
            let mut enigo = virtual_keyboard::get_vk_enigo();
            for key in keys {
                virtual_keyboard::press_key(&key, &mut enigo, true)?;
            }
            Ok(())
        },
    )
    .await;

    ipc.on(
        "release-keys",
        async |data, _replier| -> Result<(), Box<dyn std::error::Error>> {
            let keys: Vec<String> = serde_json::from_value(data.unwrap_or(serde_json::json!([])))?;
            let mut enigo = virtual_keyboard::get_vk_enigo();
            for key in keys {
                virtual_keyboard::release_key(&key, &mut enigo)?;
            }
            Ok(())
        },
    )
    .await;

    ipc.on(
        "write-text",
        async |data, _replier| -> Result<(), Box<dyn std::error::Error>> {
            let text: String = serde_json::from_value(data.unwrap_or(serde_json::json!("")))?;
            println!("Writing text: {}", text);
            let mut enigo = virtual_keyboard::get_vk_enigo();
            virtual_keyboard::write_text(&text, &mut enigo, true)?;
            Ok(())
        },
    )
    .await;

    ipc.on(
        "on-vk-key-pressed",
        async |_, replier| -> Result<(), Box<dyn std::error::Error>> {
            let mut watcher = virtual_keyboard::watch_vk_key_pressed();

            tokio::select! {
                _ = async {
                    loop {
                        match watcher.changed().await {
                            Ok(()) => {
                                let key = watcher.borrow_and_update();
                                replier.reply(key.clone());
                            },
                            Err(e) => {
                                println!("error: {:?}", e);
                                break;
                            }
                        }
                    }
                } => {},
                _ = replier.wait_until_closed() => {}
            };

            Ok(())
        },
    )
    .await;
}
