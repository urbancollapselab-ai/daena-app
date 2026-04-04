import { useAppStore } from "@/stores/appStore";
import { motion } from "framer-motion";
import { Power, PowerOff, ChevronRight, AlertCircle } from "lucide-react";
import { useState } from "react";

export function AgentsPage() {
  const { agents, updateAgent, settings } = useAppStore();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const selected = agents.find((a) => a.id === selectedAgent);

  return (
    <div className="h-full overflow-y-auto px-6 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold">Agent Management</h2>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {agents.filter((a) => a.status !== "error").length} agents operational
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent Grid */}
          <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-3">
            {agents.map((agent, i) => {
              const isEnabled = settings.agentsEnabled[agent.id] !== false;
              return (
                <motion.button
                  key={agent.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedAgent(agent.id)}
                  className={`glass glass-hover p-4 text-left transition-all relative ${
                    selectedAgent === agent.id
                      ? "!border-[var(--color-primary)] bg-[var(--color-primary-dim)]"
                      : ""
                  } ${!isEnabled ? "opacity-40" : ""}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-2xl">{agent.icon}</span>
                    <div className={`status-dot status-${agent.status}`} />
                  </div>
                  <div className="text-sm font-semibold mb-0.5">{agent.name}</div>
                  <div className="text-[0.625rem] text-[var(--color-text-tertiary)] capitalize mb-2">{agent.status}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-[0.625rem] text-[var(--color-text-tertiary)]">{agent.tasksToday} tasks</span>
                    <span className="text-[0.5625rem] font-mono text-[var(--color-text-tertiary)]">{agent.modelTier}</span>
                  </div>
                  {agent.errors > 0 && (
                    <div className="absolute top-2 right-8 badge badge-red text-[0.5rem]">
                      <AlertCircle size={8} /> {agent.errors}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Agent Detail */}
          <div className="lg:col-span-1">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass p-5 sticky top-6"
              >
                <div className="text-center mb-5">
                  <div className="text-4xl mb-2">{selected.icon}</div>
                  <h3 className="text-lg font-bold">{selected.name}</h3>
                  <div className={`inline-flex items-center gap-1.5 mt-1`}>
                    <div className={`status-dot status-${selected.status}`} />
                    <span className="text-xs text-[var(--color-text-secondary)] capitalize">{selected.status}</span>
                  </div>
                </div>

                <p className="text-xs text-[var(--color-text-secondary)] text-center mb-5">
                  {selected.description}
                </p>

                <div className="space-y-3">
                  <DetailRow label="Model Tier" value={selected.modelTier} />
                  <DetailRow label="Tasks Today" value={String(selected.tasksToday)} />
                  <DetailRow label="Errors" value={String(selected.errors)} />
                  <DetailRow label="Status" value={selected.status} />
                </div>

                <div className="mt-5 pt-4 border-t border-[var(--color-border)] space-y-2">
                  {selected.status === "idle" || selected.status === "standby" ? (
                    <button
                      onClick={() => updateAgent(selected.id, { status: "active" })}
                      className="btn-primary w-full justify-center text-xs"
                    >
                      <Power size={14} /> Activate
                    </button>
                  ) : selected.id !== "main_brain" ? (
                    <button
                      onClick={() => updateAgent(selected.id, { status: "idle" })}
                      className="btn-ghost w-full justify-center text-xs"
                    >
                      <PowerOff size={14} /> Deactivate
                    </button>
                  ) : null}
                </div>
              </motion.div>
            ) : (
              <div className="glass p-8 text-center">
                <div className="text-3xl mb-3">👆</div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Select an agent to view details
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Trigger Chains */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass p-5 mt-6"
        >
          <h3 className="text-sm font-semibold mb-4">⚡ Trigger Chains</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {TRIGGER_CHAINS.map((chain, i) => (
              <div key={i} className="glass-sm p-3">
                <div className="flex items-center gap-2 text-sm mb-1">
                  <span>{chain.fromIcon}</span>
                  <ChevronRight size={12} className="text-[var(--color-primary)]" />
                  <span>{chain.toIcon}</span>
                  <span className="text-xs font-medium">{chain.from} → {chain.to}</span>
                </div>
                <p className="text-[0.625rem] text-[var(--color-text-tertiary)]">{chain.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

const TRIGGER_CHAINS = [
  { from: "Data", to: "Sales", fromIcon: "📊", toIcon: "🎯", description: "Lead found → Start outreach" },
  { from: "Research", to: "Marketing", fromIcon: "🔬", toIcon: "📣", description: "Competitor intel → Update strategy" },
  { from: "Finance", to: "Brain", fromIcon: "💰", toIcon: "🧠", description: "Late invoice → Send alert" },
  { from: "Watchdog", to: "Coordinator", fromIcon: "🛡️", toIcon: "🎭", description: "Error detected → Auto restart" },
  { from: "Sales", to: "Finance", fromIcon: "🎯", toIcon: "💰", description: "Client accepted → Create invoice" },
];

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-[var(--color-text-tertiary)]">{label}</span>
      <span className="text-xs font-medium capitalize">{value}</span>
    </div>
  );
}
