use serde::{Deserialize, Serialize};
use std::process::Command;
use std::path::PathBuf;

#[derive(Serialize, Deserialize, Clone)]
pub struct ChatMessage {
    pub id: String,
    pub role: String,
    pub content: String,
    pub model: Option<String>,
    pub agent: Option<String>,
    pub timestamp: String,
    pub tokens: Option<u32>,
}

#[derive(Serialize, Deserialize)]
pub struct SystemStatus {
    pub agents_active: u32,
    pub agents_total: u32,
    pub models_available: u32,
    pub models_total: u32,
    pub tokens_today: u32,
    pub cost_today: f64,
    pub uptime_hours: f64,
}

#[derive(Serialize, Deserialize)]
pub struct AgentInfo {
    pub id: String,
    pub name: String,
    pub icon: String,
    pub status: String,
    pub tasks_today: u32,
    pub errors: u32,
    pub model_tier: String,
}

#[derive(Serialize, Deserialize)]
pub struct ModelResponse {
    pub success: bool,
    pub response: String,
    pub model: String,
    pub latency_ms: u64,
    pub tokens_used: Option<u32>,
}

fn get_backend_path() -> PathBuf {
    // 1. Production macOS: inside .app/Contents/Resources/backend
    if let Ok(exe) = std::env::current_exe() {
        if let Some(exe_dir) = exe.parent() {
            // macOS .app bundle: exe is in Contents/MacOS, resources in Contents/Resources
            let resources = exe_dir.parent()
                .map(|p| p.join("Resources").join("backend"));
            if let Some(ref res_path) = resources {
                if res_path.join("server.py").exists() {
                    return res_path.clone();
                }
            }
            // Windows/Linux: backend next to exe
            let exe_backend = exe_dir.join("backend");
            if exe_backend.join("server.py").exists() {
                return exe_backend;
            }
        }
    }

    // 2. Development: relative to project root
    let dev_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap_or(&PathBuf::from("."))
        .join("backend");
    
    if dev_path.join("server.py").exists() {
        return dev_path;
    }

    // 3. Fallback
    PathBuf::from("backend")
}

#[tauri::command]
pub async fn send_message(message: String, agent: Option<String>) -> Result<ChatMessage, String> {
    let backend = get_backend_path();
    let script = backend.join("scripts").join("brain.py");

    let mut cmd = Command::new("python3");
    cmd.arg(&script).arg("--message").arg(&message);

    if let Some(ref a) = agent {
        cmd.arg("--agent").arg(a);
    }

    let output = cmd.output().map_err(|e| format!("Failed to call brain: {}", e))?;

    if output.status.success() {
        let response_text = String::from_utf8_lossy(&output.stdout).to_string();
        let parsed: serde_json::Value = serde_json::from_str(&response_text)
            .unwrap_or(serde_json::json!({"response": response_text, "model": "unknown"}));

        Ok(ChatMessage {
            id: uuid_simple(),
            role: "assistant".to_string(),
            content: parsed["response"].as_str().unwrap_or(&response_text).to_string(),
            model: parsed["model"].as_str().map(|s| s.to_string()),
            agent: agent,
            timestamp: chrono_now(),
            tokens: parsed["tokens"].as_u64().map(|t| t as u32),
        })
    } else {
        Err(format!("Brain error: {}", String::from_utf8_lossy(&output.stderr)))
    }
}

#[tauri::command]
pub async fn get_system_status() -> Result<SystemStatus, String> {
    Ok(SystemStatus {
        agents_active: 8,
        agents_total: 8,
        models_available: 20,
        models_total: 20,
        tokens_today: 0,
        cost_today: 0.0,
        uptime_hours: 0.0,
    })
}

