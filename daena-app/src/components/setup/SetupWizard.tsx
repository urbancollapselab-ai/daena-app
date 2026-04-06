import { useState, useEffect } from "react";
import { useAppStore } from "@/stores/appStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Key, Bot, ChevronRight, ChevronLeft, Eye, EyeOff, Loader2, CheckCircle2,
  XCircle, Brain, Layers, Users, BarChart3, Fingerprint, Lock, Zap
} from "lucide-react";

const STEPS = [
  { id: "welcome", title: "Welcome" },
  { id: "system",  title: "System" },
  { id: "api",     title: "Connection" },
  { id: "team",    title: "Company" },
  { id: "ready",   title: "Launch" },
];

const SHOWCASE_SLIDES = [
  {
    icon: Brain,
    title: "Cognitive Kernel Architecture",
    desc: "Daena utilizes a fast, self-correcting brain system. When models fail, the alternative reality reactor automatically switches to fallback pools with zero latency.",
    badge: "ENGINE v10.5",
    color: "text-indigo-400"
  },
  {
    icon: Users,
    title: "Intelligent Agent Swarm",
    desc: "Deploy specialized AI agents for Finance, Marketing, Data Analysis, and Sales. They collaborate, share context, and run workflows entirely autonomously.",
    badge: "8 SPECIALIZED AGENTS",
    color: "text-emerald-400"
  },
  {
    icon: Lock,
    title: "Enterprise Grade Security",
    desc: "All processing happens securely. PII scrubbing, input sanitation, and robust output guards ensure your corporate data never leaks into the wild.",
    badge: "ZERO TRUST DESIGN",
    color: "text-rose-400"
  },
  {
    icon: BarChart3,
    title: "Real-time Neural Monitoring",
    desc: "Watch the thought processes of your agents live. Daena provides a comprehensive live terminal, monitoring memory blocks, token usage, and epistemic health.",
    badge: "LIVE TELEMETRY",
    color: "text-amber-400"
  }
];

