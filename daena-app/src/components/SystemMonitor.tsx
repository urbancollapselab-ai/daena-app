import React, { useEffect, useState, useRef } from 'react';
import { useAppStore } from '@/stores/appStore';
import { TerminalSquare, Cpu, Box, CheckCircle2, ChevronRight, Activity, Clock } from 'lucide-react';

interface LogLine {
  id: string;
  time: string;
  type: string;
  message: string;
  color: string;
}

export const SystemMonitor = () => {
  const { agents } = useAppStore();
  const [logs, setLogs] = useState<LogLine[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Generate some fake live logs for the visual effect of a monitoring system
  useEffect(() => {
    const logTypes = [
      { t: "INFO", c: "text-[#00D4AA]" },
      { t: "DATA", c: "text-[#22D3EE]" },
      { t: "SYSTEM", c: "text-[#6C63FF]" },
      { t: "WARN", c: "text-[#FFB547]" }
    ];

    const messages = [
      "Agent-Alpha started Processing",
      "Resource usage: CPU 12%, MEM 4.2GB",
      "Analyzing sales_data_q3.csv (25%)",
      "Allocating tensor buffers...",
      "Context window optimized",
      "Vector search completed in 14ms",
      "Running semantic extraction...",
    ];

    let timer: any;
    const addLog = () => {
      const type = logTypes[Math.floor(Math.random() * logTypes.length)];
      const msg = messages[Math.floor(Math.random() * messages.length)];
      const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' });
      
      setLogs(prev => {
        const newLogs = [...prev, { id: Math.random().toString(), time, type: type.t, message: msg, color: type.c }];
        if (newLogs.length > 50) return newLogs.slice(newLogs.length - 50);
        return newLogs;
      });

      timer = setTimeout(addLog, Math.random() * 3000 + 1000);
    };

    addLog();
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const activeAgents = agents.filter(a => a.status === 'active' || a.status === 'running');
  const idleAgents = agents.filter(a => a.status === 'idle' || a.status === 'monitoring');

  return (
    <div className="w-full h-full flex flex-col gap-4 font-sans text-white/90">
      
      {/* Terminal Block */}
      <div className="flex-1 bg-[#11131C] border border-white/5 rounded-xl flex flex-col overflow-hidden shadow-sm">
        <div className="h-10 border-b border-white/5 px-4 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
             <TerminalSquare size={14} className="text-white/40" />
             <span className="text-xs font-semibold text-white/60">Terminal: live-monitor [bash]</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5757]/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFB547]/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#00D4AA]/80" />
          </div>
        </div>
        <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] leading-relaxed tracking-wide space-y-1">
          {logs.map((log) => (
            <div key={log.id} className="flex gap-3 text-white/50">
              <span className="text-white/30 shrink-0">{log.time}</span>
              <span className={`shrink-0 font-bold ${log.color}`}>[{log.type}]</span>
              <span className="break-all">{log.message}</span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>

      {/* Agents Status Block */}
      <div className="flex-1 flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
           <span className="text-xs font-semibold text-white/60">Agent Status</span>
           <span className="text-[10px] uppercase font-bold text-[#00D4AA] tracking-wider bg-[#00D4AA]/10 px-2 py-0.5 rounded-md">
             {activeAgents.length} Active
           </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {activeAgents.map(ag => (
            <div key={ag.id} className="bg-[#11131C] border border-[#00D4AA]/30 rounded-xl p-3 shadow-[0_0_15px_rgba(0,212,170,0.05)] text-sm relative overflow-hidden">
               <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00D4AA] animate-pulse" />
               <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-2">
                   <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center text-xs">
                     {ag.icon}
                   </div>
                   <span className="font-semibold text-white/90">{ag.name}</span>
                 </div>
                 <span className="text-[10px] text-[#00D4AA] font-bold">Active</span>
               </div>
               <div className="text-xs text-white/50 mb-2 truncate">
                 TASK: {ag.id === 'main_brain' ? 'Orchestrating workflow' : 'Processing incoming data stream'}
               </div>
               <div className="flex items-center gap-4 text-[10px] text-white/40 font-mono">
                 <span className="flex items-center gap-1"><Cpu size={10} /> CPU: {Math.floor(Math.random() * 20 + 5)}%</span>
                 <span className="flex items-center gap-1"><Clock size={10} /> {Math.floor(Math.random() * 10 + 1)}m 12s</span>
               </div>
            </div>
          ))}

          {idleAgents.slice(0, 3).map(ag => (
            <div key={ag.id} className="bg-[#11131C] border border-white/5 rounded-xl p-3 text-sm opacity-60">
               <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-2">
                   <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center text-xs grayscale">
                     {ag.icon}
                   </div>
                   <span className="font-medium text-white/70">{ag.name}</span>
                 </div>
                 <span className="text-[10px] text-white/30 font-bold bg-white/5 px-2 py-0.5 rounded">Idle</span>
               </div>
               <div className="text-xs text-white/40 truncate">
                 Status: Waiting for invocation
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
