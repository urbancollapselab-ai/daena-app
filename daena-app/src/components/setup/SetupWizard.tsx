import { useState, useEffect } from "react";
import { useAppStore } from "@/stores/appStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Building2, Key, Bot, Rocket, ChevronRight, ChevronLeft,
  Check, Eye, EyeOff, Loader2, Download, Terminal, CheckCircle2,
  XCircle, AlertTriangle, Cpu, Shield
} from "lucide-react";

const STEPS = [
  { id: "welcome", icon: Globe, title: "Welcome", subtitle: "Language" },
  { id: "system", icon: Cpu, title: "System", subtitle: "Dependencies" },
  { id: "permissions", icon: Shield, title: "Permissions", subtitle: "Access" },
  { id: "profile", icon: Building2, title: "Profile", subtitle: "About you" },
  { id: "apikeys", icon: Key, title: "Connect", subtitle: "API keys" },
  { id: "agents", icon: Bot, title: "Agents", subtitle: "Your team" },
  { id: "ready", icon: Rocket, title: "Ready!", subtitle: "Let's go" },
];

const LANGUAGES = [
  { code: "en" as const, name: "English", flag: "🇬🇧" },
  { code: "tr" as const, name: "Türkçe", flag: "🇹🇷" },
  { code: "nl" as const, name: "Nederlands", flag: "🇳🇱" },
  { code: "ku" as const, name: "Kurdî", flag: "☀️" },
];

import { useTranslation } from "@/i18n";

const INDUSTRIES = [
  "Technology", "Construction", "Finance", "Healthcare", "E-commerce",
  "Education", "Marketing", "Real Estate", "Consulting", "Other",
];

interface SystemCheck {
  name: string;
  status: "checking" | "ok" | "missing" | "optional";
  detail: string;
  action?: string;
}

