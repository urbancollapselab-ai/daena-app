#!/usr/bin/env python3
"""
Daena Backend Server v1.0
=========================
FastAPI server that bridges the React frontend with the Python AI backend.
Runs on port 8910.

Endpoints:
  POST /chat           — Send message, get AI response
  GET  /health         — System health check
  GET  /agents         — Agent status list
  POST /settings       — Update settings
  POST /test-key       — Validate OpenRouter API key
  GET  /check-claude    — Detect Claude Code / Pro
  POST /install-claude  — Install Claude Code CLI
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

# ── State ─────────────────────────────────────────
START_TIME = time.time()
pool = WorkerPool()
orchestrator = Orchestrator()
memory = MemoryManager()

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
    memory.add_hot("user", message)
    context = memory.get_context(task=message, agent=agent)
    classification = orchestrator.classify_task(message)
    
    full_prompt = f"{SYSTEM_PROMPT}\n\n{context}\n\nUser: {message}"
    
    if classification["destination"] == "department":
        dept = classification["department"]
        dept_context = orchestrator.get_department_context(dept)
        full_prompt = f"{SYSTEM_PROMPT}\n\n{dept_context}\n\n{context}\n\nUser: {message}"
    
    t0 = time.time()
    result = pool.call(full_prompt, max_tokens=1000)
    latency_ms = int((time.time() - t0) * 1000)
    
    if result.get("success"):
        response = result["response"]
        memory.add_hot("assistant", response)
        return {
            "success": True,
            "response": response,
            "model": result.get("model", "unknown"),
            "latency_ms": latency_ms,
            "agent": agent or classification.get("department"),
            "tokens": result.get("tokens_used"),
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
        self.send_header("Access-Control-Allow-Origin", "*")
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
                "agents": AGENT_META,
                "pool": health_report,
                "uptime_hours": round(uptime_hours, 2),
            })

        elif path == "/agents":
            self._json_response(AGENT_META)

        elif path == "/settings":
            self._json_response(load_settings())

        elif path == "/check-claude":
            self._json_response(check_claude_code())

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
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[DAENA] Shutting down...")
        server.shutdown()


if __name__ == "__main__":
    main()
