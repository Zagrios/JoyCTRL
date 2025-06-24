use std::collections::HashSet;
use std::sync::LazyLock;
use std::sync::MutexGuard;
use std::sync::RwLock;
use std::sync::atomic::AtomicBool;
use std::sync::atomic::Ordering;
use std::sync::{Mutex, OnceLock};

use enigo::{Direction, Enigo, Key, Keyboard, Settings};
use tauri::{AppHandle, Manager, WindowEvent};
use tokio::sync::watch;
use windows::Win32::UI::WindowsAndMessaging::{
    GWL_EXSTYLE, GetWindowLongPtrW, SetWindowLongPtrW, WS_EX_NOACTIVATE,
};

static ENIGO: OnceLock<Mutex<Enigo>> = OnceLock::new();
const VK_WINDOW_NAME: &str = "keyboard";
static KEYS_TO_RELEASE: LazyLock<RwLock<HashSet<Key>>> =
    LazyLock::new(|| RwLock::new(HashSet::new()));
static CAPS_LOCK_PRESSED: AtomicBool = AtomicBool::new(false);
static VK_KEY_PRESSED_RECEIVER: OnceLock<watch::Receiver<String>> = OnceLock::new();
static VK_KEY_PRESSED_SENDER: OnceLock<watch::Sender<String>> = OnceLock::new();

pub fn get_vk_enigo() -> MutexGuard<'static, Enigo> {
    ENIGO
        .get_or_init(|| {
            let settings = Settings {
                // Ensure events are sent globally, not just to the current process
                ..Settings::default()
            };
            Mutex::new(Enigo::new(&settings).unwrap())
        })
        .lock()
        .unwrap()
}

pub fn write_text(
    text: &str,
    enigo: &mut Enigo,
    is_vk_enigo: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    enigo.text(text)?;

    if is_vk_enigo {
        let sender = get_vk_key_pressed_sender();
        for c in text.chars() {
            sender.send(c.to_string()).unwrap();
        }
    }

    Ok(())
}

pub fn press_key(
    key: &str,
    enigo: &mut Enigo,
    is_vk_enigo: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    let enigo_key =
        get_enigo_key_from_str(key).ok_or(format!("Unable to get enigo key from str: {}", key))?;
    enigo.key(enigo_key, Direction::Press)?;

    if enigo_key == Key::CapsLock {
        CAPS_LOCK_PRESSED.store(
            !CAPS_LOCK_PRESSED.load(Ordering::Relaxed),
            Ordering::Relaxed,
        );
    }

    KEYS_TO_RELEASE.write().unwrap().insert(enigo_key);

    if is_vk_enigo {
        get_vk_key_pressed_sender()
            .send(key.to_string())
            .unwrap_or_else(|e| {
                println!("Error sending key pressed: {}", e);
            });
    }

    Ok(())
}

pub fn release_key(key: &str, enigo: &mut Enigo) -> Result<(), Box<dyn std::error::Error>> {
    let key =
        get_enigo_key_from_str(key).ok_or(format!("Unable to get enigo key from str: {}", key))?;
    enigo.key(key, Direction::Release)?;
    KEYS_TO_RELEASE.write().unwrap().remove(&key);
    Ok(())
}

pub fn release_all_keys(enigo: &mut Enigo) -> Result<(), Box<dyn std::error::Error>> {
    let keys_to_release = {
        let keys = KEYS_TO_RELEASE.read()?;
        keys.clone()
    };
    println!("Releasing all keys: {:?}", keys_to_release.iter());
    for key in keys_to_release.iter() {
        enigo.key(*key, Direction::Release)?;
        KEYS_TO_RELEASE.write().unwrap().remove(key);
    }

    if CAPS_LOCK_PRESSED.load(Ordering::Relaxed) {
        enigo.key(Key::CapsLock, Direction::Click)?;
        CAPS_LOCK_PRESSED.store(false, Ordering::Relaxed);
    }

    println!("All keys released");
    Ok(())
}

