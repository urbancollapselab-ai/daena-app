use tauri::Manager;
use std::process::Command as StdCommand;
use std::path::PathBuf;

mod commands;

/// Find the backend directory — works in both dev and production
fn find_backend_dir(app: &tauri::App) -> Option<PathBuf> {
    // Production: resources bundled inside the app
    if let Ok(resource_dir) = app.path().resource_dir() {
        let prod_path = resource_dir.join("backend");
        if prod_path.join("server.py").exists() {
            println!("[DAENA] Backend found in resources: {:?}", prod_path);
            return Some(prod_path);
        }
    }

    // Development: relative to the project root
    let dev_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .map(|p| p.join("backend"));
    
    if let Some(ref path) = dev_path {
        if path.join("server.py").exists() {
            println!("[DAENA] Backend found in dev: {:?}", path);
            return dev_path;
        }
    }

    // Fallback: next to the executable
    if let Ok(exe) = std::env::current_exe() {
        if let Some(exe_dir) = exe.parent() {
            let exe_path = exe_dir.join("backend");
            if exe_path.join("server.py").exists() {
                println!("[DAENA] Backend found next to exe: {:?}", exe_path);
                return Some(exe_path);
            }
        }
    }

    println!("[DAENA] WARNING: Backend not found in any location");
    None
}

/// Auto-start the compiled native Python backend sidecar
fn start_backend(app: &tauri::App) {
    if let Ok(resource_dir) = app.path().resource_dir() {
        let mut server_exe = resource_dir.join("bin").join("daenaserver").join("daenaserver");
        
        #[cfg(windows)]
        {
            server_exe.set_extension("exe");
        }

        println!("[DAENA] Starting Native Backend Sidecar: {:?}", server_exe);

        if server_exe.exists() {
            std::thread::spawn(move || {
                match StdCommand::new(&server_exe).spawn() {
                    Ok(mut child) => {
                        println!("[DAENA] Native Backend started with PID: {}", child.id());
                        let _ = child.wait();
                        println!("[DAENA] Backend process exited");
                    }
                    Err(e) => {
                        eprintln!("[DAENA] Failed to start native backend: {}", e);
                    }
                }
            });
        } else {
            eprintln!("[DAENA] CRITICAL: Native backend executable not found at {:?}", server_exe);
            eprintln!("You must run build_sidecar.sh before packaging!");
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            // Auto-start Python backend (non-blocking, won't crash if fails)
            start_backend(app);

            #[cfg(debug_assertions)]
            {
                if let Some(window) = app.get_webview_window("main") {
                    window.open_devtools();
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::send_message,
            commands::get_system_status,
            commands::get_agent_status,
            commands::call_model,
            commands::save_settings,
            commands::load_settings,
            commands::check_claude,
            commands::install_claude,
            commands::install_dependencies,
            commands::start_tunnel,
            commands::stop_tunnel,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Daena");
}
