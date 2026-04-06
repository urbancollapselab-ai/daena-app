import { useAppStore } from "@/stores/appStore";
import { Wifi, WifiOff, Zap, Clock, Shield } from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { getHealth } from "@/lib/api";

export function TopBar() {
  const { systemStatus, setSystemStatus, currentPage } = useAppStore();
  const [backendOnline, setBackendOnline] = useState(false);
  const [time, setTime] = useState(new Date());
  const failCountRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const check = useCallback(async () => {
    const health = await getHealth();
    if (health) {
      failCountRef.current = 0;
      setBackendOnline(true);
      setSystemStatus({
        agentsActive: health.agents.filter((a: any) => a.status !== "idle").length,
        agentsTotal: health.agents.length,
        modelsAvailable: health.pool.available_workers,
        modelsTotal: health.pool.total_workers,
        tokensToday: health.pool.stats.total_calls * 150,
        costToday: 0,
        uptimeHours: health.uptime_hours,
        freePercent: (health.pool.free_models / health.pool.total_workers) * 100,
      });
    } else {
      failCountRef.current++;
      setBackendOnline(false);
    }
  }, [setSystemStatus]);

  useEffect(() => {
    check();
    // Exponential backoff: 15s -> 30s -> 60s on consecutive failures
    const getInterval = () => Math.min(15000 * Math.pow(2, failCountRef.current), 60000);
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(async () => {
        await check();
        schedule();
      }, getInterval());
    };
    schedule();
    return () => clearTimeout(timer);
  }, [check]);

  const pageTitles: Record<string, { title: string; subtitle: string }> = {
    chat: { title: "Chat", subtitle: "Talk to your AI agents" },
    dashboard: { title: "Dashboard", subtitle: "System overview" },
    agents: { title: "Agent Control", subtitle: "Monitor & manage departments" },
    settings: { title: "Settings", subtitle: "Configure your system" },
  };
  const page = pageTitles[currentPage] || { title: "Daena", subtitle: "" };

  return (
    <header className="h-13 flex items-center justify-between px-5 border-b border-[var(--color-border)] bg-[var(--color-bg-card)]/40 backdrop-blur-xl z-20 relative">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-sm font-bold text-[var(--color-text-primary)] leading-tight">{page.title}</h1>
          <p className="text-[0.5625rem] text-[var(--color-text-tertiary)] leading-tight">{page.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <StatusPill
          icon={backendOnline ? Wifi : WifiOff}
          label={backendOnline ? "Online" : "Offline"}
          variant={backendOnline ? "green" : "red"}
          pulse={backendOnline}
        />
        {systemStatus && (
          <>
            <StatusPill
              icon={Shield}
              label={`${systemStatus.agentsActive} Agents`}
              variant="blue"
            />
            <StatusPill
              icon={Zap}
              label={`${systemStatus.modelsAvailable} Models`}
              variant="accent"
            />
          </>
        )}
        <div className="w-px h-5 bg-[var(--color-border)] mx-1" />
        <div className="flex items-center gap-1.5 text-[0.6875rem] text-[var(--color-text-tertiary)] font-mono">
          <Clock size={11} />
          {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </div>
      </div>
    </header>
  );
}

function StatusPill({ icon: Icon, label, variant, pulse }: {
  icon: any; label: string;
  variant: "green" | "blue" | "red" | "accent";
  pulse?: boolean;
}) {
  const styles = {
    green: "text-[var(--color-accent)] bg-[var(--color-accent-dim)] border-[var(--color-accent-dim)]",
    blue: "text-[var(--color-primary)] bg-[var(--color-primary-dim)] border-[var(--color-primary-dim)]",
    red: "text-[var(--color-error)] bg-[var(--color-error-dim)] border-[var(--color-error-dim)]",
    accent: "text-[var(--color-gold)] bg-[var(--color-gold-dim)] border-[var(--color-gold-dim)]",
  };
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.625rem] font-semibold border ${styles[variant]}`}>
      {pulse && <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
      <Icon size={11} />
      <span>{label}</span>
    </div>
  );
}
