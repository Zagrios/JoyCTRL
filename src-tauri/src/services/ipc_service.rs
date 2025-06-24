use serde::{Deserialize, Serialize};
use std::future::Future;
use std::pin::Pin;
use std::sync::atomic::AtomicBool;
use std::sync::atomic::Ordering::SeqCst;
use std::sync::{Arc, OnceLock};
use std::{collections::HashMap, error::Error};
use tauri::{AppHandle, Emitter};
use tokio::sync::{Notify, RwLock};

pub static IPC: OnceLock<IpcService> = OnceLock::new();

#[tauri::command]
pub async fn joyctrl_ipc(app: AppHandle, request: IpcRequest) {
    println!("ipc request: {:?}", &request.channel);

    let ipc = IpcService::get_instance();

    if request.channel == "teardown" {
        println!("teardown {}", &request.get_teardown_channel());
        ipc.teardown(&request.get_teardown_channel()).await;
    } else {
        println!("trigger {}", &request.get_data_channel());
        ipc.trigger(app, request).await;
    }
}

type IpcCallback = Arc<
    dyn Fn(
            IpcRequestData,
            IpcReplier,
        ) -> Pin<Box<dyn Future<Output = Result<(), Box<dyn Error>>> + Send + Sync>>
        + Send
        + Sync,
>;

struct IpcServiceState {
    listeners: HashMap<String, IpcCallback>,
    repliers: HashMap<String, IpcReplier>,
}

impl IpcServiceState {
    fn new() -> Self {
        Self {
            listeners: HashMap::new(),
            repliers: HashMap::new(),
        }
    }
}

#[derive(Clone)]
pub struct IpcService {
    state: Arc<RwLock<IpcServiceState>>,
}

impl IpcService {
    pub fn new() -> Self {
        Self {
            state: Arc::new(RwLock::new(IpcServiceState::new())),
        }
    }

    pub fn get_instance() -> &'static IpcService {
        IPC.get_or_init(IpcService::new)
    }

    pub async fn on<F, Fut>(&self, channel: &str, cb: F)
    where
        F: Fn(IpcRequestData, IpcReplier) -> Fut + Send + Sync + 'static,
        Fut: Future<Output = Result<(), Box<dyn Error>>> + Send + Sync + 'static,
    {
        let callback = Arc::new(move |data: IpcRequestData, replier: IpcReplier| {
            let fut = cb(data, replier);
            Box::pin(fut) as Pin<Box<dyn Future<Output = Result<(), Box<dyn Error>>> + Send + Sync>>
        });

        let mut state = self.state.write().await;
        state.listeners.insert(channel.to_string(), callback);
    }

    pub async fn trigger(&self, app: AppHandle, request: IpcRequest) {
        let state = self.state.clone();
        let channel = request.channel.clone();

        let callback_opt = {
            let state_lock = state.read().await;
            state_lock.listeners.get(&channel).cloned()
        };

        let callback = match callback_opt {
            Some(callback) => callback,
            None => {
                println!("No listener found for channel: {}", channel);
                return;
            }
        };

        let teardown_channel = request.get_teardown_channel();
        let data_channel = request.get_data_channel();
        let close_channel = request.get_close_channel();
        let error_channel = request.get_error_channel();
        let data = request.data.clone();

        let replier = IpcReplier::new(app.clone(), &data_channel);

        {
            let mut state_lock = state.write().await;
            state_lock
                .repliers
                .insert(teardown_channel.clone(), replier.clone());
        }

        tokio::spawn(async move {
            match callback(data, replier).await {
                Ok(_) => {
                    let _ = app.emit(&close_channel, "");
                }
                Err(e) => {
                    let _ = app.emit(&error_channel, e.to_string());
                }
            }
        });
    }

    pub async fn teardown(&self, teardown_channel: &str) {
        let mut state = self.state.write().await;
        if let Some(replier) = state.repliers.get(teardown_channel) {
            println!("teardown channel: {}", teardown_channel);
            replier.close_stream();
            state.repliers.remove(teardown_channel);
        } else {
            println!(
                "No replier found for channel: {}, {:?}",
                teardown_channel,
                state.repliers.keys()
            );
        }
    }
}

#[derive(Clone)]
pub struct IpcReplier {
    app: AppHandle,
    data_channel: Arc<str>,
    stream_closed: Arc<AtomicBool>,
    stream_closed_notifier: Arc<Notify>,
}

impl IpcReplier {
    pub fn new(app: AppHandle, data_channel: &str) -> Self {
        Self {
            app,
            data_channel: Arc::from(data_channel),
            stream_closed: Arc::new(AtomicBool::new(false)),
            stream_closed_notifier: Arc::new(Notify::new()),
        }
    }

    pub fn reply<T: Serialize>(&self, res: T) {
        if self.is_stream_closed() {
            println!("stream closed");
            return;
        }

        let res = self.app.emit(&self.data_channel, &res);

        if let Err(e) = res {
            println!("Error: {}", e);
        }
    }

    pub fn close_stream(&self) {
        self.stream_closed.store(true, SeqCst);
        self.stream_closed_notifier.notify_waiters();
    }

    pub fn is_stream_closed(&self) -> bool {
        self.stream_closed.load(SeqCst)
    }

    pub async fn wait_until_closed(&self) {
        if !self.is_stream_closed() {
            self.stream_closed_notifier.notified().await;
        }
    }
}

pub type IpcRequestData = Option<serde_json::Value>;

#[derive(Deserialize, Clone)]
pub struct IpcRequest {
    pub channel: String,
    pub stream_uuid: String,
    pub data: IpcRequestData,
}

impl IpcRequest {
    pub fn get_data_channel(&self) -> String {
        format!("{}_data", self.stream_uuid)
    }

    pub fn get_error_channel(&self) -> String {
        format!("{}_error", self.stream_uuid)
    }

    pub fn get_close_channel(&self) -> String {
        format!("{}_close", self.stream_uuid)
    }

    pub fn get_teardown_channel(&self) -> String {
        format!("{}_teardown", self.stream_uuid)
    }
}
