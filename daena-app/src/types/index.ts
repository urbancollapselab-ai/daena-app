export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  model?: string;
  agent?: string;
  timestamp: string;
  tokens?: number;
  latencyMs?: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
}

export interface AgentInfo {
  id: string;
  name: string;
  icon: string;
  status: AgentStatus;
  tasksToday: number;
  errors: number;
  modelTier: string;
  description?: string;
}

export type AgentStatus = "active" | "idle" | "monitoring" | "running" | "standby" | "error";

export interface ModelInfo {
  id: string;
  name: string;
  tier: "T0" | "T1" | "T2" | "T3";
  price: string;
  context: string;
  status: "available" | "rate_limited" | "down";
  requestsToday: number;
}

export interface SystemStatus {
  agentsActive: number;
  agentsTotal: number;
  modelsAvailable: number;
  modelsTotal: number;
  tokensToday: number;
  costToday: number;
  uptimeHours: number;
  freePercent: number;
}

export interface TriggerEvent {
  id: string;
  from: string;
  to: string;
  message: string;
  timestamp: string;
  type: "chain" | "scheduled";
}

export interface Settings {
  language: "en" | "tr" | "nl" | "ku";
  theme: "dark" | "light" | "system";
  aiName: string;
  companyName: string;
  industry: string;
  modelCascadeEnabled: boolean;
  dailyBudget: number;
  notificationsEnabled: boolean;
  agentsEnabled: Record<string, boolean>;
  openrouterKey?: string;
  anthropicKey?: string;
  telegramToken?: string;
  telegramChatId?: string;
  claudePath?: string;
  permissions?: {
    terminal: boolean;
    filesystem: boolean;
    network: boolean;
  };
}

export type Page = "chat" | "dashboard" | "agents" | "settings";
