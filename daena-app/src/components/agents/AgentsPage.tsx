import { useAppStore } from "@/stores/appStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Power, PowerOff, Activity, Cpu, Server, Network, Wifi, PlayCircle, Eye, StopCircle
} from "lucide-react";
import { useState, useMemo } from "react";

const AGENT_COLORS: Record<string, string> = {
  main_brain: "#6C63FF", finance: "#00D4AA", data: "#22D3EE",
  marketing: "#FB7185", sales: "#FFB547", research: "#A78BFA",
  watchdog: "#F87171", heartbeat: "#34D399", coordinator: "#FBBF24",
};

const MOCK_TASKS = {
  main_brain: "Orchestrating system-wide workflows.",
  finance: "Processing pending Q3 invoices for ACME Corp.",
  data: "Scraping tech leads from LinkedIn and enriching via Apollo.",
  marketing: "Drafting social media campaign for new feature.",
  sales: "Sending follow-up emails to 'Warm' leads.",
  research: "Analyzing OpenAI's latest model capabilities.",
  watchdog: "Monitoring port 8910 for anomalous traffic.",
  heartbeat: "Idle. Next health check in 4 mins.",
  coordinator: "Waiting for intent payload.",
};

export function AgentsPage() {
  const { agents, updateAgent, models } = useAppStore();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const selected = agents.find((a) => a.id === selectedAgent);

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6 text-white/90 font-sans">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded bg-[#6C63FF] flex items-center justify-center shrink-0">
              <Network size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white/90">Agent Orchestration Console</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-semibold text-[#00D4AA]">
                  {agents.filter(a => a.status === "active" || a.status === "monitoring" || a.status === "running").length} Active Swarm
                </span>
                <span className="text-[10px] text-white/30">•</span>
                <span className="text-xs text-white/50">{agents.length} Total</span>
                <span className="text-[10px] text-white/30">•</span>
                <span className="text-xs text-white/50">{models.length} Models Linked</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00D4AA]/10 border border-[#00D4AA]/30">
            <Wifi size={14} className="text-[#00D4AA]" />
            <span className="text-[11px] font-bold text-[#00D4AA] tracking-wide uppercase">Core Online</span>
          </div>
        </div>

        {/* Agent Monitor Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
          {agents.map((agent, i) => {
            const color = AGENT_COLORS[agent.id] || AGENT_COLORS.main_brain;
            const isActive = agent.status === "active" || agent.status === "monitoring" || agent.status === "running";
            const isSelected = selectedAgent === agent.id;
            const currentTask = (MOCK_TASKS as any)[agent.id] || "Awaiting task execution.";
            
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedAgent(isSelected ? null : agent.id)}
                className={`relative cursor-pointer rounded-xl bg-[#11131C] border overflow-hidden transition-all ${
                  isSelected ? "border-[#6C63FF] shadow-lg shadow-[#6C63FF]/10 scale-[1.01]" : "border-white/5 hover:border-white/20"
                }`}
              >
                {/* Status Bar Indicator */}
                <div className="absolute left-0 top-0 bottom-0 w-1 transition-all" style={{ backgroundColor: isActive ? color : 'transparent' }} />
                
                <div className="p-5 pl-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-2xl relative">
                        {agent.icon}
                        {isActive && <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#11131C] animate-pulse" style={{ backgroundColor: color }} />}
                      </div>
                      <div>
                        <h3 className="text-[15px] font-bold text-white/90">{agent.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ backgroundColor: isActive ? `${color}20` : 'rgba(255,255,255,0.05)', color: isActive ? color : 'rgba(255,255,255,0.5)' }}>
                            {agent.status}
                          </span>
                          <span className="text-xs text-white/30 truncate max-w-[150px]">Cascading on {agent.modelTier}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Toggles */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isActive) updateAgent(agent.id, { status: "active" });
                        else if (agent.id !== "main_brain") updateAgent(agent.id, { status: "idle" });
                      }}
                      className="p-2 rounded-lg bg-[#1A1C23] border border-white/5 hover:border-white/10 transition-colors"
                    >
                      {isActive ? <StopCircle size={16} className="text-[#FF5757]" /> : <PlayCircle size={16} className="text-[#00D4AA]" />}
                    </button>
                  </div>

                  {/* ACTIVE TASK ROW (Very explicit) */}
                  <div className="mb-4">
                    <div className="text-[11px] font-semibold text-white/50 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                       <Activity size={12} /> Current Operation
                    </div>
                    <div className={`text-sm px-3 py-2.5 rounded-lg border ${isActive ? 'bg-[#1A1C23] border-white/10 text-white/80' : 'bg-transparent border-dashed border-white/5 text-white/40'}`}>
                      {isActive ? (
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: color }} />
                           {currentTask}
                        </div>
                      ) : (
                        "No active operation. Agent is standing by."
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono text-white/40">
                     <span className="flex items-center gap-1"><Cpu size={14} /> CPU: {isActive ? Math.floor(Math.random() * 20 + 5) : 0}%</span>
                     <span className="flex items-center gap-1"><Server size={14} /> MEM: {isActive ? Math.floor(Math.random() * 50 + 20) : '0'} MB</span>
                     <span className="flex items-center gap-1 opacity-50"><Eye size={14} /> Tasks Today: {agent.tasksToday}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
