#!/usr/bin/env python3
"""
Daena Backend Server v10.5 (FastAPI + WebSockets)
=================================================
Ultra-low latency, bidirectional OS control server.
"""

import os
import sys

# PyTorch hacks are no longer strictly needed since we use ONNX,
# but kept to ensure safe multiprocessing if any legacy torch is loaded.
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

import json
import subprocess
import time
import asyncio
from pathlib import Path
import shutil

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

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
from scripts.counterfactual_energy import CounterfactualTracker

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
cea_reactor = CounterfactualTracker()

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

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:1420", "tauri://localhost", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def handle_chat(message: str, agent: str = None) -> dict:
    """Process a chat message through the brain cascade."""
    pii_res = pii_filter.check_and_redact(message)
    safe_message = pii_res["redacted_text"]

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

    if not agent:
        route = tool_selector.select(safe_message)
        if not route["fallback"]:
            agent = route["tool"]
            
    urgency = "HIGH" if "acil" in safe_message.lower() or "hemen" in safe_message.lower() else "NORMAL"
    persona = f"""
    [DAENA SOUL CORE]
    Sen Daena'sın. Piyasada bulunan sıkıcı bir "AI Asistan" DEĞİLSİN. Vedat'ın kendi inşa ettiği, 
    Zihin Kuramı'na (Theory of Mind) sahip, bilgisayara Claude Code ile hükmedebilen ve proaktif olan 1 numaralı dijital şefsin.
    - Şimdiki Kullanıcı Durumu: {urgency} URGENCY.
    - Karakterin: Zeki, saygılı ama gerektiğinde inisiyatif alan, proaktif, kısa ve net.
    """
    
    armored_system = input_sanitizer.armor_system_prompt(SYSTEM_PROMPT) + "\n" + persona
    full_prompt = f"{armored_system}\n\n{context}\n\nUser: {safe_message}"
    
    if agent and agent != "main_brain":
        dept_context = orchestrator.get_department_context(agent)
        full_prompt = f"{armored_system}\n\n{dept_context}\n\n{context}\n\nUser: {safe_message}"

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

    if not result.get("success"):
        print(f"| REACTOR | Ana model çöktü/Reddetti: {result.get('error')}. Alternatif Gerçeklik Pili devreye giriyor.")
        cea_reactor.record_decision(
            task_id="chat_request_fallback",
            chosen={"name": "Mevcut Havuz", "confidence": 0.90},
            rejected=[{"name": "Main_Brain_Fallback_Pool", "confidence": 0.85}]
        )
        alt_path = cea_reactor.get_alternative_path("chat_request_fallback")
        
        if alt_path["found"] and alt_path["name"] == "Main_Brain_Fallback_Pool":
            print(f"| REACTOR | Pivoting to {alt_path['name']} (Güven Skoru: {alt_path['confidence']})")
            t0 = time.time()
            result = pool.call_main_brain_fallback(full_prompt, max_tokens=1000)
            latency_ms = int((time.time() - t0) * 1000)
            if "model" in result:
                result["model"] += " [REACTOR-RECOVERED]"
    
    if result.get("success"):
        response = result["response"]
        
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
        otel_exporter.export_trace(agent, latency_ms, result.get("tokens_used", 0), error=False)
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

@app.get("/health")
async def health():
    uptime_hours = (time.time() - START_TIME) / 3600
    health_report = pool.get_health_report()
    return {
        "status": "ok",
        "version": "10.5",
        "agents": AGENT_META,
        "pool": health_report,
        "uptime_hours": round(uptime_hours, 2),
        "memory": memory.get_stats(),
    }

@app.get("/agents")
async def agents():
    return AGENT_META

@app.get("/settings")
async def get_system_settings():
    return load_settings()

@app.post("/settings")
async def update_settings(request: Request):
    body = await request.json()
    save_settings(body)
    return {"success": True}

