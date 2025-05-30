use std::error::Error;

use crate::services::{
    ipc_service::IpcService,
    mapping_service::{get_mapping_active, set_mapping_active, watch_mapping_active},
};

pub async fn register() {
    let ipc = IpcService::get_instance();

    ipc.on(
        "toogle-mapping-active",
        async |_, _replier| -> Result<(), Box<dyn Error>> {
            set_mapping_active(!get_mapping_active());
            Ok(())
        },
    )
    .await;

    ipc.on(
        "is-mapping-active",
        async |_, replier| -> Result<(), Box<dyn Error>> {
            replier.reply(get_mapping_active());
            let watcher = watch_mapping_active();

            if watcher.is_none() {
                return Err("Mapping active watcher not initialized".into());
            }

            let mut watcher = watcher.unwrap();

            loop {
                if replier.is_stream_closed() {
                    break;
                }

                match watcher.changed().await {
                    Ok(()) => {
                        let active = watcher.borrow_and_update();
                        replier.reply(*active);
                    }
                    Err(e) => {
                        println!("error: {:?}", e);
                        break;
                    }
                }
            }
            Ok(())
        },
    )
    .await;
}
