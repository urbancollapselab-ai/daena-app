#!/usr/bin/env python3
"""
Daena Backend Server v2.0
=========================
HTTP server bridging the React frontend with the Python AI backend.
Runs on port 8910.

Endpoints v2.0:
  POST /chat           — Send message, get AI response
  GET  /health         — System health check
  GET  /agents         — Agent status list
  POST /settings       — Update settings
  POST /test-key       — Validate OpenRouter API key
  GET  /check-claude   — Detect Claude Code / Pro
  POST /install-claude — Install Claude Code CLI
  GET  /traces         — Agent action traces (v2.0)
  GET  /traces/stats   — Agent/model statistics (v2.0)
  POST /execute        — Safe command execution (v2.0)
  GET  /memory/stats   — Memory system statistics (v2.0)
  GET  /schedules      — Scheduled tasks (v2.0)
  GET  /tasks          — Task chains status (v2.0)
"""

import json
import os
import subprocess
import sys
import time
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse
import shutil

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

from scripts.worker_pool import WorkerPool
from scripts.orchestrator import Orchestrator
from scripts.memory_manager import MemoryManager
from scripts.trace_logger import TraceLogger
from scripts.safety_guard import SafetyGuard
from scripts.scheduler import DaenaScheduler
from scripts.task_runner import TaskRunner
from scripts.input_sanitizer import InputSanitizer
from scripts.output_guard import OutputGuard
from scripts.pii_filter import PIIFilter
from scripts.tool_selector import ToolSelector
from scripts.db_utils import ensure_wal_mode
from scripts.eval_judge import EvalJudge
from scripts.smart_router import SmartRouter
from scripts.graph_memory import GraphMemory
from scripts.approval_queue import ApprovalQueue
from scripts.config_versioner import ConfigVersioner
from scripts.dag_planner import CyclicEngine
from scripts.otel_exporter import OTelExporter
from scripts.watchdog import watchdog_daemon

# ── State ─────────────────────────────────────────────
START_TIME = time.time()
pool = WorkerPool()
orchestrator = Orchestrator()
memory = MemoryManager()
tracer = TraceLogger()
guard = SafetyGuard()
scheduler = DaenaScheduler()
task_runner = TaskRunner()
input_sanitizer = InputSanitizer()
output_guard = OutputGuard()
pii_filter = PIIFilter()
tool_selector = ToolSelector()
eval_judge = EvalJudge()
smart_router = SmartRouter(pool)
graph_memory = GraphMemory()
approval_queue = ApprovalQueue()
config_versioner = ConfigVersioner()
dag_planner = CyclicEngine()
otel_exporter = OTelExporter()

# Apply WAL mode on startup for Daena SQLite DBs
try:
    ensure_wal_mode()
except Exception:
    pass

SETTINGS_FILE = ROOT / "config" / "settings.json"


def load_settings() -> dict:
    if SETTINGS_FILE.exists():
        return json.loads(SETTINGS_FILE.read_text())
    return {}


def save_settings(data: dict):
    SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    current = load_settings()
    current.update(data)
    SETTINGS_FILE.write_text(json.dumps(current, indent=2, ensure_ascii=False))


# ── Agent Info ────────────────────────────────────
AGENT_META = [
    {"id": "main_brain", "name": "Main Brain", "icon": "🧠", "status": "active"},
    {"id": "finance", "name": "Finance", "icon": "💰", "status": "active"},
    {"id": "data", "name": "Data", "icon": "📊", "status": "idle"},
    {"id": "marketing", "name": "Marketing", "icon": "📣", "status": "idle"},
    {"id": "sales", "name": "Sales", "icon": "🎯", "status": "idle"},
    {"id": "research", "name": "Research", "icon": "🔬", "status": "idle"},
    {"id": "watchdog", "name": "Watchdog", "icon": "🛡️", "status": "monitoring"},
    {"id": "heartbeat", "name": "Heartbeat", "icon": "💓", "status": "running"},
    {"id": "coordinator", "name": "Coordinator", "icon": "🎭", "status": "standby"},
]

SYSTEM_PROMPT = """You are Daena — a personal AI command center.
You manage 8 specialized department agents and respond intelligently.
Be concise, helpful, and professional. Respond in the user's language."""