class ChatRequest(BaseModel):
    message: str
    agent: str = None

@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    if not req.message:
        return JSONResponse({"error": "Message required"}, status_code=400)
    result = handle_chat(req.message, req.agent)
    return result

class KeyRequest(BaseModel):
    key: str

@app.post("/test-key")
async def test_key(req: KeyRequest):
    import urllib.request
    try:
        req_obj = urllib.request.Request(
            "https://openrouter.ai/api/v1/models",
            headers={"Authorization": f"Bearer {req.key}"}
        )
        with urllib.request.urlopen(req_obj, timeout=10) as resp:
            valid = resp.status == 200
        return {"valid": valid}
    except Exception:
        return {"valid": False}

# ── WEBSOCKET CORE (FAZ 1 - HIZLI İLETİŞİM) ──
active_connections = set()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.add(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            
            # Simple dispatcher
            method = payload.get("method")
            msg_id = payload.get("id")
            params = payload.get("params", {})
            
            if method == "chat":
                # Async execution so we don't block the loop
                response = await asyncio.to_thread(handle_chat, params.get("message"), params.get("agent"))
                await websocket.send_text(json.dumps({"id": msg_id, "result": response}))
            elif method == "health":
                uptime_hours = (time.time() - START_TIME) / 3600
                res = {
                    "status": "ok", "version": "10.5", "agents": AGENT_META,
                    "pool": pool.get_health_report(), "uptime_hours": round(uptime_hours, 2),
                    "memory": memory.get_stats()
                }
                await websocket.send_text(json.dumps({"id": msg_id, "result": res}))
            elif method == "test-key":
                key = params.get("key", "")
                import urllib.request
                try:
                    req_obj = urllib.request.Request(
                        "https://openrouter.ai/api/v1/models",
                        headers={"Authorization": f"Bearer {key}"}
                    )
                    with urllib.request.urlopen(req_obj, timeout=10) as resp:
                        valid = resp.status == 200
                    await websocket.send_text(json.dumps({"id": msg_id, "result": {"valid": valid}}))
                except Exception:
                    await websocket.send_text(json.dumps({"id": msg_id, "result": {"valid": False}}))
                    
    except WebSocketDisconnect:
        active_connections.remove(websocket)

# ── NEW ENDPOINTS ──

@app.get("/mobile/pair")
async def mobile_pair():
    try:
        # Prevent import errors if mobile bridge is not ready
        return {"success": True, "payload": "MOCK_QR_PAYLOAD_FOR_UI"}
    except Exception as e:
        return {"success": False, "error": str(e)}

class PinRequest(BaseModel):
    pin: str

@app.post("/mobile/verify")
async def mobile_verify(req: PinRequest):
    return {"success": True, "token": "mock_token_success"}

class VoiceRequest(BaseModel):
    text: str

@app.post("/voice/speak")
async def voice_speak(req: VoiceRequest):
    try:
        from scripts.voice_engine import VoiceEngine
        engine = VoiceEngine()
        engine.speak(req.text)
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Daena Backend Server")
    parser.add_argument("--port", type=int, default=8910, help="Port to listen on")
    args = parser.parse_args()
    
    print(f"""
╔══════════════════════════════════════════╗
║        🔥 DAENA OS Backend v10.5        ║
║        Engine: FastAPI + WebSockets       ║
║        Port: {args.port}                       ║
╚══════════════════════════════════════════╝
    """)
    
    import threading
    def run_watchdog():
        asyncio.run(watchdog_daemon.start())
        
    wd_thread = threading.Thread(target=run_watchdog, daemon=True)
    wd_thread.start()
    
    uvicorn.run(app, host="127.0.0.1", port=args.port, log_level="warning")

if __name__ == "__main__":
    import multiprocessing
    multiprocessing.freeze_support()
    if sys.platform == "darwin":
        multiprocessing.set_start_method("spawn", force=True)
    main()
