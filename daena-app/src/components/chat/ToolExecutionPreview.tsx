import React, { useState, useEffect } from "react";
import { X, Play, Terminal, Globe, Maximize2, Minimize2 } from "lucide-react";
import { motion } from "framer-motion";

interface ToolExecutionPreviewProps {
  toolName: string;
  toolArgs?: any;
  onClose: () => void;
}

export function ToolExecutionPreview({ toolName, toolArgs, onClose }: ToolExecutionPreviewProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Simulated tool execution logs to mimic Antigravity
  useEffect(() => {
    let timer: any;
    
    setLogs(["[SYSTEM] Connecting to local Daena tool registry..."]);
    
    setTimeout(() => {
       setLogs(prev => [...prev, `[INIT] Spawning process for: ${toolName}`]);
    }, 800);

    setTimeout(() => {
       setLogs(prev => [...prev, `[DATA] Received arguments: ${JSON.stringify(toolArgs)}`]);
    }, 1500);

    setTimeout(() => {
       setLogs(prev => [...prev, "[EXEC] Executing logic...", ">> Opening headless interaction matrix"]);
    }, 2500);

    setTimeout(() => {
       setLogs(prev => [...prev, "[SUCCESS] Tool successfully executed and yielded results back to the loop."]);
    }, 4500);

    return () => clearTimeout(timer);
  }, [toolName, toolArgs]);

  // If it's a browser tool, we might want to fake a browser view. For now, we simulate a terminal output or a unified "Antigravity Tool Runner" pane.
  const isBrowser = toolName.includes("browser") || toolName.includes("web");
  const isTerminal = toolName.includes("terminal") || toolName.includes("command");

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={`absolute z-50 bg-[#1e1e1e] border border-[#3c3c3c] shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
        isFullscreen 
          ? "inset-4 rounded-xl" 
          : "right-6 bottom-6 w-[500px] h-[350px] rounded-lg"
      }`}
    >
      {/* Header bar */}
      <div className="h-9 bg-[#252526] border-b border-[#3c3c3c] flex items-center justify-between px-3 cursor-move">
         <div className="flex items-center gap-2 text-[#cccccc] text-[12px] font-semibold">
           {isBrowser ? <Globe size={14} className="text-blue-400" /> : <Terminal size={14} className="text-green-400" />}
           Antigravity Subagent Preview: {toolName}
         </div>
         <div className="flex items-center gap-1.5">
           <button onClick={() => setIsFullscreen(!isFullscreen)} className="text-[#858585] hover:text-white p-1 rounded hover:bg-[#3c3c3c]">
              {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
           </button>
           <button onClick={onClose} className="text-[#858585] hover:text-[#f48771] p-1 rounded hover:bg-[#3c3c3c]">
              <X size={14} />
           </button>
         </div>
      </div>

      <div className="flex-1 bg-[#1e1e1e] flex flex-col relative">
        {/* Fake Browser Overlay if applicable */}
        {isBrowser && (
          <div className="h-8 bg-[#333333] flex items-center px-2 gap-2 border-b border-[#3c3c3c]">
            <div className="flex items-center gap-1.5 ml-1">
              <div className="w-2.5 h-2.5 rounded-full bg-[#f48771]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#cca700]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#89d185]"></div>
            </div>
            <div className="flex-1 bg-[#1e1e1e] h-5 rounded-sm flex items-center px-3 mx-2 border border-[#3c3c3c]">
              <span className="text-[10px] text-[#858585] truncate">https://preview.local/autonomous-rendering</span>
            </div>
          </div>
        )}

        {/* Console View */}
        <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed text-[#cccccc]">
          {logs.map((log, i) => {
            const isSystem = log.includes("[SYSTEM]") || log.includes("[INIT]");
            const isSuccess = log.includes("[SUCCESS]");
            return (
              <div key={i} className={`mb-1 ${isSystem ? 'text-[#007fd4]' : isSuccess ? 'text-[#89d185]' : 'text-[#cccccc]'}`}>
                 {log}
              </div>
            );
          })}
          <div className="animate-pulse mt-2 text-[#858585]">_</div>
        </div>
      </div>
    </motion.div>
  );
}
