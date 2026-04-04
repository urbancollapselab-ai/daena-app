import { useAppStore } from "@/stores/appStore";
import { motion } from "framer-motion";
import {
  Activity, Cpu, Zap, DollarSign, Clock, TrendingUp,
  Shield, BarChart3, Globe, ArrowUpRight, ArrowDownRight,
  Layers, Radio, MessageSquare, Wifi, Server, Network
} from "lucide-react";
import { useMemo } from "react";

const AGENT_COLORS: Record<string, string> = {
  main_brain: "#6C63FF", finance: "#00D4AA", data: "#22D3EE",
  marketing: "#FB7185", sales: "#FFB547", research: "#A78BFA",
  watchdog: "#F87171", heartbeat: "#34D399", coordinator: "#FBBF24",
};

export function DashboardPage() {
  const { agents, models, systemStatus, triggerHistory } = useAppStore();

  const activeAgents = agents.filter((a) => a.status !== "idle" && a.status !== "error");
  const freeModels = models.filter((m) => m.tier !== "T3");

  // Simulated hourly data
  const hourlyData = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      requests: Math.round(Math.abs(Math.sin(i * 0.5)) * 50 + Math.random() * 20),
      tokens: Math.round(Math.abs(Math.cos(i * 0.3)) * 1200 + 200),
    })), []
  );
  const maxRequests = Math.max(...hourlyData.map(d => d.requests));

  return (
    <div className="h-full overflow-y-auto px-4 py-5">
      <div className="max-w-[1600px] mx-auto space-y-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #00D4AA, #6C63FF)" }}>
              <BarChart3 size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">System Dashboard</h2>
              <p className="text-[0.6875rem] text-[var(--color-text-tertiary)]">Real-time overview of your AI command center</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="badge badge-green"><Radio size={8} /> LIVE</div>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            icon={Cpu} label="Agents Active" value={`${activeAgents.length}`}
            total={`/ ${agents.length}`} trend="+2" trendUp={true} color="#6C63FF"
            detail="All departments online" gradient="linear-gradient(135deg, #6C63FF20, #6C63FF05)"
          />
          <KPICard
            icon={Zap} label="Models Ready" value={`${systemStatus.modelsAvailable}`}
            total={`/ ${systemStatus.modelsTotal}`} trend={`${freeModels.length} free`}
            trendUp={true} color="#00D4AA" detail="20-model cascade active"
            gradient="linear-gradient(135deg, #00D4AA20, #00D4AA05)"
          />
          <KPICard
            icon={Activity} label="Tokens Today"
            value={systemStatus.tokensToday > 1000 ? `${(systemStatus.tokensToday / 1000).toFixed(1)}K` : String(systemStatus.tokensToday)}
            total="" trend="~2,600 free/day" trendUp={true} color="#E8C547"
            detail="Across all conversations" gradient="linear-gradient(135deg, #E8C54720, #E8C54705)"
          />
          <KPICard
            icon={DollarSign} label="Cost Today" value={`$${systemStatus.costToday.toFixed(2)}`}
            total="" trend={`${systemStatus.freePercent.toFixed(0)}% free`}
            trendUp={true} color="#22D3EE" detail="Free tier prioritized"
            gradient="linear-gradient(135deg, #22D3EE20, #22D3EE05)"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Agent Network — Left 2/3 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 glass p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #6C63FF, #8B7BFF)" }}>
                  <Network size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Agent Network</h3>
                  <p className="text-[0.625rem] text-[var(--color-text-tertiary)]">{activeAgents.length} active departments</p>
                </div>
              </div>
              <span className="badge badge-green">{activeAgents.length} online</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {agents.map((agent, i) => {
                const color = AGENT_COLORS[agent.id] || "#6C63FF";
                const isActive = agent.status !== "idle" && agent.status !== "error";
                return (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 + i * 0.03 }}
                    className="relative overflow-hidden rounded-xl border border-white/[0.06] p-3 transition-all hover:border-white/10 hover:bg-white/[0.03] cursor-pointer group"
                    style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))" }}
                  >
                    {/* Colored top accent */}
                    <div className="absolute top-0 left-0 right-0 h-[2px]"
                      style={{ background: color, opacity: isActive ? 0.7 : 0.15 }} />

                    {/* Ambient glow on hover */}
                    <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full opacity-0 group-hover:opacity-20 transition-opacity"
                      style={{ background: color, filter: "blur(20px)" }} />

                    <div className="relative flex items-center gap-2.5 mb-2">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                        style={{ background: `${color}15`, border: `1px solid ${color}20` }}>
                        {agent.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate">{agent.name}</div>
                        <div className="flex items-center gap-1">
                          <div className={`status-dot status-${agent.status}`} style={{ width: 6, height: 6 }} />
                          <span className="text-[0.5625rem] text-[var(--color-text-tertiary)] capitalize">{agent.status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="relative flex items-center justify-between">
                      <span className="text-[0.5625rem] text-[var(--color-text-tertiary)]">{agent.tasksToday} tasks</span>
                      <span className="text-[0.5rem] font-mono text-[var(--color-text-tertiary)]">{agent.modelTier}</span>
                    </div>
                    {agent.errors > 0 && (
                      <div className="absolute top-2 right-2">
                        <span className="badge badge-red text-[0.5rem] py-0 px-1.5">{agent.errors}</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Right Column */}
          <div className="space-y-5">
            {/* Model Cascade */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #00D4AA, #22D3EE)" }}>
                    <Layers size={14} className="text-white" />
                  </div>
                  <h3 className="text-xs font-bold">Model Cascade</h3>
                </div>
                <span className="text-[0.5625rem] text-[var(--color-accent)] font-semibold">{freeModels.length} FREE</span>
              </div>

              <div className="space-y-3">
                <TierRow tier="T0" label="Primary" color="var(--color-accent)" count={models.filter(m => m.tier === "T0").length} models={models.filter(m => m.tier === "T0")} />
                <TierRow tier="T1" label="Strong" color="var(--color-primary)" count={models.filter(m => m.tier === "T1").length} models={models.filter(m => m.tier === "T1")} />
                <TierRow tier="T2" label="Light" color="var(--color-gold)" count={models.filter(m => m.tier === "T2").length} models={models.filter(m => m.tier === "T2")} />
                <TierRow tier="T3" label="Paid" color="var(--color-warning)" count={models.filter(m => m.tier === "T3").length} models={models.filter(m => m.tier === "T3")} />
              </div>

              {/* Visual cascade bar */}
              <div className="mt-4 pt-3 border-t border-white/5">
                <div className="flex gap-[2px] h-3.5">
                  {models.map((m) => (
                    <div
                      key={m.id}
                      className="flex-1 rounded-sm transition-all hover:opacity-100"
                      style={{
                        background: m.tier === "T0" ? "var(--color-accent)"
                          : m.tier === "T1" ? "var(--color-primary)"
                          : m.tier === "T2" ? "var(--color-gold)"
                          : "var(--color-warning)",
                        opacity: m.status === "available" ? 0.75 : 0.15,
                      }}
                      title={`${m.name} (${m.price})`}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[0.5rem] text-[var(--color-accent)] font-semibold">FREE TIER</span>
                  <span className="text-[0.5rem] text-[var(--color-warning)] font-semibold">PAID</span>
                </div>
              </div>
            </motion.div>

            {/* Uptime */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="glass p-5 relative overflow-hidden"
            >
              <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-10" style={{ background: "#E8C547", filter: "blur(30px)" }} />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #E8C547, #FBBF24)" }}>
                    <Clock size={14} className="text-white" />
                  </div>
                  <h3 className="text-xs font-bold">System Uptime</h3>
                </div>
                <div className="text-3xl font-extrabold text-[var(--color-gold)] mb-1">
                  {systemStatus.uptimeHours.toFixed(1)}h
                </div>
                <p className="text-[0.625rem] text-[var(--color-text-tertiary)]">Since last restart</p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-[var(--color-surface-active)] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: "99.9%", background: "linear-gradient(90deg, #E8C547, #FBBF24)" }} />
                  </div>
                  <span className="text-[0.5625rem] font-mono font-bold text-[var(--color-gold)]">99.9%</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Activity Timeline + Request Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Request Chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #6C63FF, #A78BFA)" }}>
                  <TrendingUp size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Request Volume</h3>
                  <p className="text-[0.625rem] text-[var(--color-text-tertiary)]">24-hour distribution</p>
                </div>
              </div>
            </div>
            <div className="flex items-end gap-1 h-28">
              {hourlyData.map((d, i) => {
                const height = (d.requests / maxRequests) * 100;
                const isNow = i === new Date().getHours();
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div
                      className="w-full rounded-t transition-all cursor-pointer hover:opacity-100"
                      style={{
                        height: `${height}%`,
                        minHeight: 3,
                        background: isNow
                          ? "linear-gradient(to top, #00D4AA, #6C63FF)"
                          : "linear-gradient(to top, rgba(108,99,255,0.15), rgba(108,99,255,0.45))",
                        boxShadow: isNow ? "0 0 16px rgba(108,99,255,0.4)" : "none",
                      }}
                    />
                    {i % 4 === 0 && (
                      <span className="text-[0.4375rem] text-[var(--color-text-tertiary)]">{String(i).padStart(2, "0")}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="glass p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #FBBF24, #F59E0B)" }}>
                  <MessageSquare size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Recent Activity</h3>
                  <p className="text-[0.625rem] text-[var(--color-text-tertiary)]">Agent triggers & events</p>
                </div>
              </div>
            </div>
            {triggerHistory.length > 0 ? (
              <div className="space-y-0 max-h-60 overflow-y-auto pr-1">
                {triggerHistory.slice(0, 8).map((t) => (
                  <div key={t.id} className="activity-line py-2">
                    <div className="activity-dot"
                      style={{ background: t.type === "chain" ? "var(--color-primary)" : "var(--color-gold)" }} />
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="badge" style={{
                        background: t.type === "chain" ? "var(--color-primary-dim)" : "var(--color-gold-dim)",
                        color: t.type === "chain" ? "var(--color-primary)" : "var(--color-gold)",
                        fontSize: "0.5625rem", padding: "1px 6px",
                      }}>
                        {t.type === "chain" ? "CHAIN" : "CRON"}
                      </span>
                      <span className="text-[0.625rem] text-[var(--color-text-tertiary)]">
                        {new Date(t.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] truncate">
                      {t.from} <span className="text-[var(--color-text-tertiary)]">&rarr;</span> {t.to}: {t.message}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
                  style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))" }}>
                  <Activity size={28} className="text-[var(--color-text-tertiary)]" />
                </div>
                <p className="text-xs text-[var(--color-text-tertiary)]">No activity yet</p>
                <p className="text-[0.625rem] text-[var(--color-text-tertiary)] mt-1">Start chatting to see agent triggers</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, total, trend, trendUp, color, detail, gradient }: {
  icon: any; label: string; value: string; total: string;
  trend: string; trendUp: boolean; color: string; detail: string; gradient: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-white/[0.06] p-5 group transition-all hover:border-white/10 cursor-default"
      style={{
        background: "linear-gradient(145deg, rgba(255,255,255,0.055), rgba(255,255,255,0.015))",
        backdropFilter: "blur(24px)",
      }}
    >
      {/* Ambient glow */}
      <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-10 group-hover:opacity-20 transition-opacity"
        style={{ background: color, filter: "blur(30px)" }} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${color}18`, border: `1px solid ${color}15` }}>
            <Icon size={20} style={{ color }} />
          </div>
          <div className="flex items-center gap-1" style={{ color: trendUp ? "var(--color-accent)" : "var(--color-error)" }}>
            {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            <span className="text-[0.625rem] font-semibold">{trend}</span>
          </div>
        </div>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-2xl font-extrabold">{value}</span>
          {total && <span className="text-sm text-[var(--color-text-tertiary)] font-medium">{total}</span>}
        </div>
        <div className="text-[0.625rem] text-[var(--color-text-tertiary)]">{label}</div>
      </div>
    </motion.div>
  );
}

function TierRow({ tier, label, color, count, models: tierModels }: {
  tier: string; label: string; color: string; count: number; models: any[];
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 10px ${color}40` }} />
      <span className="text-[0.6875rem] font-bold w-5" style={{ color }}>{tier}</span>
      <span className="text-[0.5625rem] text-[var(--color-text-tertiary)] w-12">{label}</span>
      <div className="flex-1 flex gap-1 flex-wrap">
        {tierModels.slice(0, 4).map((m: any) => (
          <span key={m.id} className="text-[0.5rem] px-1.5 py-0.5 rounded bg-white/[0.04] text-[var(--color-text-tertiary)] border border-white/[0.04]">
            {m.name.split(" ").slice(0, 2).join(" ")}
          </span>
        ))}
        {tierModels.length > 4 && (
          <span className="text-[0.5rem] text-[var(--color-text-tertiary)]">+{tierModels.length - 4}</span>
        )}
      </div>
      <span className="text-[0.5625rem] font-mono font-bold" style={{ color }}>{count}</span>
    </div>
  );
}
