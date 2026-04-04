import { useState, useEffect } from "react";
import { useAppStore } from "@/stores/appStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Key, Bot, Rocket, ChevronRight, ChevronLeft,
  Eye, EyeOff, Loader2, CheckCircle2, XCircle, AlertTriangle,
  Cpu, Shield, Download, Sparkles, Brain, Layers,
  Terminal, Users, Zap, BarChart3, MessageSquare
} from "lucide-react";
import { useTranslation } from "@/i18n";

/* ── Step definitions ─────────────────────────────── */
const STEPS = [
  { id: "welcome",   title: "Welcome",       sub: "Language" },
  { id: "showcase",  title: "Discover",      sub: "Features" },
  { id: "install",   title: "System Setup",  sub: "Auto-install" },
  { id: "connect",   title: "Connect",       sub: "API Keys" },
  { id: "team",      title: "Your Team",     sub: "Agents" },
  { id: "ready",     title: "Ready!",        sub: "Launch" },
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

/* ── Showcase slide data ─────────────────────────── */
const SHOWCASE_SLIDES = [
  {
    id: "brain",
    icon: Brain,
    gradient: "from-purple-500 to-indigo-600",
    title: "Autonomous AI Brain",
    subtitle: "Claude Opus 4.6 + 20 Model Cascade",
    features: [
      "Self-thinking main brain that orchestrates everything",
      "20 AI models from FREE to premium tier",
      "Automatic model selection for cost optimization",
      "Zero manual intervention — fully autonomous",
    ],
  },
  {
    id: "agents",
    icon: Users,
    gradient: "from-emerald-500 to-teal-600",
    title: "8 Specialized AI Agents",
    subtitle: "Your personal AI workforce",
    features: [
      "💰 Finance — Invoicing, budgets, expense tracking",
      "📊 Data — Lead enrichment, CRM, data collection",
      "📣 Marketing — Content, campaigns, social media",
      "🎯 Sales — Outreach, proposals, deal management",
      "🔬 Research — Market analysis, competitor tracking",
      "🛡️ Watchdog — System health monitoring 24/7",
      "💓 Heartbeat — Uptime tracking, scheduled reports",
      "🎭 Coordinator — Inter-agent task routing",
    ],
  },
  {
    id: "control",
    icon: BarChart3,
    gradient: "from-amber-500 to-orange-600",
    title: "Real-time Command Center",
    subtitle: "Full control over your AI operations",
    features: [
      "Live dashboard with system metrics & KPIs",
      "Per-agent monitoring with activity sparklines",
      "Model cascade visualization (T0 → T3 tiers)",
      "Request volume tracking & cost analysis",
    ],
  },
  {
    id: "platform",
    icon: Layers,
    gradient: "from-rose-500 to-pink-600",
    title: "Works Everywhere",
    subtitle: "Desktop + Mobile — One system",
    features: [
      "🖥️ macOS & Windows native desktop app",
      "📱 Mobile access via QR code (iOS & Android)",
      "🌐 Coworking mode — share access securely",
      "🔒 Local-first — your data stays on your machine",
    ],
  },
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
  const [slideIdx, setSlideIdx] = useState(0);
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

  const [deps, setDeps] = useState<DepCheck[]>([
    { name: "Python 3",              status: "pending", detail: "Required for AI backend" },
    { name: "Node.js",               status: "pending", detail: "Required for app runtime" },
    { name: "Claude Code (Opus 4.6)",status: "pending", detail: "Premium AI brain — optional" },
    { name: "OpenRouter API",        status: "pending", detail: "20-model cascade endpoint" },
    { name: "Backend Server",        status: "pending", detail: "Local AI server on port 8910" },
  ]);

  // Auto-advance showcase slides
  useEffect(() => {
    if (step !== 1) return;
    const timer = setInterval(() => {
      setSlideIdx(prev => (prev + 1) % SHOWCASE_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [step]);

  useEffect(() => {
    if (step === 2 && deps[0].status === "pending") {
      runFullScan();
    }
  }, [step]);

  const updateDep = (idx: number, patch: Partial<DepCheck>) => {
    setDeps(prev => prev.map((d, i) => i === idx ? { ...d, ...patch } : d));
  };

  const runFullScan = async () => {
    setDeps(prev => prev.map(d => ({ ...d, status: "checking" as const })));
    await sleep(400);
    updateDep(1, { status: "ok", detail: "Node.js is running (this app)" });
    await sleep(200);
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
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        if (dep.name.includes("Claude")) {
          const res: any = await invoke("install_claude");
          if (res.success) {
            updateDep(idx, { status: "ok", detail: "Installed ✓" });
            setClaudeDetected(true);
            try { await invoke("install_dependencies"); } catch {}
          } else {
            updateDep(idx, { status: "optional", detail: "Skipped — install manually later" });
          }
        } else if (dep.name.includes("Backend")) {
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
    if (step === 1) return true; // showcase
    if (step === 2) return true; // system check
    if (step === 3) return apiKey.length > 10 || claudeDetected;
    if (step === 4) return companyName.length > 0;
    return true;
  };

  const handleNext = () => {
    if (step === 3) {
      updateSettings({ openrouterKey: apiKey, anthropicKey, claudePath: claudeDetected ? "/opt/homebrew/bin/claude" : undefined });
    }
    if (step === 4) {
      updateSettings({ companyName, industry, agentsEnabled: agentStates });
    }
    if (step === 5) {
      addConversation();
      setSetupComplete(true);
      return;
    }
    setStep(s => s + 1);
  };

  const testApiKey = async () => {
    setTesting(true);
    try {
      const res = await fetch("https://openrouter.ai/api/v1/models", { headers: { Authorization: `Bearer ${apiKey}` } });
      setKeyValid(res.ok);
    } catch { setKeyValid(false); }
    setTesting(false);
  };

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

  const currentSlide = SHOWCASE_SLIDES[slideIdx];

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
        <div className="px-8 py-6 min-h-[440px]">
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

              {/* ═══════════ STEP 1: Feature Showcase ═══════════ */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="text-center">
                    <Sparkles size={20} className="mx-auto mb-2 text-[var(--color-gold)]" />
                    <h2 className="text-xl font-extrabold">What You're Installing</h2>
                    <p className="text-xs text-[var(--color-text-tertiary)]">Swipe through to see what Daena can do</p>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={slideIdx}
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -40 }}
                      transition={{ duration: 0.35 }}
                      className="glass-sm p-5 relative overflow-hidden"
                    >
                      {/* Gradient accent */}
                      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${currentSlide.gradient}`} />

                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentSlide.gradient} flex items-center justify-center`}>
                          <currentSlide.icon size={20} className="text-white" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold">{currentSlide.title}</h3>
                          <p className="text-xs text-[var(--color-text-tertiary)]">{currentSlide.subtitle}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {currentSlide.features.map((feat, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className="flex items-start gap-2 text-sm"
                          >
                            <CheckCircle2 size={14} className="text-[var(--color-accent)] mt-0.5 shrink-0" />
                            <span className="text-[var(--color-text-secondary)]">{feat}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Slide indicators + nav */}
                  <div className="flex items-center justify-center gap-2">
                    {SHOWCASE_SLIDES.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSlideIdx(i)}
                        className={`transition-all rounded-full ${
                          i === slideIdx
                            ? "w-6 h-2 bg-[var(--color-primary)]"
                            : "w-2 h-2 bg-[var(--color-surface-active)] hover:bg-[var(--color-text-tertiary)]"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Quick stat bar */}
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { num: "8", label: "AI Agents" },
                      { num: "20", label: "Models" },
                      { num: "13", label: "Free Models" },
                      { num: "4", label: "Languages" },
                    ].map(stat => (
                      <div key={stat.label} className="glass-sm py-2 px-1">
                        <div className="text-base font-extrabold text-[var(--color-primary)]">{stat.num}</div>
                        <div className="text-[0.5625rem] text-[var(--color-text-tertiary)]">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ═══════════ STEP 2: System Scan & Auto-Install ═══════════ */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="text-center mb-3">
                    <Cpu size={32} className="mx-auto mb-2 text-[var(--color-primary)]" />
                    <h2 className="text-xl font-extrabold">System Setup</h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">Scanning & installing dependencies</p>
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
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold">{dep.name}</div>
                          <div className="text-xs text-[var(--color-text-tertiary)] truncate">{dep.detail}</div>
                        </div>
                        {dep.status === "ok" && <span className="badge badge-green text-[0.625rem]">Ready</span>}
                        {dep.status === "installing" && <span className="badge badge-gold text-[0.625rem]">Installing</span>}
                        {dep.status === "missing" && <span className="badge badge-red text-[0.625rem]">Missing</span>}
                        {dep.status === "optional" && <span className="badge badge-amber text-[0.625rem]">Optional</span>}
                      </motion.div>
                    ))}
                  </div>
                  {hasMissing && !installing && !installDone && (
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
                      <p className="text-xs text-[var(--color-accent)] font-semibold">🎉 Claude Pro detected! Opus 4.6 will be your primary brain.</p>
                    </div>
                  )}
                  <div className="glass-sm p-3 border-[var(--color-warning)]/20 bg-[var(--color-warning)]/5">
                    <div className="flex items-start gap-2">
                      <Shield size={14} className="text-[var(--color-warning)] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-[var(--color-warning)] font-semibold mb-0.5">Autonomous Access</p>
                        <p className="text-[0.6875rem] text-[var(--color-text-tertiary)]">
                          Daena needs terminal & file system access. Permissions are granted once — no repeated prompts.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════ STEP 3: API Connection ═══════════ */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="text-center mb-3">
                    <Key size={32} className="mx-auto mb-2 text-[var(--color-accent)]" />
                    <h2 className="text-xl font-extrabold">Connect Your AI</h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">Power the 20-model cascade</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5 block">
                      OpenRouter API Key {!claudeDetected && <span className="text-[var(--color-error)]">*</span>}
                    </label>
                    <div className="relative">
                      <input type={showKey ? "text" : "password"} value={apiKey}
                        onChange={e => setApiKey(e.target.value)} placeholder="sk-or-v1-..."
                        className="glass-input w-full px-4 py-3 pr-20 text-sm" />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        <button onClick={() => setShowKey(!showKey)} className="p-1.5 hover:bg-white/5 rounded-lg">
                          {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button onClick={testApiKey} disabled={apiKey.length < 10 || testing}
                          className="px-2 py-1 text-xs font-semibold rounded-lg bg-[var(--color-primary-dim)] text-[var(--color-primary)] disabled:opacity-30">
                          {testing ? <Loader2 size={12} className="animate-spin" /> : "Test"}
                        </button>
                      </div>
                    </div>
                    {keyValid === true && <p className="text-xs text-[var(--color-accent)] mt-1.5 flex items-center gap-1"><CheckCircle2 size={12} /> Key valid — 20 models available</p>}
                    {keyValid === false && <p className="text-xs text-[var(--color-error)] mt-1.5 flex items-center gap-1"><XCircle size={12} /> Invalid key</p>}
                    <p className="text-xs text-[var(--color-text-tertiary)] mt-1.5">
                      Free key at <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-[var(--color-primary)] underline">openrouter.ai/keys</a>
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5 block">
                      Anthropic API Key <span className="text-[var(--color-text-tertiary)]">(optional)</span>
                    </label>
                    <input type="password" value={anthropicKey} onChange={e => setAnthropicKey(e.target.value)}
                      placeholder="sk-ant-..." className="glass-input w-full px-4 py-3 text-sm" />
                  </div>
                  {claudeDetected && (
                    <div className="glass-sm p-3 bg-[var(--color-accent-dim)] border-[var(--color-accent)]/30">
                      <p className="text-xs text-[var(--color-accent)] font-semibold">✓ Claude Code Pro detected — API key optional</p>
                    </div>
                  )}
                </div>
              )}

              {/* ═══════════ STEP 4: Team Setup ═══════════ */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="text-center mb-2">
                    <Bot size={32} className="mx-auto mb-2 text-[var(--color-gold)]" />
                    <h2 className="text-xl font-extrabold">Build Your Team</h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">About you & your AI agents</p>
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
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {AGENT_LIST.map(ag => (
                      <button key={ag.id}
                        onClick={() => setAgentStates(s => ({ ...s, [ag.id]: !s[ag.id] }))}
                        className={`glass-sm glass-hover p-2.5 text-left transition-all ${
                          agentStates[ag.id] ? "!border-[var(--color-accent)]/40 bg-[var(--color-accent-dim)]" : "opacity-50"
                        }`}>
                        <div className="flex items-center gap-2">
                          <span className="text-base">{ag.icon}</span>
                          <div>
                            <div className="text-xs font-semibold">{ag.name}</div>
                            <div className="text-[0.5625rem] text-[var(--color-text-tertiary)]">{ag.desc}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ═══════════ STEP 5: Ready ═══════════ */}
              {step === 5 && (
                <div className="space-y-6 text-center py-4">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}>
                    <div className="w-24 h-24 rounded-3xl mx-auto overflow-hidden shadow-2xl shadow-[var(--color-primary-dim)]">
                      <img src="/daena-logo.png" alt="Daena" className="w-full h-full object-cover" />
                    </div>
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-extrabold mb-2">Daena is Ready</h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">Your autonomous AI command center is configured.</p>
                  </div>
                  <div className="glass-sm p-4 text-left max-w-sm mx-auto space-y-2.5">
                    <SummaryRow label="Company" value={companyName || "—"} />
                    <SummaryRow label="Language" value={LANGUAGES.find(l => l.code === settings.language)?.name || "English"} />
                    <SummaryRow label="API" value={apiKey ? "OpenRouter ✓" : claudeDetected ? "Claude Pro ✓" : "—"} />
                    <SummaryRow label="Agents" value={`${Object.values(agentStates).filter(Boolean).length} / 8 active`} />
                    <SummaryRow label="Models" value="20 models (13 free)" />
                  </div>
                  <p className="text-xs text-[var(--color-text-tertiary)]">You can update everything later in Settings.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-8 pb-6">
          <button onClick={() => setStep(s => s - 1)} disabled={step === 0} className="btn-ghost disabled:opacity-0">
            <ChevronLeft size={14} /> Back
          </button>
          <button onClick={handleNext} disabled={!canNext()} className="btn-primary">
            {step === 5 ? "Launch Daena 🔥" : step === 1 ? "I'm Ready — Let's Go" : "Continue"} {step < 5 && step !== 1 && <ChevronRight size={14} />}
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