#[tauri::command]
pub async fn get_agent_status() -> Result<Vec<AgentInfo>, String> {
    let agents = vec![
        AgentInfo { id: "main_brain".into(), name: "Main Brain".into(), icon: "🧠".into(), status: "active".into(), tasks_today: 0, errors: 0, model_tier: "T0".into() },
        AgentInfo { id: "finance".into(), name: "Finance".into(), icon: "💰".into(), status: "active".into(), tasks_today: 0, errors: 0, model_tier: "T0→T1→T2→T3".into() },
        AgentInfo { id: "data".into(), name: "Data".into(), icon: "📊".into(), status: "idle".into(), tasks_today: 0, errors: 0, model_tier: "T1→T0→T2→T3".into() },
        AgentInfo { id: "marketing".into(), name: "Marketing".into(), icon: "📣".into(), status: "idle".into(), tasks_today: 0, errors: 0, model_tier: "T0→T1→T2→T3".into() },
        AgentInfo { id: "sales".into(), name: "Sales".into(), icon: "🎯".into(), status: "idle".into(), tasks_today: 0, errors: 0, model_tier: "T0→T1→T2→T3".into() },
        AgentInfo { id: "research".into(), name: "Research".into(), icon: "🔬".into(), status: "idle".into(), tasks_today: 0, errors: 0, model_tier: "T0→T1→T2→T3".into() },
        AgentInfo { id: "watchdog".into(), name: "Watchdog".into(), icon: "🛡️".into(), status: "monitoring".into(), tasks_today: 0, errors: 0, model_tier: "T2→T1→T3".into() },
        AgentInfo { id: "heartbeat".into(), name: "Heartbeat".into(), icon: "💓".into(), status: "running".into(), tasks_today: 0, errors: 0, model_tier: "T2→T1→T3".into() },
        AgentInfo { id: "coordinator".into(), name: "Coordinator".into(), icon: "🎭".into(), status: "standby".into(), tasks_today: 0, errors: 0, model_tier: "T0→T1→T2→T3".into() },
    ];
    Ok(agents)
}

#[tauri::command]
pub async fn call_model(prompt: String, model: Option<String>, max_tokens: Option<u32>) -> Result<ModelResponse, String> {
    let backend = get_backend_path();
    let script = backend.join("scripts").join("worker_pool.py");

    let output = Command::new("python3")
        .arg(&script)
        .arg("--call")
        .arg(&prompt)
        .output()
        .map_err(|e| format!("Model call failed: {}", e))?;

    if output.status.success() {
        let text = String::from_utf8_lossy(&output.stdout).to_string();
        Ok(ModelResponse {
            success: true,
            response: text,
            model: model.unwrap_or("auto".to_string()),
            latency_ms: 0,
            tokens_used: None,
        })
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
pub async fn save_settings(key: String, value: String) -> Result<(), String> {
    let backend = get_backend_path();
    let settings_file = backend.join("config").join("settings.json");

    let mut settings: serde_json::Value = if settings_file.exists() {
        let content = std::fs::read_to_string(&settings_file).unwrap_or("{}".to_string());
        serde_json::from_str(&content).unwrap_or(serde_json::json!({}))
    } else {
        serde_json::json!({})
    };

    settings[&key] = serde_json::Value::String(value);
    std::fs::write(&settings_file, serde_json::to_string_pretty(&settings).unwrap())
        .map_err(|e| format!("Save failed: {}", e))
}

#[tauri::command]
pub async fn load_settings() -> Result<String, String> {
    let backend = get_backend_path();
    let settings_file = backend.join("config").join("settings.json");

    if settings_file.exists() {
        std::fs::read_to_string(&settings_file).map_err(|e| format!("Load failed: {}", e))
    } else {
        Ok("{}".to_string())
    }
}

fn uuid_simple() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let ts = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis();
    format!("msg_{}", ts)
}

fn chrono_now() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let ts = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
    format!("{}", ts)
}

// ── Claude Code Integration ──────────────────────

#[derive(Serialize, Deserialize)]
pub struct ClaudeStatus {
    pub available: bool,
    pub version: Option<String>,
    pub path: Option<String>,
    pub pro: bool,
}

#[tauri::command]
pub async fn check_claude() -> Result<ClaudeStatus, String> {
    // Try common claude binary locations
    let paths_to_check = vec![
        "/opt/homebrew/bin/claude",
        "/usr/local/bin/claude",
        "/usr/bin/claude",
    ];

    let mut claude_bin: Option<String> = None;

    // First try `which claude`
    if let Ok(output) = Command::new("which").arg("claude").output() {
        if output.status.success() {
            let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !path.is_empty() {
                claude_bin = Some(path);
            }
        }
    }

    // Fallback to known paths
    if claude_bin.is_none() {
        for p in &paths_to_check {
            if std::path::Path::new(p).exists() {
                claude_bin = Some(p.to_string());
                break;
            }
        }
    }

    match claude_bin {
        Some(bin) => {
            let mut status = ClaudeStatus {
                available: true,
                version: None,
                path: Some(bin.clone()),
                pro: false,
            };

            // Get version
            if let Ok(output) = Command::new(&bin).arg("--version").output() {
                if output.status.success() {
                    status.version = Some(
                        String::from_utf8_lossy(&output.stdout).trim().chars().take(50).collect()
                    );
                }
            }

            // Test Pro subscription (try a minimal prompt)
            if let Ok(output) = Command::new(&bin)
                .arg("-p")
                .arg("respond with only the word OK")
                .output()
            {
                if output.status.success() {
                    let resp = String::from_utf8_lossy(&output.stdout);
                    if resp.contains("OK") {
                        status.pro = true;
                    }
                }
            }

            Ok(status)
        }
        None => Ok(ClaudeStatus {
            available: false,
            version: None,
            path: None,
            pro: false,
        }),
    }
}