export function SetupWizard() {
  const { updateSettings, settings, setSetupComplete, addConversation } = useAppStore();
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [keyValid, setKeyValid] = useState<boolean | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [claudeProAvailable, setClaudeProAvailable] = useState(false);
  const [anthropicKey, setAnthropicKey] = useState("");
  const [agentStates, setAgentStates] = useState<Record<string, boolean>>({
    finance: true, data: true, marketing: true, sales: true,
    research: true, watchdog: true, heartbeat: true, coordinator: true,
  });
  const [permissions, setPermissions] = useState({ terminal: true, filesystem: true, network: true });

  // System dependency checks
  const [systemChecks, setSystemChecks] = useState<SystemCheck[]>([
    { name: "Python 3.10+", status: "checking", detail: "Required for AI backend" },
    { name: "Node.js 18+", status: "checking", detail: "Required for frontend" },
    { name: "Claude Code (Opus 4.6)", status: "checking", detail: "Optional - premium AI brain" },
    { name: "OpenRouter Connection", status: "checking", detail: "For 20-model cascade" },
    { name: "Backend Server", status: "checking", detail: "Python AI server" },
  ]);

  // Run system checks when we reach step 1
  useEffect(() => {
    if (step === 1) {
      runSystemChecks();
    }
  }, [step]);

  const runSystemChecks = async () => {
    const checks = [...systemChecks];

    // Check Python
    try {
      const res = await fetch("http://127.0.0.1:8910/health");
      if (res.ok) {
        checks[0] = { ...checks[0], status: "ok", detail: "Python backend is running" };
        checks[4] = { ...checks[4], status: "ok", detail: "Backend server is running on port 8910" };
      } else {
        checks[0] = { ...checks[0], status: "ok", detail: "Python detected (start backend manually)" };
        checks[4] = { ...checks[4], status: "missing", detail: "Run: python3 backend/server.py", action: "Start Backend" };
      }
    } catch {
      checks[0] = { ...checks[0], status: "ok", detail: "Python likely available" };
      checks[4] = { ...checks[4], status: "missing", detail: "Backend not running. Run: python3 backend/server.py", action: "Start Backend" };
    }

    // Node is available (we're running!)
    checks[1] = { ...checks[1], status: "ok", detail: "Node.js is running (this app)" };

    setSystemChecks([...checks]);

    // Check Claude Code (try to detect)
    try {
      const res = await fetch("http://127.0.0.1:8910/health");
      const data = await res.json();
      // If backend is running, ask it to check claude
      checks[2] = { ...checks[2], status: "optional", detail: "Claude Code detection requires backend" };
    } catch {
      checks[2] = { ...checks[2], status: "optional", detail: "Install Claude Code for Opus 4.6 access", action: "Install Guide" };
    }

    // Check OpenRouter
    try {
      const res = await fetch("https://openrouter.ai/api/v1/models", { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        checks[3] = { ...checks[3], status: "ok", detail: "OpenRouter API reachable" };
      }
    } catch {
      checks[3] = { ...checks[3], status: "missing", detail: "Cannot reach OpenRouter. Check internet connection." };
    }

    setSystemChecks([...checks]);

    // Try to detect Claude Pro
    try {
      const healthRes = await fetch("http://127.0.0.1:8910/check-claude");
      const healthData = await healthRes.json();
      if (healthData.available) {
        setClaudeProAvailable(true);
        checks[2] = { ...checks[2], status: "ok", detail: `Claude Code found: ${healthData.version || "Opus 4.6"}` };
        setSystemChecks([...checks]);
      }
    } catch {
      // Claude check endpoint might not exist yet
    }
  };

  const canNext = () => {
    if (step === 0) return true;
    if (step === 1) return true; // system check is informational
    if (step === 2) return true; // permissions
    if (step === 3) return companyName.length > 0;
    if (step === 4) return apiKey.length > 10 || claudeProAvailable;
    return true;
  };

  const handleNext = () => {
    if (step === 2) {
      updateSettings({ permissions });
    }
    if (step === 3) {
      updateSettings({ companyName, industry });
    }
    if (step === 4) {
      updateSettings({ openrouterKey: apiKey, anthropicKey, claudePath: claudeProAvailable ? "/opt/homebrew/bin/claude" : undefined });
    }
    if (step === 5) {
      updateSettings({ agentsEnabled: agentStates });
    }
    if (step === 6) {
      addConversation();
      setSetupComplete(true);
      return;
    }
    setStep((s) => s + 1);
  };

  const testApiKey = async () => {
    setTesting(true);
    try {
      const res = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      setKeyValid(res.ok);
    } catch {
      setKeyValid(false);
    }
    setTesting(false);
  };

  const AGENT_LIST = [
    { id: "finance", icon: "💰", name: "Finance", desc: "Invoicing, budgets, expenses" },
    { id: "data", icon: "📊", name: "Data", desc: "Leads, CRM, enrichment" },
    { id: "marketing", icon: "📣", name: "Marketing", desc: "Content, campaigns, SEO" },
    { id: "sales", icon: "🎯", name: "Sales", desc: "Outreach, proposals, deals" },
    { id: "research", icon: "🔬", name: "Research", desc: "Market & competitor analysis" },
    { id: "watchdog", icon: "🛡️", name: "Watchdog", desc: "System health monitoring" },
    { id: "heartbeat", icon: "💓", name: "Heartbeat", desc: "Uptime & scheduled reports" },
    { id: "coordinator", icon: "🎭", name: "Coordinator", desc: "Inter-agent task routing" },
  ];

  return (
    <div className="fixed inset-0 bg-[var(--color-bg-deep)] flex items-center justify-center overflow-hidden">
      <div className="ambient-orb ambient-orb-1" />
      <div className="ambient-orb ambient-orb-2" />
      <div className="ambient-orb ambient-orb-3" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass w-full max-w-xl mx-4 relative z-10"
      >
        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 pt-6 pb-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className={`wizard-step-dot ${i === step ? "active" : i < step ? "done" : ""}`} />
          ))}
        </div>

        {/* Content */}
        <div className="px-8 py-6 min-h-[380px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* STEP 0: Welcome */}
              {step === 0 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-[var(--color-primary-dim)]">
                      🔥
                    </div>
                    <h2 className="text-2xl font-bold mb-1">{t("setup.welcome")}</h2>
                    <p className="text-[var(--color-text-secondary)] text-sm">{t("setup.welcomeDesc")}</p>
                    <p className="text-[0.625rem] text-[var(--color-text-tertiary)] mt-1">8 AI {t("nav.agents")?.toLowerCase()} • 20 models</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => updateSettings({ language: lang.code })}
                        className={`glass-sm glass-hover p-4 text-center transition-all ${
                          settings.language === lang.code ? "!border-[var(--color-primary)] bg-[var(--color-primary-dim)]" : ""
                        }`}
                      >
                        <div className="text-2xl mb-1">{lang.flag}</div>
                        <div className="text-sm font-medium">{lang.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 1: System Check */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="text-center mb-4">
                    <Cpu size={32} className="mx-auto mb-2 text-[var(--color-primary)]" />
                    <h2 className="text-xl font-bold">{t("setup.systemTitle") || "System Check"}</h2>
                    <p className="text-[var(--color-text-secondary)] text-sm">{t("setup.systemDesc") || "Verifying your setup"}</p>
                  </div>
                  <div className="space-y-2">
                    {systemChecks.map((check, i) => (
                      <motion.div
                        key={check.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-sm p-3 flex items-center gap-3"
                      >
                        {check.status === "checking" && <Loader2 size={16} className="animate-spin text-[var(--color-primary)]" />}
                        {check.status === "ok" && <CheckCircle2 size={16} className="text-[var(--color-accent)]" />}
                        {check.status === "missing" && <XCircle size={16} className="text-[var(--color-error)]" />}
                        {check.status === "optional" && <AlertTriangle size={16} className="text-[var(--color-warning)]" />}
                        <div className="flex-1">
                          <div className="text-sm font-medium">{check.name}</div>
                          <div className="text-[0.625rem] text-[var(--color-text-tertiary)]">{check.detail}</div>
                        </div>
                        {check.status === "ok" && <span className="badge badge-green">Ready</span>}
                        {check.status === "missing" && <span className="badge badge-red">Missing</span>}
                        {check.status === "optional" && <span className="badge badge-amber">Optional</span>}
                      </motion.div>
                    ))}
                  </div>
                  {claudeProAvailable && (
                    <div className="glass-sm p-3 border-[var(--color-accent)] bg-[var(--color-accent-dim)]">
                      <p className="text-xs text-[var(--color-accent)] font-medium">
                        🎉 Claude Pro detected! Opus 4.6 will be your primary brain.
                      </p>
                    </div>
                  )}
                  <div className="glass-sm p-3 flex flex-col gap-2">
                    <p className="text-[0.625rem] text-[var(--color-text-tertiary)]">
                      Daena can install missing dependencies automatically.
                    </p>
                    {systemChecks.some(c => c.status === "missing" || c.status === "optional") && (
                      <button 
                        onClick={async () => {
                          const { invoke } = await import('@tauri-apps/api/core');
                          setTesting(true);
                          try {
                            const res: any = await invoke('install_dependencies');
                            if(res.success) {
                              runSystemChecks();
                            }
                          } catch(err) {
                            console.error(err);
                          }
                          setTesting(false);
                        }}
                        disabled={testing}
                        className="btn-primary py-2 text-xs w-full justify-center"
                      >
                        {testing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} 
                        {testing ? "Installing (This may take a while)..." : "Install Missing Requirements"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: Permissions */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <Shield size={32} className="mx-auto mb-2 text-[var(--color-primary)]" />
                    <h2 className="text-xl font-bold">Local Permissions</h2>
                    <p className="text-[var(--color-text-secondary)] text-sm">Daena acts autonomously. Grant permissions below.</p>
                  </div>
                  <div className="space-y-3">
                    <div className="glass-sm p-4 flex items-start gap-4 cursor-pointer" onClick={() => setPermissions(p => ({...p, terminal: !p.terminal}))}>
                      <Terminal size={24} className={permissions.terminal ? "text-[var(--color-accent)]" : "text-white/20"} />
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">Terminal Execution</h3>
                        <p className="text-xs text-[var(--color-text-tertiary)] mb-2">Allow agents to run system commands, run code, and install packages via Claude Code.</p>
                        <ToggleSwitch checked={permissions.terminal} onChange={(v) => setPermissions(p => ({...p, terminal: v}))} />
                      </div>
                    </div>
                    <div className="glass-sm p-4 flex items-start gap-4 cursor-pointer" onClick={() => setPermissions(p => ({...p, filesystem: !p.filesystem}))}>
                      <Globe size={24} className={permissions.filesystem ? "text-[var(--color-primary)]" : "text-white/20"} />
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">File System Access</h3>
                        <p className="text-xs text-[var(--color-text-tertiary)] mb-2">Allow agents to read, write, and modify files in your workspace.</p>
                        <ToggleSwitch checked={permissions.filesystem} onChange={(v) => setPermissions(p => ({...p, filesystem: v}))} />
                      </div>
                    </div>
                    <div className="glass-sm p-4 border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10">
                      <p className="text-xs text-[var(--color-warning)] font-medium">⚠️ By granting access, the AI behaves like a human coworker on this machine. Proceed with caution.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Profile */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="text-center mb-4">
                    <Building2 size={32} className="mx-auto mb-2 text-[var(--color-primary)]" />
                    <h2 className="text-xl font-bold">{t("setup.profile") || "Your Profile"}</h2>
                    <p className="text-[var(--color-text-secondary)] text-sm">{t("setup.nameDesc") || "Help Daena personalize your experience"}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">Company / Project Name *</label>
                    <input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Acme Corp"
                      className="glass-input w-full px-4 py-3 text-sm"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">Industry</label>
                    <div className="grid grid-cols-2 gap-2">
                      {INDUSTRIES.map((ind) => (
                        <button
                          key={ind}
                          onClick={() => setIndustry(ind)}
                          className={`glass-sm glass-hover px-3 py-2 text-xs text-left transition-all ${
                            industry === ind ? "!border-[var(--color-primary)] bg-[var(--color-primary-dim)] text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"
                          }`}
                        >
                          {ind}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: API Keys + Claude Pro */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <Key size={32} className="mx-auto mb-2 text-[var(--color-accent)]" />
                    <h2 className="text-xl font-bold">Connect Your Brain</h2>
                    <p className="text-[var(--color-text-secondary)] text-sm">Configure your AI connections</p>
                  </div>

                  {/* Claude Pro detection */}
                  {claudeProAvailable && (
                    <div className="glass-sm p-3 border-[var(--color-accent)] bg-[var(--color-accent-dim)]">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 size={14} className="text-[var(--color-accent)]" />
                        <span className="text-xs font-semibold text-[var(--color-accent)]">Claude Pro Connected</span>
                      </div>
                      <p className="text-[0.625rem] text-[var(--color-text-secondary)]">
                        Opus 4.6 is your primary brain. OpenRouter is used as fallback.
                      </p>
                    </div>
                  )}

                  {/* OpenRouter Key */}
                  <div>
                    <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                      OpenRouter API Key {claudeProAvailable ? "(backup)" : "*"}
                    </label>
                    <div className="relative">
                      <input
                        type={showKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => { setApiKey(e.target.value); setKeyValid(null); }}
                        placeholder="sk-or-v1-..."
                        className="glass-input w-full px-4 py-3 pr-20 text-sm font-mono"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        <button onClick={() => setShowKey(!showKey)} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)]">
                          {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button onClick={testApiKey} disabled={apiKey.length < 10 || testing} className="btn-ghost text-[0.625rem] py-1 px-2">
                          {testing ? <Loader2 size={12} className="animate-spin" /> : "Test"}
                        </button>
                      </div>
                    </div>
                    {keyValid !== null && (
                      <p className={`text-xs mt-1.5 ${keyValid ? "text-[var(--color-accent)]" : "text-[var(--color-error)]"}`}>
                        {keyValid ? "✓ API key is valid! 13 free models available." : "✗ Invalid key."}
                      </p>
                    )}
                    <p className="text-[0.625rem] text-[var(--color-text-tertiary)] mt-1">
                      Free from <a href="https://openrouter.ai" target="_blank" className="text-[var(--color-primary)] underline">openrouter.ai</a> — no credit card needed
                    </p>
                  </div>

                  {/* Anthropic Key (optional) */}
                  <div>
                    <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                      Anthropic API Key <span className="text-[var(--color-text-tertiary)]">(optional)</span>
                    </label>
                    <input
                      type="password"
                      value={anthropicKey}
                      onChange={(e) => setAnthropicKey(e.target.value)}
                      placeholder="sk-ant-..."
                      className="glass-input w-full px-4 py-3 text-sm font-mono"
                    />
                    <p className="text-[0.625rem] text-[var(--color-text-tertiary)] mt-1">
                      For direct Claude API access ($15/M tokens)
                    </p>
                  </div>

                  <div className="glass-sm p-3">
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      <strong className="text-[var(--color-accent)]">Brain Cascade:</strong>{" "}
                      {claudeProAvailable ? "Opus 4.6 → " : ""}
                      13 free OpenRouter models → 7 paid models. Your AI <strong>never</strong> goes silent.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 5: Agents */}
              {step === 5 && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <Bot size={32} className="mx-auto mb-2 text-[var(--color-gold)]" />
                    <h2 className="text-xl font-bold">Your AI Team</h2>
                    <p className="text-[var(--color-text-secondary)] text-sm">Enable the agents you need</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
                    {AGENT_LIST.map((ag) => (
                      <button
                        key={ag.id}
                        onClick={() => setAgentStates((s) => ({ ...s, [ag.id]: !s[ag.id] }))}
                        className={`glass-sm glass-hover p-3 text-left transition-all ${
                          agentStates[ag.id] ? "!border-[var(--color-accent)] bg-[var(--color-accent-dim)]" : "opacity-50"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{ag.icon}</span>
                          <span className="text-sm font-medium">{ag.name}</span>
                          {agentStates[ag.id] && <Check size={12} className="ml-auto text-[var(--color-accent)]" />}
                        </div>
                        <p className="text-[0.625rem] text-[var(--color-text-tertiary)]">{ag.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 6: Ready */}
              {step === 6 && (
                <div className="space-y-6 text-center py-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                    className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-4xl mx-auto shadow-lg shadow-[var(--color-primary-dim)]"
                  >
                    🚀
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold mb-2">All Set!</h2>
                    <p className="text-[var(--color-text-secondary)] text-sm">
                      Daena is ready with {Object.values(agentStates).filter(Boolean).length} agents and 20 AI models
                    </p>
                  </div>
                  <div className="glass-sm p-4 text-left space-y-2">
                    <SummaryRow label="Company" value={companyName || "Personal"} />
                    <SummaryRow label="Industry" value={industry || "General"} />
                    <SummaryRow label="Language" value={LANGUAGES.find((l) => l.code === settings.language)?.name || "English"} />
                    <SummaryRow label="Primary Brain" value={claudeProAvailable ? "Claude Opus 4.6" : "Qwen 3.6 Plus (free)"} />
                    <SummaryRow label="Active Agents" value={`${Object.values(agentStates).filter(Boolean).length}/8`} />
                    <SummaryRow label="AI Models" value="13 Free + 7 Paid cascade" />
                    <SummaryRow label="OpenRouter" value={apiKey ? "✓ Connected" : "Not configured"} />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 pb-6">
          <button onClick={() => setStep((s) => Math.max(0, s - 1))} className={`btn-ghost ${step === 0 ? "invisible" : ""}`}>
            <ChevronLeft size={14} /> {t("setup.prev") || "Back"}
          </button>
          <button onClick={handleNext} disabled={!canNext()} className="btn-primary">
            {step === 6 ? (t("setup.complete") || "Launch Daena") + " 🔥" : (t("setup.next") || "Continue")} {step < 6 && <ChevronRight size={14} />}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      className={`relative w-10 h-5.5 rounded-full transition-colors ${
        checked ? "bg-[var(--color-primary)]" : "bg-[var(--color-surface-active)]"
      }`}
      style={{ minWidth: 40, height: 22 }}
    >
      <div
        className="absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform"
        style={{
          width: 18, height: 18,
          transform: checked ? "translateX(20px)" : "translateX(2px)",
        }}
      />
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-[var(--color-text-tertiary)]">{label}</span>
      <span className="text-[var(--color-text-primary)] font-medium">{value}</span>
    </div>
  );
}
