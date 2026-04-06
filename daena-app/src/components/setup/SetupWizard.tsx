import { useState, useEffect } from "react";
import { useAppStore } from "@/stores/appStore";
import { Terminal, Copy, Command, Box, Server, Settings, Flag } from "lucide-react";

export function SetupWizard({ onComplete }: { onComplete?: () => void }) {
  const { updateSettings, setSetupComplete, addConversation } = useAppStore();
  
  const [apiKey, setApiKey] = useState("");
  const [step, setStep] = useState(0);

  // Fake IDE terminal log
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    let timer: any;
    if (step === 1) {
       setLogs(["[DAENA] Booting Core Kernel..."]);
       timer = setTimeout(() => setLogs(p => [...p, "[SYS] Loading local agents (8)"]), 600);
       timer = setTimeout(() => setLogs(p => [...p, "[SYS] Validating Tauri binary bindings... OK"]), 1200);
       timer = setTimeout(() => setLogs(p => [...p, "[READY] Please supply OpenRouter key for model cascade"]), 1800);
    }
    return () => clearTimeout(timer);
  }, [step]);

  const handleNext = () => {
    if (step === 1 && apiKey.length > 5) {
      updateSettings({ openrouterKey: apiKey });
      setStep(2);
      return;
    }
    if (step === 2) {
      addConversation();
      setSetupComplete(true);
      if (onComplete) onComplete();
      return;
    }
    setStep(s => s + 1);
  };

  return (
    <div className="flex w-full h-screen bg-[#1e1e1e] text-[#cccccc] font-sans overflow-hidden">
       {/* Sidebar (Fake for Setup) */}
       <div className="w-[200px] border-r border-[#3c3c3c] bg-[#252526] flex flex-col pt-3">
          <div className="px-5 py-2 text-[11px] font-semibold uppercase text-[#858585]">Daena Setup</div>
          <div className={`px-5 py-1.5 text-[13px] ${step === 0 ? 'text-white bg-[#37373d]' : ''}`}>1. init.sh</div>
          <div className={`px-5 py-1.5 text-[13px] ${step === 1 ? 'text-white bg-[#37373d]' : ''}`}>2. config_api.json</div>
          <div className={`px-5 py-1.5 text-[13px] ${step === 2 ? 'text-white bg-[#37373d]' : ''}`}>3. launch.bat</div>
       </div>

       {/* Editor Pane */}
       <div className="flex-1 flex flex-col bg-[#1e1e1e]">
          <div className="flex h-[35px] bg-[#2d2d2d] border-b border-[#252526]">
             <div className="px-4 flex items-center border-t-2 border-[#007fd4] bg-[#1e1e1e] text-[13px] text-white">
                setup_wizard.ts <span className="ml-2 text-[#858585]">x</span>
             </div>
          </div>
          
          <div className="flex-1 p-8 overflow-y-auto relative">
             <div className="max-w-xl mx-auto mt-10">
                {step === 0 && (
                   <div className="fade-in">
                      <div className="flex items-center gap-4 mb-8">
                         <div className="w-16 h-16 bg-[#252526] border border-[#3c3c3c] rounded flex items-center justify-center shadow-lg">
                            {/* Represents the Zoroastrian/Daena fire/wings simple icon */}
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                               <path d="M12 2L15 8H9L12 2Z" fill="#cca700"/>
                               <path d="M12 22L9 16H15L12 22Z" fill="#cca700"/>
                               <path d="M2 12L8 9V15L2 12Z" fill="#cca700"/>
                               <path d="M22 12L16 15V9L22 12Z" fill="#cca700"/>
                               <circle cx="12" cy="12" r="3" fill="#e5b567"/>
                            </svg>
                         </div>
                         <div>
                            <h1 className="text-2xl font-bold text-white">Daena Cognitive Kernel</h1>
                            <p className="text-[13px] text-[#858585]">IDE Edition v11.0</p>
                         </div>
                      </div>

                      <div className="text-[13px] leading-relaxed mb-6 space-y-4">
                         <p>Welcome to Daena. This environment is structured as a dedicated Integrated Development Environment (IDE) for interacting with your autonomous agents.</p>
                         <p>Daena replaces traditional UI elements with a command-driven chat interface, embedded file execution previews, and pure developer capabilities.</p>
                      </div>

                      <button onClick={handleNext} className="btn-primary py-1.5 px-4">Continue Execution</button>
                   </div>
                )}

                {step === 1 && (
                   <div className="fade-in">
                      <h2 className="text-lg font-bold text-white mb-4">Environment Variables Required</h2>
                      <div className="bg-[#1e1e1e] border border-[#3c3c3c] rounded mb-6 p-2 font-mono text-[12px] h-32 flex flex-col justify-end">
                         {logs.map((l, i) => (
                           <div key={i} className="text-[#cccccc] mb-1">{l}</div>
                         ))}
                         <div className="animate-pulse text-[#858585]">_</div>
                      </div>

                      <div className="mb-6">
                         <label className="block text-[12px] text-[#858585] mb-1 font-mono">export OPENROUTER_API_KEY=</label>
                         <input 
                           type="password"
                           value={apiKey}
                           onChange={e => setApiKey(e.target.value)}
                           className="ide-input w-full font-mono py-2 bg-[#252526]"
                           placeholder="sk-or-v1-..."
                         />
                      </div>

                      <button onClick={handleNext} disabled={apiKey.length < 5} className="btn-primary py-1.5 px-4 h-8">
                         Save Configuration
                      </button>
                   </div>
                )}

                {step === 2 && (
                   <div className="fade-in text-center">
                      <div className="w-16 h-16 bg-[#252526] border border-[#3c3c3c] rounded-full flex items-center justify-center mx-auto mb-6 text-[#89d185]">
                         <Terminal size={32} />
                      </div>
                      <h2 className="text-xl font-bold text-white mb-2">Build Successful</h2>
                      <p className="text-[13px] text-[#858585] mb-8">Daena IDE is ready to accept commands.</p>

                      <button onClick={handleNext} className="btn-primary py-2 px-8">Launch Workspace</button>
                   </div>
                )}
             </div>
          </div>
       </div>
    </div>
  );
}
