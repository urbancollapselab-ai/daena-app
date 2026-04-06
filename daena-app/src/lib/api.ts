/**
 * Daena API Client — Communicates with Python backend via HTTP.
 * All requests have AbortController timeouts to prevent hanging.
 */

import { invoke } from "@tauri-apps/api/core";

let cachedPort: number | null = null;
let portPromise: Promise<number> | null = null;

export async function getApiBase(): Promise<string> {
  if (cachedPort) return `http://127.0.0.1:${cachedPort}`;

  if (!portPromise) {
    portPromise = (async () => {
      try {
        if ((window as any).__TAURI_INTERNALS__) {
          const port = await invoke<number>("get_backend_port");
          return port;
        }
      } catch {
        // Fallback to default
      }
      return 8910;
    })();
  }

  cachedPort = await portPromise;
  return `http://127.0.0.1:${cachedPort}`;
}

/** Create a fetch with automatic timeout via AbortController */
function fetchWithTimeout(url: string, opts: RequestInit = {}, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(id));
}

interface BrainResponse {
  success: boolean;
  response: string;
  model: string;
  latency_ms: number;
  agent?: string;
  tokens?: number;
  error?: string;
}

export interface HealthResponse {
  status: string;
  agents: { id: string; name: string; status: string; tasks_today: number }[];
  pool: {
    total_workers: number;
    available_workers: number;
    tiers: Record<string, number>;
    free_models: number;
    paid_models: number;
    stats: { total_calls: number; successful: number; failed: number };
  };
  uptime_hours: number;
}

import { useWSStore } from "../stores/wsTransport";

export async function sendMessage(message: string, agent?: string): Promise<BrainResponse> {
  // Use WS if connected
  const wsState = useWSStore.getState();
  if (wsState.connected) {
    try {
      const res = await wsState.send("chat", { message, agent });
      return res as BrainResponse;
    } catch (err) {
      console.warn("WS send failed, falling back to HTTP", err);
    }
  }

  try {
    const base = await getApiBase();
    const res = await fetchWithTimeout(`${base}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, agent }),
    }, 60000); // 60s for chat (LLM calls can be slow)
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return {
      success: false,
      response: "Backend is not running. Please start the Daena backend first.",
      model: "none",
      latency_ms: 0,
      error: String(err),
    };
  }
}


export async function getHealth(): Promise<HealthResponse | null> {
  try {
    const base = await getApiBase();
    const res = await fetchWithTimeout(`${base}/health`, {}, 4000);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getAgentStatus(): Promise<any[]> {
  try {
    const base = await getApiBase();
    const res = await fetchWithTimeout(`${base}/agents`, {}, 4000);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function updateSettingsApi(settings: Record<string, any>): Promise<boolean> {
  try {
    const base = await getApiBase();
    const res = await fetchWithTimeout(`${base}/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    }, 8000);
    return res.ok;
  } catch {
    return false;
  }
}

export async function testApiKey(key: string): Promise<boolean> {
  try {
    const base = await getApiBase();
    const res = await fetchWithTimeout(`${base}/test-key`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    }, 15000);
    const data = await res.json();
    return data.valid === true;
  } catch {
    return false;
  }
}

export function getModelDisplayName(modelId: string): string {
  const names: Record<string, string> = {
    "claude-opus-4-6": "Claude Opus 4.6",
    "qwen/qwen3.6-plus:free": "Qwen 3.6 Plus",
    "meta-llama/llama-4-maverick:free": "Llama 4 Maverick",
    "deepseek/deepseek-r1:free": "DeepSeek R1",
    "mistralai/devstral-2512:free": "Devstral 2",
    "nvidia/nemotron-3-super-120b-a12b:free": "Nemotron 120B",
    "openai/gpt-oss-120b:free": "GPT-OSS 120B",
    "qwen/qwen3-next-80b-a3b-instruct:free": "Qwen Next 80B",
    "google/gemma-4-31b-it": "Gemma 4",
    "google/gemini-3.1-flash-lite-preview": "Gemini 3.1 Flash",
    "deepseek/deepseek-v3.2": "DeepSeek V3.2",
    "anthropic/claude-3.5-haiku": "Claude 3.5 Haiku",
  };
  return names[modelId] || modelId.split("/").pop()?.replace(":free", "") || modelId;
}

export function isModelFree(modelId: string): boolean {
  return modelId.endsWith(":free") || modelId.includes("gpt-oss-120b:free");
}
