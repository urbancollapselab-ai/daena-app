import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage, Conversation, AgentInfo, SystemStatus, Settings, Page, TriggerEvent, ModelInfo } from "@/types";

interface AppState {
  // Navigation
  currentPage: Page;
  setPage: (page: Page) => void;

  // Setup
  setupComplete: boolean;
  setSetupComplete: (v: boolean) => void;

  // Chat
  conversations: Conversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  addConversation: () => string;
  setActiveConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  addMessage: (convId: string, message: ChatMessage) => void;
  setLoading: (v: boolean) => void;

  // Agents
  agents: AgentInfo[];
  setAgents: (agents: AgentInfo[]) => void;
  updateAgent: (id: string, partial: Partial<AgentInfo>) => void;

  // Models
  models: ModelInfo[];
  setModels: (models: ModelInfo[]) => void;

  // System
  systemStatus: SystemStatus;
  setSystemStatus: (status: SystemStatus) => void;

  // Triggers
  triggerHistory: TriggerEvent[];
  addTrigger: (t: TriggerEvent) => void;

  // Settings
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
  
  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

const DEFAULT_SETTINGS: Settings = {
  language: "en",
  theme: "dark",
  aiName: "Daena",
  companyName: "",
  industry: "",
  modelCascadeEnabled: true,
  dailyBudget: 5.0,
  notificationsEnabled: true,
  agentsEnabled: {
    finance: true, data: true, marketing: true, sales: true,
    research: true, watchdog: true, heartbeat: true, coordinator: true,
  },
};

const DEFAULT_AGENTS: AgentInfo[] = [
  { id: "main_brain", name: "Main Brain", icon: "🧠", status: "active", tasksToday: 0, errors: 0, modelTier: "Opus → T0", description: "Central intelligence that orchestrates all agents" },
  { id: "finance", name: "Finance", icon: "💰", status: "active", tasksToday: 0, errors: 0, modelTier: "T0→T3", description: "Invoicing, budget tracking, financial analysis" },
  { id: "data", name: "Data", icon: "📊", status: "idle", tasksToday: 0, errors: 0, modelTier: "T1→T3", description: "Lead enrichment, data collection, CRM management" },
  { id: "marketing", name: "Marketing", icon: "📣", status: "idle", tasksToday: 0, errors: 0, modelTier: "T0→T3", description: "Content creation, social media, campaigns" },
  { id: "sales", name: "Sales", icon: "🎯", status: "idle", tasksToday: 0, errors: 0, modelTier: "T0→T3", description: "Outreach, proposals, client relations" },
  { id: "research", name: "Research", icon: "🔬", status: "idle", tasksToday: 0, errors: 0, modelTier: "T0→T3", description: "Market research, competitor analysis, trend detection" },
  { id: "watchdog", name: "Watchdog", icon: "🛡️", status: "monitoring", tasksToday: 0, errors: 0, modelTier: "T2→T3", description: "System health monitoring, error detection" },
  { id: "heartbeat", name: "Heartbeat", icon: "💓", status: "running", tasksToday: 0, errors: 0, modelTier: "T2→T3", description: "Uptime tracking, scheduled reports" },
  { id: "coordinator", name: "Coordinator", icon: "🎭", status: "standby", tasksToday: 0, errors: 0, modelTier: "T0→T3", description: "Inter-agent task routing, workflow management" },
];

const DEFAULT_MODELS: ModelInfo[] = [
  { id: "qwen/qwen3.6-plus:free", name: "Qwen 3.6 Plus", tier: "T0", price: "FREE", context: "1M", status: "available", requestsToday: 0 },
  { id: "meta-llama/llama-4-maverick:free", name: "Llama 4 Maverick", tier: "T1", price: "FREE", context: "1M", status: "available", requestsToday: 0 },
  { id: "qwen/qwen3-coder:free", name: "Qwen 3 Coder", tier: "T1", price: "FREE", context: "256K", status: "available", requestsToday: 0 },
  { id: "mistralai/devstral-2512:free", name: "Devstral 2", tier: "T1", price: "FREE", context: "256K", status: "available", requestsToday: 0 },
  { id: "deepseek/deepseek-r1:free", name: "DeepSeek R1", tier: "T1", price: "FREE", context: "64K", status: "available", requestsToday: 0 },
  { id: "nvidia/nemotron-3-super-120b-a12b:free", name: "Nemotron 120B", tier: "T1", price: "FREE", context: "128K", status: "available", requestsToday: 0 },
  { id: "openai/gpt-oss-120b:free", name: "GPT-OSS 120B", tier: "T1", price: "FREE", context: "128K", status: "available", requestsToday: 0 },
  { id: "qwen/qwen3-next-80b-a3b-instruct:free", name: "Qwen Next 80B", tier: "T1", price: "FREE", context: "64K", status: "available", requestsToday: 0 },
  { id: "meta-llama/llama-4-scout:free", name: "Llama 4 Scout", tier: "T2", price: "FREE", context: "512K", status: "available", requestsToday: 0 },
  { id: "minimax/minimax-m2.5:free", name: "MiniMax M2.5", tier: "T2", price: "FREE", context: "1M", status: "available", requestsToday: 0 },
  { id: "google/gemma-3-27b-it:free", name: "Gemma 3 27B", tier: "T2", price: "FREE", context: "96K", status: "available", requestsToday: 0 },
  { id: "stepfun/step-3.5-mini:free", name: "Step 3.5 Mini", tier: "T2", price: "FREE", context: "128K", status: "available", requestsToday: 0 },
  { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B", tier: "T2", price: "FREE", context: "128K", status: "available", requestsToday: 0 },
  { id: "openai/gpt-oss-120b", name: "GPT-OSS 120B (Paid)", tier: "T3", price: "$0.04/M", context: "128K", status: "available", requestsToday: 0 },
  { id: "google/gemini-2.5-flash-lite-preview", name: "Gemini 2.5 Flash Lite", tier: "T3", price: "$0.10/M", context: "1M", status: "available", requestsToday: 0 },
  { id: "google/gemma-4-31b-it", name: "Gemma 4 31B", tier: "T3", price: "$0.14/M", context: "128K", status: "available", requestsToday: 0 },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", tier: "T3", price: "$0.15/M", context: "128K", status: "available", requestsToday: 0 },
  { id: "google/gemini-3.1-flash-lite-preview", name: "Gemini 3.1 Flash", tier: "T3", price: "$0.25/M", context: "1M", status: "available", requestsToday: 0 },
  { id: "deepseek/deepseek-v3.2", name: "DeepSeek V3.2", tier: "T3", price: "$0.26/M", context: "128K", status: "available", requestsToday: 0 },
  { id: "anthropic/claude-3.5-haiku", name: "Claude 3.5 Haiku", tier: "T3", price: "$0.80/M", context: "200K", status: "available", requestsToday: 0 },
];

const DEFAULT_STATUS: SystemStatus = {
  agentsActive: 5,
  agentsTotal: 9,
  modelsAvailable: 20,
  modelsTotal: 20,
  tokensToday: 0,
  costToday: 0,
  uptimeHours: 0,
  freePercent: 100,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentPage: "chat",
      setPage: (page) => set({ currentPage: page }),

      setupComplete: false,
      setSetupComplete: (v) => set({ setupComplete: v }),

      conversations: [],
      activeConversationId: null,
      isLoading: false,

      addConversation: () => {
        const id = `conv_${Date.now()}`;
        const conv: Conversation = {
          id,
          title: "New Chat",
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          pinned: false,
        };
        set((s) => ({
          conversations: [conv, ...s.conversations],
          activeConversationId: id,
        }));
        return id;
      },

      setActiveConversation: (id) => set({ activeConversationId: id }),

      deleteConversation: (id) => {
        set((s) => {
          const remaining = s.conversations.filter((c) => c.id !== id);
          return {
            conversations: remaining,
            activeConversationId: s.activeConversationId === id
              ? (remaining[0]?.id ?? null)
              : s.activeConversationId,
          };
        });
      },

      addMessage: (convId, message) => {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  messages: [...c.messages, message],
                  updatedAt: new Date().toISOString(),
                  title: c.messages.length === 0 && message.role === "user"
                    ? message.content.slice(0, 50) + (message.content.length > 50 ? "..." : "")
                    : c.title,
                }
              : c
          ),
        }));
      },

      setLoading: (v) => set({ isLoading: v }),

      agents: DEFAULT_AGENTS,
      setAgents: (agents) => set({ agents }),
      updateAgent: (id, partial) => set((s) => ({
        agents: s.agents.map((a) => a.id === id ? { ...a, ...partial } : a),
      })),

      models: DEFAULT_MODELS,
      setModels: (models) => set({ models }),

      systemStatus: DEFAULT_STATUS,
      setSystemStatus: (status) => set({ systemStatus: status }),

      triggerHistory: [],
      addTrigger: (t) => set((s) => ({
        triggerHistory: [t, ...s.triggerHistory].slice(0, 50),
      })),

      settings: DEFAULT_SETTINGS,
      updateSettings: (partial) => set((s) => ({
        settings: { ...s.settings, ...partial },
      })),

      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    {
      name: "daena-storage",
      partialize: (state) => ({
        setupComplete: state.setupComplete,
        conversations: state.conversations,
        settings: state.settings,
        sidebarCollapsed: state.sidebarCollapsed,
        triggerHistory: state.triggerHistory,
      }),
    }
  )
);