export function SetupWizard({ onComplete }: { onComplete?: () => void }) {
  const { updateSettings, setSetupComplete, addConversation } = useAppStore();
  const [step, setStep] = useState(0);
  const [slideIdx, setSlideIdx] = useState(0);

  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [keyValid, setKeyValid] = useState<boolean | null>(null);

  const [claudePro, setClaudePro] = useState(false);
  const [companyName, setCompanyName] = useState("");

  const [statusText, setStatusText] = useState("Initializing neural link...");

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIdx(prev => (prev + 1) % SHOWCASE_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Fake system check simulation for immersion
  useEffect(() => {
    if (step === 1) {
      const msgs = [
        "Verifying node environment...",
        "Checking Python 3.13 backend bindings...",
        "Connecting to local WebSocket on port 8910...",
        "Pinging OpenRouter infrastructure...",
        "Validating desktop OS permissions...",
        "System check complete. All systems nominal."
      ];
      let i = 0;
      const t = setInterval(() => {
        if (i < msgs.length) {
          setStatusText(msgs[i]);
          i++;
        } else {
          clearInterval(t);
        }
      }, 800);
      return () => clearInterval(t);
    }
  }, [step]);

  const testApiKey = async () => {
    setTesting(true);
    try {
      const res = await fetch("https://openrouter.ai/api/v1/models", { headers: { Authorization: `Bearer ${apiKey}` } });
      setKeyValid(res.ok);
    } catch { setKeyValid(false); }
    setTesting(false);
  };

  const checkClaudePro = async () => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const data: any = await invoke("check_claude");
      if (data.available) setClaudePro(true);
    } catch { setClaudePro(false); }
  };

  const handleNext = () => {
    if (step === 2) {
      updateSettings({ openrouterKey: apiKey });
      updateSettings({ claudePath: claudePro ? "/opt/homebrew/bin/claude" : undefined });
    }
    if (step === 3) updateSettings({ companyName });
    if (step === 4) {
      addConversation();
      setSetupComplete(true);
      if (onComplete) onComplete();
      return;
    }
    setStep(s => s + 1);
  };

  const slide = SHOWCASE_SLIDES[slideIdx];

  return (
    <div className="fixed inset-0 bg-[#0C0E16] flex w-full h-screen overflow-hidden text-[#EEEEF2] font-sans">
      
      {/* LEFT SIDE: Beautiful Presentation Panel */}
      <div className="hidden lg:flex w-[55%] relative overflow-hidden bg-[#11131C] border-r border-white/5 flex-col justify-between p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-[#11131C] to-[#0A0B10] z-0" />
        
        {/* Top Logo */}
        <div className="z-10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#6C63FF] grid place-items-center">
            <Fingerprint size={18} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-wide">AETHER AI</span>
          <span className="text-xs font-semibold px-2 py-1 bg-white/10 rounded-md text-white/70 ml-2">Enterprise Edition</span>
        </div>

        {/* Dynamic Presentation Slide */}
        <div className="z-10 w-full max-w-xl self-center relative flex-1 flex items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={slideIdx}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4">
                <span className={`w-2 h-2 rounded-full bg-current ${slide.color} animate-pulse`} />
                <span className={`text-[0.65rem] font-bold tracking-widest ${slide.color}`}>{slide.badge}</span>
              </div>
              
              <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-white/90">
                {slide.title}
              </h1>
              
              <p className="text-lg text-white/50 leading-relaxed max-w-lg">
                {slide.desc}
              </p>

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Slide Nav Bottom */}
        <div className="z-10 flex items-center gap-3">
          {SHOWCASE_SLIDES.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-700 ${idx === slideIdx ? "w-12 bg-[#6C63FF]" : "w-4 bg-white/10"}`} 
            />
          ))}
        </div>
      </div>

      {/* RIGHT SIDE: Interactive Minimalist Setup Area */}
      <div className="w-full lg:w-[45%] h-full flex flex-col items-center justify-center relative p-8">
        
        <div className="w-full max-w-md">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-12">
            <div className="text-xs font-semibold tracking-wider text-white/40 uppercase">
              Step {step + 1} of 5
            </div>
            <div className="flex gap-2">
              {STEPS.map((s, i) => (
                <div key={s.id} className={`w-8 h-1 rounded-full transition-colors ${i <= step ? "bg-[#6C63FF]" : "bg-white/10"}`} />
              ))}
            </div>
          </div>

          {/* Form Content Container */}
          <div className="min-h-[320px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Step 1: Welcome Overview */}
                {step === 0 && (
                  <div className="space-y-6">
                    <h2 className="text-3xl font-bold text-white/90">Initialize Workspace</h2>
                    <p className="text-sm text-white/50 leading-relaxed">
                      Welcome to your new cognitive command center. We will perform a brief configuration 
                      to establish secure connections to your required LLM providers and set up your active environment.
                    </p>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex gap-3">
                        <Zap size={20} className="text-[#6C63FF] shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-white/80">Native Execution Enabled</p>
                          <p className="text-xs text-white/40 mt-1">
                            This application runs locally via Tauri & Python Backend. All code execution is isolated.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: System Status */}
                {step === 1 && (
                  <div className="space-y-6">
                    <h2 className="text-3xl font-bold text-white/90">System Integrity</h2>
                    <p className="text-sm text-white/50">Running diagnostic pass on required backend services.</p>
                    
                    <div className="font-mono text-[0.65rem] sm:text-xs text-[#00D4AA] bg-[#0A0B10] border border-white/5 p-4 rounded-lg shadow-inner h-32 flex flex-col justify-end">
                      <p className="opacity-60">{`> Boot sequence initiated...`}</p>
                      <p className="opacity-80">{`> ${statusText}`}</p>
                      <p className="animate-pulse">{`> _`}</p>
                    </div>

                    <p className="text-xs text-white/40 italic flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-[#00D4AA]" /> Auto-healing active. No action required.
                    </p>
                  </div>
                )}

                {/* Step 3: API Key */}
                {step === 2 && (
                  <div className="space-y-6">
                    <h2 className="text-3xl font-bold text-white/90">Connect Provider</h2>
                    <p className="text-sm text-white/50">Provide an OpenRouter API key to access 20+ models instantly.</p>
                    
                    <div className="space-y-2">
                       <label className="text-xs font-semibold text-white/60">OPENROUTER API KEY</label>
                       <div className="relative">
                          <input 
                            type={showKey ? "text" : "password"} 
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="sk-or-v1-..."
                            className="w-full bg-[#1A1C23] border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF] outline-none transition-all placeholder:text-white/20"
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <button onClick={testApiKey} disabled={apiKey.length < 10 || testing} className="px-2 py-1 rounded bg-[#6C63FF]/20 text-[#6C63FF] text-xs font-semibold disabled:opacity-50">
                              {testing ? <Loader2 size={12} className="animate-spin" /> : "Verify"}
                            </button>
                            <button onClick={() => setShowKey(!showKey)} className="p-1.5 text-white/40 hover:text-white/80">
                              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                       </div>
                       {keyValid === true && <p className="text-xs text-[#00D4AA] flex items-center gap-1 mt-2"><CheckCircle2 size={12} /> Connection established completely.</p>}
                       {keyValid === false && <p className="text-xs text-[#FF5757] flex items-center gap-1 mt-2"><XCircle size={12} /> Invalid API Key. Connection refused.</p>}
                    </div>

                    <div className="pt-2">
                      <button onClick={checkClaudePro} className="w-full p-4 rounded-xl border border-white/5 bg-[#1A1C23] hover:bg-[#20222A] transition-colors flex items-center justify-between text-left group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#f2e1cf] grid place-items-center">
                            <Layers size={14} className="text-[#a55f46]" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white/80 group-hover:text-white">Opus Native Fallback (Optional)</p>
                            <p className="text-xs text-white/40">Use your local Claude Pro account via CLI.</p>
                          </div>
                        </div>
                        {claudePro ? <CheckCircle2 size={18} className="text-[#00D4AA]" /> : <ChevronRight size={18} className="text-white/20 group-hover:text-white/50" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 4: Company Context */}
                {step === 3 && (
                  <div className="space-y-6">
                    <h2 className="text-3xl font-bold text-white/90">Organization Sync</h2>
                    <p className="text-sm text-white/50">To provide tailored responses, agents need to know what they are operating.</p>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-white/60">COMPANY OR PROJECT NAME</label>
                      <input 
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Acme Corp, Project Alpha..."
                        className="w-full bg-[#1A1C23] border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF] outline-none transition-all placeholder:text-white/20"
                      />
                    </div>

                    <div className="p-4 rounded-xl bg-[#1A1C23] border border-white/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white/80">Deploy Default Capabilities</p>
                          <p className="text-xs text-white/40 mt-0.5">Loads 8 standard agents automatically.</p>
                        </div>
                        <div className="w-10 h-6 bg-[#6C63FF] rounded-full p-1 cursor-not-allowed">
                          <div className="w-4 h-4 bg-white rounded-full translate-x-4 shadow-sm" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Launch */}
                {step === 4 && (
                  <div className="space-y-6">
                    <div className="w-16 h-16 rounded-2xl bg-[#6C63FF]/20 text-[#6C63FF] flex items-center justify-center mb-6">
                      <CheckCircle2 size={32} />
                    </div>
                    <h2 className="text-3xl font-bold text-white/90">All Systems Go</h2>
                    <p className="text-sm text-white/50">
                      Configuration complete. Your Enterprise Command Center has synchronized perfectly and is ready to accept prime directives.
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Action Footer */}
          <div className="mt-12 flex items-center justify-between border-t border-white/5 pt-6">
             <button 
               onClick={() => setStep(s => s - 1)} 
               disabled={step === 0} 
               className="px-4 py-2 text-sm font-semibold text-white/40 hover:text-white/80 disabled:opacity-0 transition-colors"
             >
               Back
             </button>
             <button 
               onClick={handleNext}
               disabled={(step === 2 && apiKey.length < 10 && !claudePro) || (step === 3 && companyName.length === 0)}
               className="px-6 py-2.5 rounded-lg bg-[#EEEEF2] text-[#060810] font-bold text-sm tracking-wide hover:bg-white disabled:opacity-30 transition-all flex items-center gap-2"
             >
               {step === 4 ? "Launch Dashboard" : "Continue"}
               {step < 4 && <ChevronRight size={16} />}
             </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}
