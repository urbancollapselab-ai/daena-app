#!/usr/bin/env python3
"""
Daena Brain v1.0 — Central Intelligence
Receives messages, routes to agents or models, returns responses.
"""
import json
import sys
import time
import argparse
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

from scripts.worker_pool import WorkerPool
from scripts.orchestrator import Orchestrator
from scripts.memory_manager import MemoryManager

SYSTEM_PROMPT = """You are Daena — a personal AI command center.
You manage 8 specialized department agents and respond intelligently.
Be concise, helpful, and professional. Respond in the user's language."""


def handle_message(message: str, agent: str = None) -> dict:
    pool = WorkerPool()
    mem = MemoryManager()
    orch = Orchestrator()

    # Add to memory
    mem.add_hot("user", message)

    # Get context
    context = mem.get_context(task=message, agent=agent)

    # Classify task
    classification = orch.classify_task(message)

    # Build prompt
    full_prompt = f"{SYSTEM_PROMPT}\n\n{context}\n\nUser: {message}"

    # Route based on classification
    t0 = time.time()

    if classification["destination"] == "worker" or classification["destination"] == "opus":
        result = pool.call(full_prompt, max_tokens=1000)
    elif classification["destination"] == "department":
        dept = classification["department"]
        dept_context = orch.get_department_context(dept)
        full_prompt = f"{SYSTEM_PROMPT}\n\n{dept_context}\n\n{context}\n\nUser: {message}"
        result = pool.call(full_prompt, max_tokens=1000)
    else:
        result = pool.call(full_prompt, max_tokens=1000)

    latency_ms = int((time.time() - t0) * 1000)

    if result.get("success"):
        response = result["response"]
        mem.add_hot("assistant", response)
        return {
            "success": True,
            "response": response,
            "model": result.get("model", "unknown"),
            "latency_ms": latency_ms,
            "agent": agent or classification.get("department"),
            "tokens": result.get("tokens_used"),
        }
    else:
        return {
            "success": False,
            "response": "All models are currently unavailable. Please try again shortly.",
            "model": "none",
            "latency_ms": latency_ms,
            "error": result.get("error", "Unknown error"),
        }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--message", "-m", required=True, help="User message")
    parser.add_argument("--agent", "-a", default=None, help="Target agent")
    args = parser.parse_args()

    result = handle_message(args.message, args.agent)
    print(json.dumps(result, ensure_ascii=False))
