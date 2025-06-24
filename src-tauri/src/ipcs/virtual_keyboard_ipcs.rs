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
        "press-key",
        async |data, _replier| -> Result<(), Box<dyn std::error::Error>> {
            let key: String = serde_json::from_value(data.unwrap())?;
            let mut enigo = virtual_keyboard::get_vk_enigo();
            virtual_keyboard::press_key(&key, &mut enigo)?;
            Ok(())
        },
    )
    .await;

    ipc.on(
        "release-key",
        async |data, _replier| -> Result<(), Box<dyn std::error::Error>> {
            let key: String = serde_json::from_value(data.unwrap())?;
            let mut enigo = virtual_keyboard::get_vk_enigo();
            virtual_keyboard::release_key(&key, &mut enigo)?;
            Ok(())
        },
    )
    .await;
}
