#!/usr/bin/env python3
"""
Daena Worker Pool v1.0 — 20-Model Cascade
==========================================
4-tier failover: Free models first, paid models last.
System NEVER goes silent.

Tiers:
  T0: Qwen 3.6 Plus FREE (1M context) — Secondary Brain
  T1: 7 strong free models (Maverick, Coder, Devstral, R1, Nemotron, GPT-OSS, Qwen Next)
  T2: 5 light free models (Scout, MiniMax, Gemma 3, Step, Llama 70B)
  T3: 7 paid models sorted by price ($0.04 → $0.80)

Usage:
    from scripts.worker_pool import WorkerPool
    pool = WorkerPool()
    result = pool.call("Your prompt here")
"""

import json
import time
import urllib.request
from pathlib import Path
from typing import Optional, Dict

ROOT = Path(__file__).parent.parent
ENV_FILE = ROOT / ".env"

# ── MODEL TIERS (Verified against OpenRouter — April 2026) ───────────
# Tier 0: Primary free brain (1M context window)
TIER_0 = [
    "qwen/qwen3.6-plus:free",                 # Verified ✅
]

# Tier 1: Strong free models (high capability)
TIER_1 = [
    "meta-llama/llama-4-maverick:free",        # Verified ✅
    "deepseek/deepseek-r1:free",               # Verified ✅
    "nvidia/nemotron-3-super-120b-a12b:free",  # Verified ✅
    "openai/gpt-oss-120b:free",                # Verified ✅ (free variant)
    "mistralai/devstral-2512:free",            # Verified ✅
]

# Tier 2: Light free models (fast, lower capability)
TIER_2 = [
    "meta-llama/llama-4-scout:free",           # Verified ✅
    "google/gemma-3-27b-it:free",              # Verified ✅
    "nvidia/nemotron-3-nano-30b-a3b:free",     # Verified ✅ (replaced Step 3.5)
    "meta-llama/llama-3.3-70b-instruct:free",  # Verified ✅
]

# Tier 3: Paid models (last resort, sorted by price)
TIER_3 = [
    "google/gemma-4-31b-it",                   # ~$0.14/M
    "openai/gpt-4o-mini",                      # ~$0.15/M
    "deepseek/deepseek-v3.2",                  # ~$0.26/M
    "anthropic/claude-3.5-haiku",              # ~$0.80/M
]

ALL_WORKERS = TIER_0 + TIER_1 + TIER_2 + TIER_3

MAIN_BRAIN_FALLBACKS = [
    "qwen/qwen3.6-plus:free",
    "meta-llama/llama-4-maverick:free",
    "deepseek/deepseek-r1:free",
    "mistralai/devstral-2512:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "openai/gpt-oss-120b:free",
    "qwen/qwen3-next-80b-a3b-instruct:free",
    "google/gemma-4-31b-it",
    "google/gemini-3.1-flash-lite-preview",
    "deepseek/deepseek-v3.2",
    "anthropic/claude-3.5-haiku",
]

MODEL_DISPLAY_NAMES = {
    "qwen/qwen3.6-plus:free": "Qwen 3.6 Plus (2nd Brain)",
    "meta-llama/llama-4-maverick:free": "Llama 4 Maverick (3rd Brain)",
    "deepseek/deepseek-r1:free": "DeepSeek R1 (4th Brain)",
    "mistralai/devstral-2512:free": "Devstral 2 (5th Brain)",
    "nvidia/nemotron-3-super-120b-a12b:free": "Nemotron 120B (6th Brain)",
    "openai/gpt-oss-120b:free": "GPT-OSS 120B (7th Brain)",
    "qwen/qwen3-next-80b-a3b-instruct:free": "Qwen Next 80B (8th Brain)",
    "google/gemma-4-31b-it": "Gemma 4 31B (9th Brain)",
    "google/gemini-3.1-flash-lite-preview": "Gemini 3.1 Flash (10th Brain)",
    "deepseek/deepseek-v3.2": "DeepSeek V3.2 (11th Brain)",
    "anthropic/claude-3.5-haiku": "Claude Haiku (12th Brain — Last Resort)",
    "qwen/qwen3-coder:free": "Qwen 3 Coder",
    "meta-llama/llama-4-scout:free": "Llama 4 Scout",
    "minimax/minimax-m2.5:free": "MiniMax M2.5",
    "google/gemma-3-27b-it:free": "Gemma 3 27B",
    "stepfun/step-3.5-mini:free": "Step 3.5 Mini",
    "meta-llama/llama-3.3-70b-instruct:free": "Llama 3.3 70B",
}


