import { useAppStore } from "@/stores/appStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Power, PowerOff, ChevronRight, AlertCircle, Activity,
  BarChart3, Cpu, Clock, Zap, ArrowRight, TrendingUp,
  MessageSquare, Shield, Eye, Terminal, Wifi, WifiOff,
  RefreshCw, MemoryStick, Server, Network
} from "lucide-react";
import { useState, useMemo, useEffect, memo, useCallback } from "react";

const AGENT_COLORS: Record<string, { primary: string; gradient: string; glow: string }> = {
  main_brain: { primary: "#6C63FF", gradient: "linear-gradient(135deg, #6C63FF, #8B7BFF)", glow: "rgba(108,99,255,0.3)" },
  finance:    { primary: "#00D4AA", gradient: "linear-gradient(135deg, #00D4AA, #00F5C8)", glow: "rgba(0,212,170,0.3)" },
  data:       { primary: "#22D3EE", gradient: "linear-gradient(135deg, #22D3EE, #67E8F9)", glow: "rgba(34,211,238,0.3)" },
  marketing:  { primary: "#FB7185", gradient: "linear-gradient(135deg, #FB7185, #FDA4AF)", glow: "rgba(251,113,133,0.3)" },
  sales:      { primary: "#FFB547", gradient: "linear-gradient(135deg, #FFB547, #FCD34D)", glow: "rgba(255,181,71,0.3)" },
  research:   { primary: "#A78BFA", gradient: "linear-gradient(135deg, #A78BFA, #C4B5FD)", glow: "rgba(167,139,250,0.3)" },
  watchdog:   { primary: "#F87171", gradient: "linear-gradient(135deg, #F87171, #FCA5A5)", glow: "rgba(248,113,113,0.3)" },
  heartbeat:  { primary: "#34D399", gradient: "linear-gradient(135deg, #34D399, #6EE7B7)", glow: "rgba(52,211,153,0.3)" },
  coordinator:{ primary: "#FBBF24", gradient: "linear-gradient(135deg, #FBBF24, #FDE68A)", glow: "rgba(251,191,36,0.3)" },
};

function generateActivity(seed: number): number[] {
  return Array.from({ length: 24 }, (_, i) => {
    const v = Math.abs(Math.sin(seed * (i + 1) * 0.7 + i * 0.3)) * 100;
    return Math.max(3, Math.round(v));
  });
}

function generateMemoryUsage(seed: number): number {
  return Math.round(35 + Math.abs(Math.sin(seed * 2.7)) * 55);
}

