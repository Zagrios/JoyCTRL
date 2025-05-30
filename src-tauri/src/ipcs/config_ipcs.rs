use std::error::Error;

use serde::{Deserialize, Serialize};
use tauri::AppHandle;

use crate::services::{
    config_service::ConfigService,
    ipc_service::{IpcReplier, IpcService},
};

pub async fn register(app: &AppHandle) {
    let ipc = IpcService::get_instance();
    let config = ConfigService::get_instance(app);

    ipc.on(
        "get-config",
        async |_, replier: IpcReplier| -> Result<(), Box<dyn Error>> {
            let mut watcher = config.watch();

            println!("get config: {:?}", config.get_config());
            replier.reply(config.get_config());

            tokio::select! {
                _ = async {
                    loop {
                        match watcher.changed().await {
                            Ok(()) => {
                                let config = watcher.borrow_and_update();
                                replier.reply(config.clone());
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

            println!("end");

            Ok(())
        },
    )
    .await;

    ipc.on(
        "set-config",
        async |data, replier: IpcReplier| -> Result<(), Box<dyn Error>> {
            let data: SetConfigRequest = serde_json::from_value(data.unwrap())?;
            config.set(&data.key, data.value);
            replier.reply(());
            Ok(())
        },
    )
    .await;
}

#[derive(Serialize, Deserialize, Debug)]
struct SetConfigRequest {
    key: String,
    value: serde_json::Value,
}