def handle_chat(message: str, agent: str = None) -> dict:
    """Process a chat message through the brain cascade."""
    # ── v3.0 INPUT SECURITY LAYER ──
    # 1. PII Redaction
    pii_res = pii_filter.check_and_redact(message)
    safe_message = pii_res["redacted_text"]

    # 2. Prompt Injection Check
    sanitizer_res = input_sanitizer.check(safe_message)
    if sanitizer_res["risk"] == "HIGH":
        return {
            "success": False,
            "response": "🚫 BLOCKED: Potential prompt injection or malicious input detected.",
            "model": "security_layer",
            "latency_ms": 0,
            "error": "prompt_injection",
        }
    safe_message = input_sanitizer.sanitize(safe_message)

    memory.add_hot("user", safe_message)
    context = memory.get_context(task=safe_message, agent=agent)

    # 3. Semantic Tool Routing (Zero-LLM)
    if not agent:
        route = tool_selector.select(safe_message)
        if not route["fallback"]:
            agent = route["tool"]
            
    # ── v4.0 THE SOUL & PERSONA ENGINE ──
    # Dynamically inject emotional/professional state & Theory of Mind
    urgency = "HIGH" if "acil" in safe_message.lower() or "hemen" in safe_message.lower() else "NORMAL"
    persona = f"""
    [DAENA SOUL CORE]
    Sen Daena'sın. Piyasada bulunan sıkıcı bir "AI Asistan" DEĞİLSİN. Vedat'ın kendi inşa ettiği, 
    Zihin Kuramı'na (Theory of Mind) sahip, bilgisayara Claude Code ile hükmedebilen ve proaktif olan 1 numaralı dijital şefsin.
    - Şimdiki Kullanıcı Durumu: {urgency} URGENCY.
    - Karakterin: Zeki, saygılı ama gerektiğinde inisiyatif alan, proaktif, kısa ve net.
    - Yalnızca "işte cevabın" demek yerine bağlamı anladığını hissettir. Gerektiğinde esprili ama her zaman profesyonel.
    """
    
    # Prepare Prompt
    armored_system = input_sanitizer.armor_system_prompt(SYSTEM_PROMPT) + "\n" + persona
    full_prompt = f"{armored_system}\n\n{context}\n\nUser: {safe_message}"
    
    if agent and agent != "main_brain":
        dept_context = orchestrator.get_department_context(agent)
        full_prompt = f"{armored_system}\n\n{dept_context}\n\n{context}\n\nUser: {safe_message}"

    # ── v10.0 EPISTEMIC CHAOS MODULE (Delilik Enjektörü) ──
    try:
        from scripts.epistemic_chaos import EpistemicOrthogonalityInjector
        injector = EpistemicOrthogonalityInjector()
        if injector.should_inject_chaos():
            chaos_res = injector.inject_grammar(full_prompt)
            full_prompt = chaos_res["modified_prompt"]
            print("[v10.0] Epistemic Chaos Injected into Prompt Grammar.")
    except Exception:
        pass
        
    t0 = time.time()
    result = pool.call(full_prompt, max_tokens=1000)
    latency_ms = int((time.time() - t0) * 1000)
    
    if result.get("success"):
        response = result["response"]
        
        # ── v3.0 OUTPUT SECURITY LAYER ──
        guard_res = output_guard.check_response(response)
        if guard_res["action"] == "BLOCK":
            return {
                "success": False,
                "response": "🚫 BLOCKED: Policy violation or sensitive data leak detected in agent response.",
                "model": "security_layer",
                "latency_ms": latency_ms,
                "error": "output_policy_violation",
            }
        elif guard_res["action"] == "REDACT":
             response = output_guard.redact_response(response)
             
        memory.add_hot("assistant", response)
        
        # ── v3.0 OTel & EVAL (Background task simulation) ──
        otel_exporter.export_trace(agent, latency_ms, result.get("tokens_used", 0), error=False)
        # Background eval could be threaded; running inline for demonstration
        judge_score = eval_judge.evaluate_response(safe_message, response, agent)
        
        return {
            "success": True,
            "response": response,
            "model": result.get("model", "unknown"),
            "latency_ms": latency_ms,
            "agent": agent,
            "tokens": result.get("tokens_used"),
            "eval_score": judge_score.get("overall", 0),
        }
    else:
        error_msg = result.get("error", "Unknown error")
        return {
            "success": False,
            "response": f"System Error: {error_msg}. Please check your API keys.",
            "model": "none",
            "latency_ms": latency_ms,
            "error": error_msg,
        }


