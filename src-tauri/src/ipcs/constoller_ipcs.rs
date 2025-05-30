use crate::{
    model::gamepad::GamepadState,
    services::{
        gamepad_service::{self},
        ipc_service::IpcService,
    },
};
use std::error::Error;

pub async fn register() {
    // Obtenir le service IPC (maintenant clonable)
    let ipc = IpcService::get_instance();

    ipc.on(
        "controllers-states",
        async |_, replier| -> Result<(), Box<dyn Error>> {
            let mut watcher = {
                let state = gamepad_service::GAMEPAD_STATE.read().unwrap();

                let gamepads_map = state.get_gamepads();
                let gamepads: Vec<&GamepadState> = gamepads_map.values().collect();

                if !gamepads.is_empty() {
                    replier.reply(gamepads);
                }

                state.watch_gamepads()
            };

            tokio::select! {
                _ = async {
                    // Encore une boucle mais isolée dans la future
                    loop {
                        match watcher.changed().await {
                            Ok(()) => {
                                let gamepads_map = watcher.borrow_and_update();
                                let gamepads: Vec<&GamepadState> = gamepads_map.values().collect();
                                replier.reply(gamepads);
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