export function AgentsPage() {
  const { agents, updateAgent, settings, models } = useAppStore();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  // Memoize activity data so it doesn't recalculate every render
  const agentActivityMap = useMemo(() => {
    const map: Record<string, { activity: number[]; maxAct: number; memUsage: number }> = {};
    for (const agent of agents) {
      const activity = generateActivity(agent.id.charCodeAt(0) + agent.id.length);
      map[agent.id] = {
        activity,
        maxAct: Math.max(...activity),
        memUsage: generateMemoryUsage(agent.id.charCodeAt(0)),
      };
    }
    return map;
  }, [agents]);

  const selected = agents.find((a) => a.id === selectedAgent);

  return (
    <div className="h-full overflow-y-auto px-4 py-5">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6C63FF, #00D4AA)" }}>
              <Network size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Agent Control Center</h2>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[0.6875rem] text-[var(--color-text-tertiary)]">
                  {agents.filter(a => a.status === "active" || a.status === "monitoring" || a.status === "running").length} active
                </span>
                <span className="text-[0.6875rem] text-[var(--color-text-tertiary)]">•</span>
                <span className="text-[0.6875rem] text-[var(--color-text-tertiary)]">{agents.length} total</span>
                <span className="text-[0.6875rem] text-[var(--color-text-tertiary)]">•</span>
                <span className="text-[0.6875rem] text-[var(--color-text-tertiary)]">{models.length} models</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="badge badge-green"><Wifi size={8} /> ALL ONLINE</div>
          </div>
        </motion.div>

        {/* Agent Monitor Grid — This is the heart of the page */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-5">
          {agents.map((agent, i) => {
            const c = AGENT_COLORS[agent.id] || AGENT_COLORS.main_brain;
            const isActive = agent.status === "active" || agent.status === "monitoring" || agent.status === "running";
            const { activity, maxAct, memUsage } = agentActivityMap[agent.id] || { activity: [], maxAct: 1, memUsage: 0 };
            const isSelected = selectedAgent === agent.id;
            const uptime = (99 + Math.abs(Math.sin(i)) * 0.99).toFixed(1);
            const now = new Date();

            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
                onClick={() => setSelectedAgent(isSelected ? null : agent.id)}
                className={`relative cursor-pointer group rounded-2xl overflow-hidden transition-all duration-300 ${
                  isSelected ? "ring-2 scale-[1.01]" : "hover:scale-[1.005]"
                }`}
                style={{
                  background: "linear-gradient(145deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.015) 100%)",
                  backdropFilter: "blur(24px)",
                  border: `1px solid ${isSelected ? c.primary + "60" : "rgba(255,255,255,0.06)"}`,
                  boxShadow: isSelected
                    ? `0 8px 40px ${c.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`
                    : "0 2px 20px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.04)",
                  ...(isSelected ? { ringColor: c.primary } : {})
                }}
              >
                {/* Top gradient accent bar */}
                <div className="absolute top-0 left-0 right-0 h-[3px] transition-opacity duration-300"
                  style={{
                    background: c.gradient,
                    opacity: isActive ? 1 : 0.25,
                    boxShadow: isActive ? `0 0 20px ${c.glow}` : "none"
                  }}
                />

                {/* Ambient glow behind agent icon */}
                {isActive && (
                  <div className="absolute top-4 left-4 w-16 h-16 rounded-full transition-opacity opacity-20 group-hover:opacity-30"
                    style={{ background: c.primary, filter: "blur(25px)" }}
                  />
                )}

                <div className="relative p-5">
                  {/* Row 1: Avatar + Name + Status */}
                  <div className="flex items-start justify-between mb-3.5">
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all"
                          style={{
                            background: `${c.primary}18`,
                            border: `1px solid ${c.primary}25`,
                            boxShadow: isActive ? `0 0 24px ${c.glow}` : "none",
                          }}
                        >
                          {agent.icon}
                        </div>
                        {/* Live pulse dot */}
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[var(--color-bg-deep)] status-${agent.status}`} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold tracking-tight">{agent.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[0.625rem] capitalize" style={{ color: isActive ? c.primary : "var(--color-text-tertiary)" }}>
                            {agent.status}
                          </span>
                          <span className="text-[0.5rem] text-[var(--color-text-tertiary)]">|</span>
                          <span className="text-[0.5625rem] font-mono text-[var(--color-text-tertiary)]">{agent.modelTier}</span>
                        </div>
                      </div>
                    </div>
                    {agent.errors > 0 && (
                      <div className="badge badge-red"><AlertCircle size={9} /> {agent.errors}</div>
                    )}
                  </div>

                  {/* Row 2: Description */}
                  <p className="text-[0.6875rem] text-[var(--color-text-secondary)] mb-4 leading-relaxed line-clamp-2 min-h-[2.25rem]">
                    {agent.description || "Specialized autonomous agent handling department operations."}
                  </p>

                  {/* Row 3: Metrics Grid (4 KPIs) */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-extrabold" style={{ color: c.primary }}>{agent.tasksToday}</div>
                      <div className="text-[0.5rem] text-[var(--color-text-tertiary)] uppercase tracking-wider">Tasks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-extrabold text-[var(--color-text-primary)]">{agent.tasksToday * 2}</div>
                      <div className="text-[0.5rem] text-[var(--color-text-tertiary)] uppercase tracking-wider">Msgs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-extrabold text-[var(--color-text-primary)]">{memUsage}%</div>
                      <div className="text-[0.5rem] text-[var(--color-text-tertiary)] uppercase tracking-wider">Mem</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-extrabold text-[var(--color-accent)]">{uptime}%</div>
                      <div className="text-[0.5rem] text-[var(--color-text-tertiary)] uppercase tracking-wider">Uptime</div>
                    </div>
                  </div>

                  {/* Row 4: Activity Sparkline */}
                  <div className="flex items-end gap-[3px] h-9">
                    {activity.map((val, j) => (
                      <div
                        key={j}
                        className="flex-1 rounded-t-sm transition-all duration-300"
                        style={{
                          height: `${(val / maxAct) * 100}%`,
                          background: j === activity.length - 1
                            ? c.gradient
                            : `${c.primary}${Math.round(0.15 + (j / activity.length) * 0.6).toString()}0`,
                          minHeight: 2,
                          boxShadow: j === activity.length - 1 ? `0 0 8px ${c.glow}` : "none",
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[0.4375rem] text-[var(--color-text-tertiary)]">24h ago</span>
                    <span className="text-[0.4375rem] text-[var(--color-text-tertiary)]">now</span>
                  </div>

                  {/* Row 5: Bottom toolbar */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.primary }} />
                      <span className="text-[0.5625rem] text-[var(--color-text-tertiary)]">
                        Last active: {now.getHours()}:{String(now.getMinutes()).padStart(2, "0")}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (agent.status === "idle" || agent.status === "standby") {
                          updateAgent(agent.id, { status: "active" });
                        } else if (agent.id !== "main_brain") {
                          updateAgent(agent.id, { status: "idle" });
                        }
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[0.5625rem] font-medium transition-all hover:bg-white/5"
                      style={{ color: isActive ? c.primary : "var(--color-text-tertiary)" }}
                    >
                      {isActive ? <><Power size={10} /> Active</> : <><PowerOff size={10} /> Activate</>}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Expanded Agent Detail Panel */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <AgentDetailPanel
                agent={selected}
                color={AGENT_COLORS[selected.id] || AGENT_COLORS.main_brain}
                onClose={() => setSelectedAgent(null)}
                onToggle={() => {
                  if (selected.status === "idle" || selected.status === "standby") {
                    updateAgent(selected.id, { status: "active" });
                  } else if (selected.id !== "main_brain") {
                    updateAgent(selected.id, { status: "idle" });
                  }
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trigger Chain Network */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FBBF24, #F59E0B)" }}>
              <Zap size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Trigger Chain Network</h3>
              <p className="text-[0.625rem] text-[var(--color-text-tertiary)]">Automated inter-agent workflows</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {TRIGGER_CHAINS.map((chain, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.05 }}
                className="glass-sm glass-hover p-4 group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="agent-avatar" style={{ width: 32, height: 32, borderRadius: 10, fontSize: '0.875rem' }}>
                    {chain.fromIcon}
                  </div>
                  <ArrowRight size={14} className="text-[var(--color-primary)] group-hover:text-[var(--color-accent)] transition-colors" />
                  <div className="agent-avatar" style={{ width: 32, height: 32, borderRadius: 10, fontSize: '0.875rem' }}>
                    {chain.toIcon}
                  </div>
                  <div className="ml-1">
                    <div className="text-xs font-semibold">{chain.from} <span className="text-[var(--color-text-tertiary)] font-normal">→</span> {chain.to}</div>
                  </div>
                </div>
                <p className="text-[0.6875rem] text-[var(--color-text-secondary)] leading-relaxed">{chain.description}</p>
                <div className="mt-2">
                  <span className="badge badge-blue">{chain.trigger}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Scheduled Triggers */}
          <div className="divider my-5" />
          <div className="flex items-center gap-3 mb-4">
            <Clock size={14} className="text-[var(--color-gold)]" />
            <span className="text-xs font-semibold">Scheduled Triggers</span>
          </div>
          <div className="flex gap-3 flex-wrap">
            {SCHEDULED_TRIGGERS.map((st, i) => (
              <div key={i} className="glass-sm p-3 flex items-center gap-3">
                <div className="text-lg font-mono font-bold text-[var(--color-gold)]">{st.time}</div>
                <div>
                  <div className="text-xs font-medium">{st.agent}</div>
                  <div className="text-[0.625rem] text-[var(--color-text-tertiary)]">{st.task}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function AgentDetailPanel({
  agent, color, onClose, onToggle,
}: {
  agent: any; color: { primary: string; gradient: string; glow: string }; onClose: () => void; onToggle: () => void;
}) {
  const activity = useMemo(() => generateActivity(agent.id.charCodeAt(0) + agent.id.length), [agent.id]);
  const maxAct = Math.max(...activity);
  const isActive = agent.status === "active" || agent.status === "monitoring" || agent.status === "running";
  const memUsage = generateMemoryUsage(agent.id.charCodeAt(0));

  return (
    <div className="glass p-6 relative overflow-hidden" style={{ borderColor: `${color.primary}25` }}>
      {/* Big ambient glow */}
      <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full opacity-10" style={{ background: color.primary, filter: "blur(60px)" }} />

      <div className="relative">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{
                background: color.gradient,
                boxShadow: `0 8px 32px ${color.glow}`,
              }}
            >
              {agent.icon}
            </div>
            <div>
              <h3 className="text-xl font-extrabold">{agent.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <div className={`status-dot-lg status-${agent.status}`} />
                <span className="text-xs text-[var(--color-text-secondary)] capitalize">{agent.status}</span>
                <span className="text-[0.625rem] text-[var(--color-text-tertiary)]">|</span>
                <span className="text-[0.625rem] font-mono text-[var(--color-text-tertiary)]">Cascade: {agent.modelTier}</span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mt-2 max-w-lg">{agent.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isActive && agent.id !== "main_brain" ? (
              <button onClick={onToggle} className="btn-ghost text-xs"><PowerOff size={14} /> Deactivate</button>
            ) : !isActive ? (
              <button onClick={onToggle} className="btn-primary text-xs py-2 px-4"><Power size={14} /> Activate</button>
            ) : null}
            <button onClick={onClose} className="btn-ghost text-xs px-3">Close</button>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <DetailMetric label="Tasks Today" value={String(agent.tasksToday)} color={color.primary} icon={Activity} />
          <DetailMetric label="Errors" value={String(agent.errors)} color={agent.errors > 0 ? "var(--color-error)" : color.primary} icon={AlertCircle} />
          <DetailMetric label="Success Rate" value={agent.errors > 0 ? `${Math.round((1 - agent.errors / Math.max(agent.tasksToday, 1)) * 100)}%` : "100%"} color={color.primary} icon={TrendingUp} />
          <DetailMetric label="Messages" value={String(agent.tasksToday * 2)} color={color.primary} icon={MessageSquare} />
          <DetailMetric label="Memory" value={`${memUsage}%`} color={memUsage > 80 ? "var(--color-warning)" : color.primary} icon={Server} />
        </div>

        {/* Large Activity Chart */}
        <div className="glass-sm p-5">
          <div className="text-[0.625rem] text-[var(--color-text-tertiary)] uppercase tracking-widest mb-3 font-semibold">Activity (24h)</div>
          <div className="flex items-end gap-1.5 h-20">
            {activity.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-sm transition-all"
                  style={{
                    height: `${(val / maxAct) * 100}%`,
                    background: `linear-gradient(to top, ${color.primary}30, ${color.primary})`,
                    minHeight: 3,
                    boxShadow: i === activity.length - 1 ? `0 0 12px ${color.glow}` : "none",
                  }}
                />
                {i % 4 === 0 && <span className="text-[0.4375rem] text-[var(--color-text-tertiary)]">{i}h</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailMetric({ label, value, color, icon: Icon }: {
  label: string; value: string; color: string; icon: any;
}) {
  return (
    <div className="glass-sm p-3 relative overflow-hidden group hover:border-white/10 transition-all">
      <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full opacity-0 group-hover:opacity-15 transition-opacity" style={{ background: color, filter: "blur(15px)" }} />
      <div className="relative">
        <div className="flex items-center gap-1.5 mb-2">
          <Icon size={12} style={{ color }} />
          <span className="text-[0.5625rem] text-[var(--color-text-tertiary)] uppercase tracking-wider">{label}</span>
        </div>
        <div className="text-xl font-extrabold" style={{ color }}>{value}</div>
      </div>
    </div>
  );
}

const TRIGGER_CHAINS = [
  { from: "Data", to: "Sales", fromIcon: "📊", toIcon: "🎯", description: "New leads trigger automatic outreach sequences", trigger: "lead_found" },
  { from: "Research", to: "Marketing", fromIcon: "🔬", toIcon: "📣", description: "Competitor intelligence feeds marketing strategy", trigger: "intel_ready" },
  { from: "Finance", to: "Main Brain", fromIcon: "💰", toIcon: "🧠", description: "Overdue invoices trigger priority alerts", trigger: "invoice_late" },
  { from: "Watchdog", to: "Coordinator", fromIcon: "🛡️", toIcon: "🎭", description: "System errors trigger auto-restart sequences", trigger: "error_detected" },
  { from: "Sales", to: "Finance", fromIcon: "🎯", toIcon: "💰", description: "Deal closure triggers automatic invoicing", trigger: "deal_closed" },
];

const SCHEDULED_TRIGGERS = [
  { time: "08:30", agent: "Heartbeat", task: "Morning system health report" },
  { time: "13:30", agent: "Research", task: "Midday market scan" },
  { time: "20:30", agent: "Watchdog", task: "End-of-day security audit" },
];
