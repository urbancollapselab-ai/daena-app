/**
 * Daena API Client — Communicates with Python FastAPI backend
 */

const API_BASE = "http://127.0.0.1:8910";

interface BrainResponse {
  success: boolean;
  response: string;
  model: string;
  latency_ms: number;
  agent?: string;
  tokens?: number;
  error?: string;
}

interface HealthResponse {
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

export async function sendMessage(message: string, agent?: string): Promise<BrainResponse> {
  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, agent }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    // Fallback: try running brain.py directly via shell
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
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getAgentStatus(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/agents`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function updateSettingsApi(settings: Record<string, any>): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function testApiKey(key: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/test-key`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
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
