import { useAppStore } from "@/stores/appStore";
import { Wifi, WifiOff, Zap, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { getHealth } from "@/lib/api";

export function TopBar() {
  const { systemStatus, setSystemStatus, settings, currentPage } = useAppStore();
  const [backendOnline, setBackendOnline] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const check = async () => {
      const health = await getHealth();
      if (health) {
        setBackendOnline(true);
        setSystemStatus({
          agentsActive: health.agents.filter((a) => a.status !== "idle").length,
          agentsTotal: health.agents.length,
          modelsAvailable: health.pool.available_workers,
          modelsTotal: health.pool.total_workers,
          tokensToday: health.pool.stats.total_calls * 150,
          costToday: 0,
          uptimeHours: health.uptime_hours,
          freePercent: (health.pool.free_models / health.pool.total_workers) * 100,
        });
      } else {
        setBackendOnline(false);
      }
    };
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, []);

  const pageTitle = {
    chat: "Chat",
    dashboard: "Dashboard",
    agents: "Agent Management",
    settings: "Settings",
  }[currentPage];

  return (
    <header className="h-12 flex items-center justify-between px-5 border-b border-[var(--color-border)] bg-[var(--color-bg-card)]/50 backdrop-blur-sm z-20 relative">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-[var(--color-text-primary)]">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Status pills  */}
        <div className="flex items-center gap-2">
          <StatusPill
            icon={backendOnline ? Wifi : WifiOff}
            label={backendOnline ? "Online" : "Offline"}
            variant={backendOnline ? "green" : "red"}
          />
          {systemStatus && (
            <>
              <StatusPill
                icon={Zap}
                label={`${systemStatus.modelsAvailable}/${systemStatus.modelsTotal} Models`}
                variant="blue"
              />
              <StatusPill
                icon={Clock}
                label={time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                variant="dim"
              />
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function StatusPill({ icon: Icon, label, variant }: {
  icon: any; label: string;
  variant: "green" | "blue" | "red" | "dim";
}) {
  const colors = {
    green: "text-[var(--color-accent)] bg-[var(--color-accent-dim)]",
    blue: "text-[var(--color-primary)] bg-[var(--color-primary-dim)]",
    red: "text-[var(--color-error)] bg-[var(--color-error-dim)]",
    dim: "text-[var(--color-text-tertiary)] bg-[var(--color-surface)]",
  };
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.6875rem] font-medium ${colors[variant]}`}>
      <Icon size={12} />
      <span>{label}</span>
    </div>
  );
}
