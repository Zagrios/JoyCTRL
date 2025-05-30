use std::error::Error;

use tauri_plugin_dialog::DialogExt;

use crate::{APP, services::ipc_service::IpcService};

pub async fn register() {
    let ipc = IpcService::get_instance();

    ipc.on(
        "open-file",
        async |_, replier| -> Result<(), Box<dyn Error>> {
            let app = APP.get().expect("APP must be set");
            let file = app.dialog().file().blocking_pick_file();

            if let Some(file) = file {
                replier.reply(file.to_string());
            }

            Ok(())
        },
    )
    .await;
}