#[derive(Serialize, Deserialize)]
pub struct InstallResult {
    pub success: bool,
    pub message: String,
}

#[tauri::command]
pub async fn install_claude() -> Result<InstallResult, String> {
    // Install Claude Code via npm
    let output = Command::new("npm")
        .args(["install", "-g", "@anthropic-ai/claude-code"])
        .output()
        .map_err(|e| format!("Install failed: {}", e))?;

    if output.status.success() {
        Ok(InstallResult {
            success: true,
            message: "Claude Code installed! Run 'claude' in terminal to sign in with your Anthropic account.".to_string(),
        })
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        Ok(InstallResult {
            success: false,
            message: format!("Installation failed: {}. Try manually: npm install -g @anthropic-ai/claude-code", stderr.chars().take(200).collect::<String>()),
        })
    }
}

#[tauri::command]
pub async fn install_dependencies() -> Result<InstallResult, String> {
    let backend = get_backend_path();
    let is_windows = cfg!(target_os = "windows");
    
    let (script_name, shell, arg) = if is_windows {
        ("bootstrap.ps1", "powershell", "-ExecutionPolicy")
    } else {
        ("bootstrap.sh", "bash", "-c")
    };

    let script = backend.join("scripts").join(script_name);
    
    let output = if is_windows {
        Command::new("powershell")
            .arg("-ExecutionPolicy")
            .arg("Bypass")
            .arg("-File")
            .arg(&script)
            .output()
    } else {
        Command::new("bash")
            .arg(&script)
            .output()
    };

    match output {
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout).to_string();
            let stderr = String::from_utf8_lossy(&out.stderr).to_string();
            if out.status.success() {
                Ok(InstallResult {
                    success: true,
                    message: "All dependencies installed successfully! System is fully armed.".to_string(),
                })
            } else {
                Ok(InstallResult {
                    success: false,
                    message: format!("Bootstrapper failed:\n{}\n{}", stdout, stderr),
                })
            }
        }
        Err(e) => {
            Err(format!("Failed to execute bootstrapper: {}", e))
        }
    }
}

use std::sync::{Mutex, OnceLock};
use std::process::{Stdio, Child};
use std::io::{BufReader, BufRead};

static TUNNEL_PROC: OnceLock<Mutex<Option<Child>>> = OnceLock::new();

fn get_tunnel_proc() -> &'static Mutex<Option<Child>> {
    TUNNEL_PROC.get_or_init(|| Mutex::new(None))
}

#[derive(Serialize, Deserialize)]
pub struct TunnelResult {
    pub success: bool,
    pub url: Option<String>,
    pub error: Option<String>,
}

#[tauri::command]
pub async fn start_tunnel() -> Result<TunnelResult, String> {
    // kill existing
    if let Ok(mut child_opt) = get_tunnel_proc().lock() {
        if let Some(mut child) = child_opt.take() {
            let _ = child.kill();
            let _ = child.wait();
        }
    }
    
    let is_windows = cfg!(target_os = "windows");
    let cmd_name = if is_windows { "npx.cmd" } else { "npx" };
    
    let mut child = Command::new(cmd_name)
        .arg("localtunnel")
        .arg("--port")
        .arg("8910")
        .stdout(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn localtunnel: {}", e))?;
        
    let stdout = child.stdout.take().unwrap();
    let reader = BufReader::new(stdout);
    
    let mut url = String::new();
    for line in reader.lines() {
        let l = line.unwrap_or_default();
        if l.contains("your url is: ") {
            url = l.replace("your url is: ", "").trim().to_string();
            break;
        }
    }
    
    if url.is_empty() {
        let _ = child.kill();
        return Ok(TunnelResult { success: false, url: None, error: Some("Did not receive URL from localtunnel".to_string()) });
    }
    
    if let Ok(mut child_opt) = get_tunnel_proc().lock() {
        *child_opt = Some(child);
    }
    
    Ok(TunnelResult { success: true, url: Some(url), error: None })
}

#[tauri::command]
pub async fn stop_tunnel() -> Result<bool, String> {
    if let Ok(mut child_opt) = get_tunnel_proc().lock() {
        if let Some(mut child) = child_opt.take() {
            let _ = child.kill();
            let _ = child.wait();
            return Ok(true);
        }
    }
    Ok(false)
}

#[tauri::command]
pub async fn get_backend_port() -> Result<u16, String> {
    Ok(*crate::BACKEND_PORT.get().unwrap_or(&8910))
}
