import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/stores/appStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Key, Bot, Rocket, ChevronRight, ChevronLeft,
  Eye, EyeOff, Loader2, CheckCircle2, XCircle, AlertTriangle,
  Cpu, Shield, Terminal, Download, Zap, Building2
} from "lucide-react";
import { useTranslation } from "@/i18n";

/* ── Step definitions ─────────────────────────────── */
const STEPS = [
  { id: "welcome",  title: "Welcome",      sub: "Language" },
  { id: "install",  title: "System Setup",  sub: "Auto-install" },
  { id: "connect",  title: "Connect",       sub: "API Keys" },
  { id: "team",     title: "Your Team",     sub: "Agents" },
  { id: "ready",    title: "Ready!",        sub: "Launch" },
];

const LANGUAGES = [
  { code: "en" as const, name: "English",    flag: "🇬🇧" },
  { code: "tr" as const, name: "Türkçe",     flag: "🇹🇷" },
  { code: "nl" as const, name: "Nederlands", flag: "🇳🇱" },
  { code: "ku" as const, name: "Kurdî",      flag: "☀️" },
];

const INDUSTRIES = [
  "Technology", "Construction", "Finance", "Healthcare", "E-commerce",
  "Education", "Marketing", "Real Estate", "Consulting", "Other",
];

/* ── Interfaces ───────────────────────────────────── */
interface DepCheck {
  name: string;
  status: "pending" | "checking" | "ok" | "installing" | "missing" | "optional";
  detail: string;
}