class DaenaHandler(BaseHTTPRequestHandler):
    """HTTP request handler with CORS support."""

    def _set_cors(self):
        origin = self.headers.get("Origin", "")
        allowed = ["http://localhost:1420", "tauri://localhost", "http://localhost:5173"]
        if origin in allowed:
            self.send_header("Access-Control-Allow-Origin", origin)
        else:
            self.send_header("Access-Control-Allow-Origin", "http://localhost:1420")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def _json_response(self, data: dict, status: int = 200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self._set_cors()
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode())

    def _read_body(self) -> dict:
        length = int(self.headers.get("Content-Length", 0))
        if length == 0:
            return {}
        body = self.rfile.read(length)
        return json.loads(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self._set_cors()
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path

        if path == "/health":
            uptime_hours = (time.time() - START_TIME) / 3600
            health_report = pool.get_health_report()
            self._json_response({
                "status": "ok",
                "version": "2.0",
                "agents": AGENT_META,
                "pool": health_report,
                "uptime_hours": round(uptime_hours, 2),
                "memory": memory.get_stats(),
            })

        elif path == "/agents":
            self._json_response(AGENT_META)

        elif path == "/settings":
            self._json_response(load_settings())

        elif path == "/check-claude":
            self._json_response(check_claude_code())

        # ── v2.0 Endpoints ────────────────────────────────────
        elif path == "/traces":
            traces = tracer.get_recent(limit=50)
            self._json_response(traces)

        elif path == "/traces/stats":
            stats = tracer.get_stats()
            cost = tracer.get_cost_report()
            stats["cost"] = cost
            self._json_response(stats)

        elif path == "/memory/stats":
            self._json_response(memory.get_stats())

        elif path == "/schedules":
            self._json_response({
                "schedules": scheduler.get_schedules(),
                "upcoming": scheduler.get_next_runs(),
                "recent_log": scheduler.get_log(limit=10),
            })

        elif path == "/tasks":
            self._json_response(task_runner.get_all_tasks(limit=20))

        elif path == "/system/stats":
            import psutil
            self._json_response({
                "cpu_percent": psutil.cpu_percent(interval=0.1),
                "ram_percent": psutil.virtual_memory().percent,
                "ram_used_gb": round(psutil.virtual_memory().used / (1024**3), 2),
                "ram_total_gb": round(psutil.virtual_memory().total / (1024**3), 2),
                "disk_percent": psutil.disk_usage('/').percent,
                "sqlite_wal": "enabled",
                "uptime": round(time.time() - START_TIME, 2)
            })

        else:
            dist_dir = ROOT / "dist"
            if not dist_dir.exists():
                self._json_response({"error": "Not found"}, 404)
                return
            
            import mimetypes
            req_path = path.lstrip("/")
            file_path = dist_dir / req_path
            
            if not req_path or not file_path.exists():
                file_path = dist_dir / "index.html"
            
            if file_path.is_file():
                self.send_response(200)
                content_type, _ = mimetypes.guess_type(str(file_path))
                if not content_type and str(file_path).endswith('.js'):
                    content_type = "application/javascript"
                if content_type:
                    self.send_header("Content-Type", content_type)
                self.end_headers()
                self.wfile.write(file_path.read_bytes())
            else:
                self._json_response({"error": "Not found"}, 404)

    def do_POST(self):
        path = urlparse(self.path).path

        if path == "/chat":
            body = self._read_body()
            message = body.get("message", "")
            agent = body.get("agent")
            if not message:
                self._json_response({"error": "Message required"}, 400)
                return
            result = handle_chat(message, agent)
            self._json_response(result)

        elif path == "/settings":
            body = self._read_body()
            save_settings(body)
            self._json_response({"success": True})

        elif path == "/test-key":
            body = self._read_body()
            key = body.get("key", "")
            import urllib.request
            try:
                req = urllib.request.Request(
                    "https://openrouter.ai/api/v1/models",
                    headers={"Authorization": f"Bearer {key}"}
                )
                with urllib.request.urlopen(req, timeout=10) as resp:
                    valid = resp.status == 200
                self._json_response({"valid": valid})
            except Exception:
                self._json_response({"valid": False})

        elif path == "/install-claude":
            result = install_claude_code()
            self._json_response(result)

        elif path == "/github/verify":
            body = self._read_body()
            token = body.get("token", "")
            if not token.startswith("ghp_") and not token.startswith("github_pat_"):
                self._json_response({"valid": False, "error": "Invalid format"})
                return
            import urllib.request
            try:
                req = urllib.request.Request(
                    "https://api.github.com/user",
                    headers={"Authorization": f"token {token}", "User-Agent": "Daena-App"}
                )
                with urllib.request.urlopen(req, timeout=10) as resp:
                    valid = resp.status == 200
                    if valid:
                        data = json.loads(resp.read())
                        self._json_response({"valid": True, "username": data.get("login")})
                    else:
                        self._json_response({"valid": False})
            except Exception as e:
                self._json_response({"valid": False, "error": str(e)})

        elif path == "/voice/speak":
            body = self._read_body()
            text = body.get("text", "")
            try:
                from scripts.voice_engine import VoiceEngine
                engine = VoiceEngine()
                engine.speak(text)  # Generates and plays locally async
                self._json_response({"success": True})
            except ImportError:
                self._json_response({"success": False, "error": "voice_engine not found"})
                
        else:
            self._json_response({"error": "Not found"}, 404)

    def log_message(self, format, *args):
        # Cleaner log format
        print(f"[DAENA] {args[0]} {args[1]}")


def check_claude_code() -> dict:
    """Detect Claude Code CLI and Pro subscription."""
    result = {"available": False, "version": None, "path": None, "pro": False}

    # Check common claude binary locations
    claude_paths = [
        shutil.which("claude"),
        "/opt/homebrew/bin/claude",
        "/usr/local/bin/claude",
        os.path.expanduser("~/.npm-global/bin/claude"),
        os.path.expanduser("~/.local/bin/claude"),
    ]

    claude_bin = None
    for p in claude_paths:
        if p and os.path.isfile(p):
            claude_bin = p
            break

    if not claude_bin:
        # Check via npm global
        try:
            npm_out = subprocess.run(
                ["npm", "list", "-g", "@anthropic-ai/claude-code", "--json"],
                capture_output=True, text=True, timeout=10
            )
            if '"@anthropic-ai/claude-code"' in npm_out.stdout:
                claude_bin = shutil.which("claude") or "claude"
        except Exception:
            pass

    if claude_bin:
        result["available"] = True
        result["path"] = claude_bin
        # Try to get version
        try:
            ver_out = subprocess.run(
                [claude_bin, "--version"],
                capture_output=True, text=True, timeout=5
            )
            if ver_out.returncode == 0:
                result["version"] = ver_out.stdout.strip()[:50]
        except Exception:
            result["version"] = "detected"

        # Check if Pro by trying a minimal prompt
        try:
            test_out = subprocess.run(
                [claude_bin, "-p", "respond with only: OK"],
                capture_output=True, text=True, timeout=15
            )
            if test_out.returncode == 0 and "OK" in test_out.stdout:
                result["pro"] = True
        except Exception:
            pass

    return result


def install_claude_code() -> dict:
    """Install Claude Code CLI via npm."""
    try:
        proc = subprocess.run(
            ["npm", "install", "-g", "@anthropic-ai/claude-code"],
            capture_output=True, text=True, timeout=120
        )
        if proc.returncode == 0:
            return {"success": True, "message": "Claude Code installed. Run 'claude' in terminal to sign in."}
        else:
            return {"success": False, "message": proc.stderr[:200]}
    except Exception as e:
        return {"success": False, "message": str(e)}


def main():
    port = 8910
    server = HTTPServer(("127.0.0.1", port), DaenaHandler)
    print(f"""
╔══════════════════════════════════════════╗
║        🔥 DAENA Backend v1.0            ║
║        Port: {port}                       ║
║        Models: {len(pool.get_health_report()['tiers'])} tiers, 20 total        ║
║        Agents: {len(AGENT_META)} departments              ║
╚══════════════════════════════════════════╝
    """)
    try:
        import threading
        import asyncio
        
        def run_watchdog():
            asyncio.run(watchdog_daemon.start())
            
        wd_thread = threading.Thread(target=run_watchdog, daemon=True)
        wd_thread.start()
        
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[DAENA] Shutting down...")
        watchdog_daemon.stop()
        server.shutdown()


if __name__ == "__main__":
    main()
