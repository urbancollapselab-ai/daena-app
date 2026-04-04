import { useAppStore } from "@/stores/appStore";
import { motion } from "framer-motion";
import { Activity, Cpu, Zap, DollarSign, Clock, TrendingUp, ArrowUpRight, Shield } from "lucide-react";

export function DashboardPage() {
  const { agents, models, systemStatus, triggerHistory } = useAppStore();

  const activeAgents = agents.filter((a) => a.status !== "idle" && a.status !== "error");
  const freeModels = models.filter((m) => m.tier !== "T3");
  const paidModels = models.filter((m) => m.tier === "T3");

  const tierCounts = {
    T0: models.filter((m) => m.tier === "T0").length,
    T1: models.filter((m) => m.tier === "T1").length,
    T2: models.filter((m) => m.tier === "T2").length,
    T3: models.filter((m) => m.tier === "T3").length,
  };

  return (
    <div className="h-full overflow-y-auto px-6 py-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            icon={Cpu}
            label="Agents Active"
            value={`${activeAgents.length}/${agents.length}`}
            variant="blue"
            detail="All systems operational"
          />
          <KPICard
            icon={Zap}
            label="Models Ready"
            value={`${systemStatus.modelsAvailable}/${systemStatus.modelsTotal}`}
            variant="green"
            detail={`${freeModels.length} free · ${paidModels.length} paid`}
          />
          <KPICard
            icon={Activity}
            label="Tokens Today"
            value={systemStatus.tokensToday.toLocaleString()}
            variant="gold"
            detail="Across all conversations"
          />
          <KPICard
            icon={DollarSign}
            label="Cost Today"
            value={`€${systemStatus.costToday.toFixed(2)}`}
            variant="accent"
            detail={`${systemStatus.freePercent.toFixed(0)}% free tier`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Agent Status */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Shield size={16} className="text-[var(--color-primary)]" />
                Agent Status
              </h3>
              <span className="badge badge-green">{activeAgents.length} active</span>
            </div>
            <div className="space-y-2">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  <span className="text-lg w-8 text-center">{agent.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{agent.name}</span>
                      <div className={`status-dot status-${agent.status}`} />
                    </div>
                    <span className="text-[0.625rem] text-[var(--color-text-tertiary)] capitalize">{agent.status}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium">{agent.tasksToday} tasks</div>
                    {agent.errors > 0 && (
                      <div className="text-[0.625rem] text-[var(--color-error)]">{agent.errors} errors</div>
                    )}
                  </div>
                  <span className="text-[0.5625rem] text-[var(--color-text-tertiary)] font-mono w-14 text-right">{agent.modelTier}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Model Cascade */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp size={16} className="text-[var(--color-accent)]" />
                Model Cascade
              </h3>
              <span className="badge badge-green">{freeModels.length} free</span>
            </div>

            {/* Tier breakdown */}
            <div className="space-y-4">
              <TierSection
                tier="T0"
                label="Primary Brain"
                color="var(--color-accent)"
                models={models.filter((m) => m.tier === "T0")}
              />
              <TierSection
                tier="T1"
                label="Strong Free"
                color="var(--color-primary)"
                models={models.filter((m) => m.tier === "T1")}
              />
              <TierSection
                tier="T2"
                label="Light Free"
                color="var(--color-gold)"
                models={models.filter((m) => m.tier === "T2")}
              />
              <TierSection
                tier="T3"
                label="Paid Fallback"
                color="var(--color-warning)"
                models={models.filter((m) => m.tier === "T3")}
              />
            </div>

            {/* Cascade visualization */}
            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
              <div className="flex items-center gap-1">
                {models.map((m, i) => (
                  <div
                    key={m.id}
                    className="h-2 rounded-full flex-1 transition-all"
                    style={{
                      background: m.tier === "T0" ? "var(--color-accent)"
                        : m.tier === "T1" ? "var(--color-primary)"
                        : m.tier === "T2" ? "var(--color-gold)"
                        : "var(--color-warning)",
                      opacity: m.status === "available" ? 1 : 0.3,
                    }}
                    title={m.name}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[0.5625rem] text-[var(--color-text-tertiary)]">FREE →</span>
                <span className="text-[0.5625rem] text-[var(--color-text-tertiary)]">→ PAID</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Triggers */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Clock size={16} className="text-[var(--color-gold)]" />
              Recent Activity
            </h3>
          </div>
          {triggerHistory.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {triggerHistory.slice(0, 10).map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--color-surface-hover)]">
                  <div className={`badge ${t.type === "chain" ? "badge-blue" : "badge-gold"}`}>
                    {t.type === "chain" ? "⚡" : "⏰"} {t.type}
                  </div>
                  <span className="text-xs text-[var(--color-text-secondary)] flex-1 truncate">
                    {t.from} → {t.to}: {t.message}
                  </span>
                  <span className="text-[0.625rem] text-[var(--color-text-tertiary)]">
                    {new Date(t.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[var(--color-text-tertiary)] text-xs">
              No activity yet. Start chatting to see agent triggers here.
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, variant, detail }: {
  icon: any; label: string; value: string; variant: "blue" | "green" | "gold" | "accent"; detail: string;
}) {
  const colors = {
    blue: { bg: "var(--color-primary-dim)", icon: "var(--color-primary)" },
    green: { bg: "var(--color-accent-dim)", icon: "var(--color-accent)" },
    gold: { bg: "var(--color-gold-dim)", icon: "var(--color-gold)" },
    accent: { bg: "var(--color-accent-dim)", icon: "var(--color-accent)" },
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-4 hover:border-[var(--color-border-hover)] transition-all"
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: colors[variant].bg }}
        >
          <Icon size={18} style={{ color: colors[variant].icon }} />
        </div>
        <span className="text-xs text-[var(--color-text-secondary)]">{label}</span>
      </div>
      <div className="text-2xl font-bold mb-0.5">{value}</div>
      <div className="text-[0.625rem] text-[var(--color-text-tertiary)]">{detail}</div>
    </motion.div>
  );
}

function TierSection({ tier, label, color, models: tierModels }: {
  tier: string; label: string; color: string; models: any[];
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
        <span className="text-xs font-semibold" style={{ color }}>{tier}</span>
        <span className="text-[0.625rem] text-[var(--color-text-tertiary)]">{label}</span>
        <span className="text-[0.625rem] text-[var(--color-text-tertiary)] ml-auto">{tierModels.length} models</span>
      </div>
      <div className="flex flex-wrap gap-1.5 ml-4">
        {tierModels.map((m) => (
          <span key={m.id} className="model-tag text-[0.5625rem]">
            {m.name} <span className="opacity-50">{m.price}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