pub fn toogle_vk_window(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let keyboard_window = app.get_webview_window(VK_WINDOW_NAME);

    if let Some(keyboard_window) = keyboard_window {
        return keyboard_window.destroy().map_err(|e| e.into());
    }

    let cursor_position = app.cursor_position()?;
    let monitor = app
        .monitor_from_point(cursor_position.x, cursor_position.y)
        .unwrap()
        .unwrap();
    let work_area = monitor.work_area();

    let keyboard_window = tauri::WebviewWindowBuilder::new(
        app,
        VK_WINDOW_NAME,
        tauri::WebviewUrl::App("keyboard.html".into()),
    )
    .decorations(false)
    .title("JoyCTRL - Keyboard")
    .skip_taskbar(true)
    .focused(false)
    .minimizable(false)
    .maximizable(false)
    .always_on_top(true)
    .drag_and_drop(true)
    .inner_size(1050f64, 400f64)
    .position(
        ((work_area.size.width / 2) - (1050 / 2)) as f64,
        (work_area.size.height - 400 - 10) as f64,
    )
    .prevent_overflow()
    .build()?;

    keyboard_window.on_window_event(|event| {
        if let WindowEvent::Destroyed = event {
            println!("Virtual keyboard destroyed, releasing all keys");
            release_all_keys(&mut get_vk_enigo()).unwrap_or_else(|e| {
                println!("Error releasing all keys: {}", e);
            });
        }
    });

    if cfg!(target_os = "windows") {
        unsafe {
            let hwnd = keyboard_window.hwnd().unwrap();
            let ex_style = GetWindowLongPtrW(hwnd, GWL_EXSTYLE);
            // Combine multiple flags to prevent window activation and keep it as a tool window
            let ex_style = ex_style | WS_EX_NOACTIVATE.0 as isize;
            SetWindowLongPtrW(hwnd, GWL_EXSTYLE, ex_style);
        }
    }

    Ok(())
}

fn get_enigo_key_from_str(key: &str) -> Option<Key> {
    match key.to_lowercase().as_str() {
        "" => None,
        "meta" | "{meta}" => Some(Key::Meta),
        "backspace" | "{bksp}" => Some(Key::Backspace),
        "tab" | "{tab}" => Some(Key::Tab),
        "enter" | "{enter}" => Some(Key::Return),
        "shift" | "{shift}" => Some(Key::Shift),
        "ctrl" | "control" | "{control}" => Some(Key::Control),
        "alt" | "{alt}" => Some(Key::Alt),
        "space" | "{space}" => Some(Key::Space),
        "lock" | "{lock}" => Some(Key::CapsLock),
        "escape" | "{escape}" => Some(Key::Escape),
        "delete" | "{delete}" => Some(Key::Delete),
        "arrowleft" | "{arrowleft}" => Some(Key::LeftArrow),
        "arrowright" | "{arrowright}" => Some(Key::RightArrow),
        "arrowup" | "{arrowup}" => Some(Key::UpArrow),
        "arrowdown" | "{arrowdown}" => Some(Key::DownArrow),
        "prtscr" | "{prtscr}" => Some(Key::PrintScr),
        "mediaplaypause" | "{mediaplaypause}" => Some(Key::MediaPlayPause),
        "mediastop" | "{mediastop}" => Some(Key::MediaStop),
        "mediatrackprevious" | "{mediatrackprevious}" => Some(Key::MediaPrevTrack),
        "mediatracknext" | "{mediatracknext}" => Some(Key::MediaNextTrack),
        "audiovolumemute" | "{audiovolumemute}" => Some(Key::VolumeMute),
        "audiovolumedown" | "{audiovolumedown}" => Some(Key::VolumeDown),
        "audiovolumeup" | "{audiovolumeup}" => Some(Key::VolumeUp),
        "end" | "{end}" => Some(Key::End),
        "f1" | "{f1}" => Some(Key::F1),
        "f2" | "{f2}" => Some(Key::F2),
        "f3" | "{f3}" => Some(Key::F3),
        "f4" | "{f4}" => Some(Key::F4),
        "f5" | "{f5}" => Some(Key::F5),
        "f6" | "{f6}" => Some(Key::F6),
        "f7" | "{f7}" => Some(Key::F7),
        "f8" | "{f8}" => Some(Key::F8),
        "f9" | "{f9}" => Some(Key::F9),
        "f10" | "{f10}" => Some(Key::F10),
        "f11" | "{f11}" => Some(Key::F11),
        "f12" | "{f12}" => Some(Key::F12),
        _ => Some(Key::Unicode(key.chars().next().unwrap())),
    }
}

fn get_vk_key_pressed_sender() -> &'static watch::Sender<String> {
    VK_KEY_PRESSED_SENDER.get_or_init(|| {
        let (tx, rx) = watch::channel(String::new());
        let _ = VK_KEY_PRESSED_RECEIVER.set(rx);
        tx
    })
}

pub fn watch_vk_key_pressed() -> watch::Receiver<String> {
    get_vk_key_pressed_sender().subscribe()
}