class WorkerPool:
    def __init__(self):
        self._api_key = self._load_api_key()
        self._stats = {
            "total_calls": 0,
            "successful": 0,
            "failed": 0,
            "by_model": {},
        }

    def _load_api_key(self) -> str:
        # First check settings.json (controlled by frontend)
        settings_file = ROOT / "config" / "settings.json"
        if settings_file.exists():
            try:
                settings = json.loads(settings_file.read_text())
                if settings.get("openRouterKey"):
                    return settings["openRouterKey"]
            except:
                pass
                
        # Fallback to .env
        if ENV_FILE.exists():
            for line in ENV_FILE.read_text().splitlines():
                line = line.strip()
                if line.startswith("OPENROUTER_API_KEY="):
                    return line.split("=", 1)[1].strip()
        return ""

    def call(self, prompt: str, system: str = "", max_tokens: int = 800,
             tier: str = "auto", task_type: str = "general") -> dict:
        """Call the model cascade. Tries each model in order until one succeeds."""
        if tier == "auto":
            models = ALL_WORKERS
        elif tier == "t0":
            models = TIER_0
        elif tier == "t1":
            models = TIER_1
        elif tier == "t2":
            models = TIER_2
        elif tier == "t3":
            models = TIER_3
        else:
            models = ALL_WORKERS

        for model_id in models:
            result = self._call_openrouter(model_id, prompt, system, max_tokens)
            if result.get("success"):
                return result

        return {"success": False, "error": "All models exhausted", "model": "none"}

    def call_main_brain_fallback(self, prompt: str, system: str = "",
                                  max_tokens: int = 800) -> dict:
        """Main brain fallback cascade (11 models)."""
        for model_id in MAIN_BRAIN_FALLBACKS:
            result = self._call_openrouter(model_id, prompt, system, max_tokens)
            if result.get("success"):
                return result
        return {"success": False, "error": "All fallback models exhausted"}

    def _call_openrouter(self, model_id: str, prompt: str,
                          system: str = "", max_tokens: int = 800) -> dict:
        api_key = self._load_api_key()
        if not api_key:
            return {"success": False, "error": "No API key configured. Please enter your OpenRouter key in Settings."}

        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        body = json.dumps({
            "model": model_id,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": 0.7,
        }).encode()

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": "https://daena.app",
            "X-Title": "Daena AI",
        }

        req = urllib.request.Request(
            "https://openrouter.ai/api/v1/chat/completions",
            data=body, headers=headers
        )

        try:
            t0 = time.time()
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read())
            latency = int((time.time() - t0) * 1000)

            if "choices" in data and data["choices"]:
                text = data["choices"][0]["message"]["content"]
                self._stats["total_calls"] += 1
                self._stats["successful"] += 1
                self._stats["by_model"][model_id] = self._stats["by_model"].get(model_id, 0) + 1

                return {
                    "success": True,
                    "response": text,
                    "model": model_id,
                    "latency_ms": latency,
                    "tokens_used": data.get("usage", {}).get("total_tokens"),
                }
            else:
                return {"success": False, "error": f"No choices in response from {model_id}"}

        except Exception as e:
            self._stats["failed"] += 1
            error_str = str(e)
            if "429" in error_str or "rate" in error_str.lower():
                print(f"[POOL] {model_id}: Rate limited, trying next...")
            else:
                print(f"[POOL] {model_id}: Error — {error_str[:100]}")
            return {"success": False, "error": error_str[:200], "model": model_id}

    def get_health_report(self) -> dict:
        return {
            "total_workers": len(ALL_WORKERS),
            "available_workers": len(ALL_WORKERS),
            "tiers": {
                "T0": len(TIER_0),
                "T1": len(TIER_1),
                "T2": len(TIER_2),
                "T3": len(TIER_3),
            },
            "free_models": len(TIER_0) + len(TIER_1) + len(TIER_2),
            "paid_models": len(TIER_3),
            "stats": self._stats,
        }


if __name__ == "__main__":
    import sys
    pool = WorkerPool()

    if "--call" in sys.argv:
        prompt = " ".join(sys.argv[sys.argv.index("--call") + 1:])
        result = pool.call(prompt)
        print(json.dumps(result, ensure_ascii=False))
    elif "--health" in sys.argv:
        print(json.dumps(pool.get_health_report(), indent=2))
    else:
        print("Usage: --call <prompt> | --health")
