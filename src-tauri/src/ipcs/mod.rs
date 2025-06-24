use crate::services::ipc_service::{self, IpcService};

pub mod app_ipcs;
pub mod config_ipcs;
pub mod constoller_ipcs;
pub mod system_ipc;
pub mod virtual_keyboard_ipcs;

pub async fn init() {
    println!("Initializing IPC");
    let _ = ipc_service::IPC.set(IpcService::new());
    constoller_ipcs::register().await;
    config_ipcs::register().await;
    system_ipc::register().await;
    app_ipcs::register().await;
    virtual_keyboard_ipcs::register().await;
}
