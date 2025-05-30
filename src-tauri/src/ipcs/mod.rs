use tauri::AppHandle;

use crate::services::ipc_service::{self, IpcService};

pub mod app_ipcs;
pub mod config_ipcs;
pub mod constoller_ipcs;
pub mod system_ipc;

pub async fn init(app: AppHandle) {
    println!("Initializing IPC");
    let _ = ipc_service::IPC.set(IpcService::new());
    constoller_ipcs::register().await;
    config_ipcs::register(&app).await;
    system_ipc::register().await;
    app_ipcs::register().await;
}