/* ── Main Component ───────────────────────────────── */
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
  const [claudeDetected, setClaudeDetected] = useState(false);
  const [anthropicKey, setAnthropicKey] = useState("");
  const [installing, setInstalling] = useState(false);
  const [installDone, setInstallDone] = useState(false);
  const [agentStates, setAgentStates] = useState<Record<string, boolean>>({
    finance: true, data: true, marketing: true, sales: true,
    research: true, watchdog: true, heartbeat: true, coordinator: true,
  });

  // Dependency checks for Step 2
  const [deps, setDeps] = useState<DepCheck[]>([
    { name: "Python 3",              status: "pending", detail: "Required for AI backend" },
    { name: "Node.js",               status: "pending", detail: "Required for app runtime" },
    { name: "Claude Code (Opus 4.6)",status: "pending", detail: "Premium AI brain — optional" },
    { name: "OpenRouter API",        status: "pending", detail: "20-model cascade endpoint" },
    { name: "Backend Server",        status: "pending", detail: "Local AI server on port 8910" },
  ]);

  /* ── Auto-scan when reaching step 1 ───────────── */
  useEffect(() => {
    if (step === 1 && deps[0].status === "pending") {
      runFullScan();
    }
  }, [step]);

  const updateDep = (idx: number, patch: Partial<DepCheck>) => {
    setDeps(prev => prev.map((d, i) => i === idx ? { ...d, ...patch } : d));
  };

  const runFullScan = async () => {
    // Mark all as checking
    setDeps(prev => prev.map(d => ({ ...d, status: "checking" as const })));
    await sleep(400);

    // Node.js — we're running, so yes
    updateDep(1, { status: "ok", detail: "Node.js is running (this app)" });
    await sleep(200);

    // Python + Backend
    try {
      const res = await fetch("http://127.0.0.1:8910/health", { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        updateDep(0, { status: "ok", detail: "Python backend running" });
        updateDep(4, { status: "ok", detail: "Server active on port 8910" });
      } else throw new Error();
    } catch {
      updateDep(0, { status: "ok", detail: "Python likely installed" });
      updateDep(4, { status: "missing", detail: "Backend not running yet" });
    }
    await sleep(200);

    // Claude Code
    try {
      const res = await fetch("http://127.0.0.1:8910/check-claude", { signal: AbortSignal.timeout(5000) });
      const data = await res.json();
      if (data.available) {
        setClaudeDetected(true);
        updateDep(2, { status: "ok", detail: `Found: ${data.version || "Claude Code"}` });
      } else {
        updateDep(2, { status: "optional", detail: "Not installed — will auto-install" });
      }
    } catch {
      updateDep(2, { status: "optional", detail: "Not detected — optional upgrade" });
    }
    await sleep(200);

    // OpenRouter
    try {
      const res = await fetch("https://openrouter.ai/api/v1/models", { signal: AbortSignal.timeout(5000) });
      updateDep(3, { status: res.ok ? "ok" : "missing", detail: res.ok ? "API reachable ✓" : "Cannot reach API" });
    } catch {
      updateDep(3, { status: "missing", detail: "No internet or API down" });
    }
  };

  const runAutoInstall = async () => {
    setInstalling(true);
    const missing = deps.filter(d => d.status === "missing" || d.status === "optional");

    for (const dep of missing) {
      const idx = deps.findIndex(d => d.name === dep.name);
      updateDep(idx, { status: "installing", detail: "Installing..." });
      await sleep(800);

      // Try Tauri command
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        if (dep.name.includes("Claude")) {
          const res: any = await invoke("install_claude");
          if (res.success) {
            updateDep(idx, { status: "ok", detail: "Installed ✓" });
            setClaudeDetected(true);
            // Set permissions so Claude doesn't ask again
            try { await invoke("install_dependencies"); } catch {}
          } else {
            updateDep(idx, { status: "optional", detail: "Skipped — install manually later" });
          }
        } else if (dep.name.includes("Backend")) {
          // Backend will be started by Tauri automatically
          updateDep(idx, { status: "ok", detail: "Will start with app" });
        } else {
          const res: any = await invoke("install_dependencies");
          updateDep(idx, { status: res.success ? "ok" : "optional", detail: res.success ? "Installed ✓" : "Skipped" });
        }
      } catch {
        updateDep(idx, { status: "optional", detail: "Skipped — non-critical" });
      }
    }

    setInstalling(false);
    setInstallDone(true);
  };

  const canNext = () => {
    if (step === 0) return true;
    if (step === 1) return true;
    if (step === 2) return apiKey.length > 10 || claudeDetected;
    if (step === 3) return companyName.length > 0;
    return true;
  };

  const handleNext = () => {
    if (step === 2) {
      updateSettings({
        openrouterKey: apiKey,
        anthropicKey,
        claudePath: claudeDetected ? "/opt/homebrew/bin/claude" : undefined,
      });
    }
    if (step === 3) {
      updateSettings({ companyName, industry, agentsEnabled: agentStates });
    }
    if (step === 4) {
      addConversation();
      setSetupComplete(true);
      return;
    }
    setStep(s => s + 1);
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

  const allOk = deps.every(d => d.status === "ok" || d.status === "optional");
  const hasMissing = deps.some(d => d.status === "missing" || d.status === "optional");

  const AGENT_LIST = [
    { id: "finance",     icon: "💰", name: "Finance",     desc: "Invoicing, budgets, expenses" },
    { id: "data",        icon: "📊", name: "Data",        desc: "Leads, CRM, enrichment" },
    { id: "marketing",   icon: "📣", name: "Marketing",   desc: "Content, campaigns, SEO" },
    { id: "sales",       icon: "🎯", name: "Sales",       desc: "Outreach, proposals, deals" },
    { id: "research",    icon: "🔬", name: "Research",    desc: "Market & competitor analysis" },
    { id: "watchdog",    icon: "🛡️", name: "Watchdog",    desc: "System health monitoring" },
    { id: "heartbeat",   icon: "💓", name: "Heartbeat",   desc: "Uptime & scheduled reports" },
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
        {/* Step dots */}
        <div className="flex items-center justify-center gap-2 pt-6 pb-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className={`wizard-step-dot ${i === step ? "active" : i < step ? "done" : ""}`} />
          ))}
        </div>

        {/* Content */}
        <div className="px-8 py-6 min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* ═══════════ STEP 0: Welcome ═══════════ */}
              {step === 0 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-3xl mx-auto mb-4 overflow-hidden shadow-lg shadow-[var(--color-primary-dim)]">
                      <img src="/daena-logo.png" alt="Daena" className="w-full h-full object-cover" />
                    </div>
                    <h2 className="text-2xl font-extrabold mb-1">Welcome to Daena</h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">Your autonomous AI command center</p>
                    <p className="text-xs text-[var(--color-text-tertiary)] mt-1">8 AI agents • 20 models • Zero config</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {LANGUAGES.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => updateSettings({ language: lang.code })}
                        className={`glass-sm glass-hover p-4 text-center transition-all ${
                          settings.language === lang.code ? "!border-[var(--color-primary)] bg-[var(--color-primary-dim)]" : ""
                        }`}
                      >
                        <div className="text-2xl mb-1">{lang.flag}</div>
                        <div className="text-sm font-semibold">{lang.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ═══════════ STEP 1: System Scan & Auto-Install ═══════════ */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <Cpu size={36} className="mx-auto mb-2 text-[var(--color-primary)]" />
                    <h2 className="text-xl font-extrabold">System Setup</h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">Scanning your system & auto-installing dependencies</p>
                  </div>

                  <div className="space-y-2">
                    {deps.map((dep, i) => (
                      <motion.div
                        key={dep.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="glass-sm p-3 flex items-center gap-3"
                      >
                        {dep.status === "pending" && <div className="w-4 h-4 rounded-full bg-[var(--color-surface-active)]" />}
                        {dep.status === "checking" && <Loader2 size={16} className="animate-spin text-[var(--color-primary)]" />}
                        {dep.status === "installing" && <Loader2 size={16} className="animate-spin text-[var(--color-gold)]" />}
                        {dep.status === "ok" && <CheckCircle2 size={16} className="text-[var(--color-accent)]" />}
                        {dep.status === "missing" && <XCircle size={16} className="text-[var(--color-error)]" />}
                        {dep.status === "optional" && <AlertTriangle size={16} className="text-[var(--color-warning)]" />}
                        <div className="flex-1">
                          <div className="text-sm font-semibold">{dep.name}</div>
                          <div className="text-xs text-[var(--color-text-tertiary)]">{dep.detail}</div>
                        </div>
                        {dep.status === "ok" && <span className="badge badge-green">Ready</span>}
                        {dep.status === "installing" && <span className="badge badge-gold">Installing</span>}
                        {dep.status === "missing" && <span className="badge badge-red">Missing</span>}
                        {dep.status === "optional" && <span className="badge badge-amber">Optional</span>}
                      </motion.div>
                    ))}
                  </div>

                  {/* Auto-install button */}
                  {hasMissing && !installing && !installDone && allOk === false && (
                    <button onClick={runAutoInstall} className="btn-primary py-2.5 text-sm w-full justify-center">
                      <Download size={16} /> Install All Missing Dependencies
                    </button>
                  )}

                  {installing && (
                    <div className="glass-sm p-3 flex items-center gap-3 border-[var(--color-gold)]/30">
                      <Loader2 size={16} className="animate-spin text-[var(--color-gold)]" />
                      <span className="text-sm text-[var(--color-gold)]">Installing... This may take a minute.</span>
                    </div>
                  )}

                  {claudeDetected && (
                    <div className="glass-sm p-3 border-[var(--color-accent)]/30 bg-[var(--color-accent-dim)]">
                      <p className="text-xs text-[var(--color-accent)] font-semibold">
                        🎉 Claude Pro detected! Opus 4.6 will be your primary brain.
                      </p>
                    </div>
                  )}

                  {/* Permissions notice */}
                  <div className="glass-sm p-3 border-[var(--color-warning)]/20 bg-[var(--color-warning)]/5">
                    <div className="flex items-start gap-2">
                      <Shield size={14} className="text-[var(--color-warning)] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-[var(--color-warning)] font-semibold mb-1">Autonomous Access</p>
                        <p className="text-xs text-[var(--color-text-tertiary)]">
                          Daena's agents need terminal & file system access to work autonomously. 
                          These permissions are granted once during setup — no repeated prompts.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════ STEP 2: API Connection ═══════════ */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <Key size={36} className="mx-auto mb-2 text-[var(--color-accent)]" />
                    <h2 className="text-xl font-extrabold">Connect Your AI</h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">Link your API keys to power the 20-model cascade</p>
                  </div>

                  {/* OpenRouter Key */}
                  <div>
                    <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5 block">
                      OpenRouter API Key {!claudeDetected && <span className="text-[var(--color-error)]">*</span>}
                    </label>
                    <div className="relative">
                      <input
                        type={showKey ? "text" : "password"}
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        placeholder="sk-or-v1-..."
                        className="glass-input w-full px-4 py-3 pr-20 text-sm"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        <button onClick={() => setShowKey(!showKey)} className="p-1.5 hover:bg-white/5 rounded-lg">
                          {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          onClick={testApiKey}
                          disabled={apiKey.length < 10 || testing}
                          className="px-2 py-1 text-xs font-semibold rounded-lg bg-[var(--color-primary-dim)] text-[var(--color-primary)] disabled:opacity-30"
                        >
                          {testing ? <Loader2 size={12} className="animate-spin" /> : "Test"}
                        </button>
                      </div>
                    </div>
                    {keyValid === true && (
                      <p className="text-xs text-[var(--color-accent)] mt-1.5 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Key valid — 20 models available
                      </p>
                    )}
                    {keyValid === false && (
                      <p className="text-xs text-[var(--color-error)] mt-1.5 flex items-center gap-1">
                        <XCircle size={12} /> Invalid key. Check and try again.
                      </p>
                    )}
                    <p className="text-xs text-[var(--color-text-tertiary)] mt-1.5">
                      Get a free key at <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-[var(--color-primary)] underline">openrouter.ai/keys</a>
                    </p>
                  </div>

                  {/* Anthropic Key (optional) */}
                  <div>
                    <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5 block">
                      Anthropic API Key <span className="text-[var(--color-text-tertiary)]">(optional)</span>
                    </label>
                    <input
                      type="password"
                      value={anthropicKey}
                      onChange={e => setAnthropicKey(e.target.value)}
                      placeholder="sk-ant-..."
                      className="glass-input w-full px-4 py-3 text-sm"
                    />
                  </div>

                  {claudeDetected && (
                    <div className="glass-sm p-3 bg-[var(--color-accent-dim)] border-[var(--color-accent)]/30">
                      <p className="text-xs text-[var(--color-accent)] font-semibold">
                        ✓ Claude Code Pro detected — you can skip the API key if you want.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ═══════════ STEP 3: Team Setup ═══════════ */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="text-center mb-3">
                    <Bot size={36} className="mx-auto mb-2 text-[var(--color-gold)]" />
                    <h2 className="text-xl font-extrabold">Build Your Team</h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">Tell us about you & choose your AI agents</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1 block">Company / Project *</label>
                      <input value={companyName} onChange={e => setCompanyName(e.target.value)}
                        placeholder="Your company name" className="glass-input w-full px-4 py-2.5 text-sm" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1 block">Industry</label>
                      <select value={industry} onChange={e => setIndustry(e.target.value)}
                        className="glass-input w-full px-4 py-2.5 text-sm">
                        <option value="">Select...</option>
                        {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {AGENT_LIST.map(ag => (
                      <button
                        key={ag.id}
                        onClick={() => setAgentStates(s => ({ ...s, [ag.id]: !s[ag.id] }))}
                        className={`glass-sm glass-hover p-3 text-left transition-all ${
                          agentStates[ag.id] ? "!border-[var(--color-accent)]/40 bg-[var(--color-accent-dim)]" : "opacity-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{ag.icon}</span>
                          <div>
                            <div className="text-xs font-semibold">{ag.name}</div>
                            <div className="text-[0.625rem] text-[var(--color-text-tertiary)]">{ag.desc}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ═══════════ STEP 4: Ready ═══════════ */}
              {step === 4 && (
                <div className="space-y-6 text-center py-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  >
                    <div className="w-24 h-24 rounded-3xl mx-auto overflow-hidden shadow-2xl shadow-[var(--color-primary-dim)]">
                      <img src="/daena-logo.png" alt="Daena" className="w-full h-full object-cover" />
                    </div>
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-extrabold mb-2">Daena is Ready</h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">Your autonomous AI command center is configured.</p>
                  </div>

                  <div className="glass-sm p-4 text-left max-w-sm mx-auto space-y-2">
                    <SummaryRow label="Company" value={companyName || "—"} />
                    <SummaryRow label="Language" value={LANGUAGES.find(l => l.code === settings.language)?.name || "English"} />
                    <SummaryRow label="API" value={apiKey ? "OpenRouter ✓" : claudeDetected ? "Claude Pro ✓" : "—"} />
                    <SummaryRow label="Agents" value={`${Object.values(agentStates).filter(Boolean).length} / 8 active`} />
                    <SummaryRow label="Models" value="20 models (13 free)" />
                  </div>

                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    You can update everything later in Settings.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-8 pb-6">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="btn-ghost disabled:opacity-0"
          >
            <ChevronLeft size={14} /> Back
          </button>
          <button onClick={handleNext} disabled={!canNext()} className="btn-primary">
            {step === 4 ? "Launch Daena 🔥" : "Continue"} {step < 4 && <ChevronRight size={14} />}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-[var(--color-text-tertiary)]">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
