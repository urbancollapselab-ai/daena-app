import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/stores/appStore";
import { sendMessage, getModelDisplayName } from "@/lib/api";
import { Send, FileText, Bot, User, Check, X, Code, Play } from "lucide-react";
import { ToolExecutionPreview } from "./ToolExecutionPreview";
import type { ChatMessage } from "@/types";

export function ChatPage() {
  const {
    conversations, activeConversationId, addConversation,
    addMessage, isLoading, setLoading, agents,
  } = useAppStore();
  
  const [input, setInput] = useState("");
  const [previewTool, setPreviewTool] = useState<{name: string, args: any} | null>(null);
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const messages = activeConv?.messages || [];

  useEffect(() => { 
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages.length, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    let text = input.trim();
    setInput("");

    let convId = activeConversationId;
    if (!convId) { convId = addConversation(); }

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    addMessage(convId, userMsg);
    setLoading(true);

    try {
      const result = await sendMessage(text);
      addMessage(convId, {
        id: `msg_${Date.now()}_resp`,
        role: "assistant",
        content: result.response,
        model: result.model,
        agent: result.agent,
        timestamp: new Date().toISOString(),
        tokens: result.tokens,
        latencyMs: result.latency_ms,
      });
    } catch {
      addMessage(convId, {
        id: `msg_${Date.now()}_err`,
        role: "assistant",
        content: "System Error: Backend connection refused.",
        timestamp: new Date().toISOString(),
      });
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] relative">
      
      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-6 py-6 pb-32"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#666666] select-none mt-20">
             <div className="w-16 h-16 rounded-xl bg-[#252526] border border-[#3c3c3c] flex items-center justify-center mb-6">
                <Bot size={32} className="text-[#858585]" />
             </div>
             <h2 className="text-xl font-semibold mb-2">Daena Cognitive Kernel</h2>
             <p className="text-[13px]">Awaiting system instructions...</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((msg, i) => (
              <MessageBubble 
                key={msg.id} 
                message={msg} 
                onApproveTool={(name, args) => setPreviewTool({ name, args })}
              />
            ))}
            {isLoading && (
              <div className="flex gap-4">
                 <div className="w-6 h-6 rounded-md bg-[#252526] border border-[#3c3c3c] flex items-center justify-center shrink-0">
                    <Bot size={14} className="text-[#007fd4]" />
                 </div>
                 <div className="flex items-center text-[13px] text-[#007fd4] font-mono animate-pulse">
                    Computing response...
                 </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area (Sticky Bottom IDE Style) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[85%] max-w-4xl z-20">
         <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg shadow-2xl flex flex-col p-1.5 focus-within:border-[#007fd4] transition-colors">
            
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Daena or trigger an autonomous workflow..."
              rows={1}
              className="w-full bg-transparent border-none outline-none resize-none text-[13px] text-[#cccccc] placeholder:text-[#666666] p-3 leading-relaxed"
              style={{ minHeight: "40px", maxHeight: "200px" }}
              onInput={e => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = el.scrollHeight + "px";
              }}
            />
            
            <div className="flex items-center justify-between px-2 pb-1 pt-1 opacity-70">
               <div className="flex items-center gap-2">
                 <button className="text-[#858585] hover:text-[#cccccc] transition-colors"><FileText size={15} /></button>
                 <button className="text-[#858585] hover:text-[#cccccc] transition-colors"><Code size={15} /></button>
               </div>
               <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className={`p-1.5 rounded-md flex items-center justify-center transition-all ${
                     input.trim() && !isLoading ? "bg-[#007fd4] text-white" : "bg-[#333333] text-[#666666]"
                  }`}
                >
                  <Send size={14} />
               </button>
            </div>
         </div>
      </div>

      {/* Tool Execution Overlay / Antigravity Clone */}
      {previewTool && (
        <ToolExecutionPreview 
           toolName={previewTool.name}
           toolArgs={previewTool.args}
           onClose={() => setPreviewTool(null)}
        />
      )}
    </div>
  );
}

function MessageBubble({ message, onApproveTool }: { message: ChatMessage, onApproveTool: (name: string, args: any) => void }) {
  const isUser = message.role === "user";

  // Check if assistant sent a tool execution request
  let toolData = null;
  let content = message.content;
  
  if (!isUser) {
    // Basic detection for demo: if it starts with {"ui_component":"approval" -> it's a tool ask
    if (message.content.trim().startsWith('{"ui_component":')) {
      try {
        const parsed = JSON.parse(message.content.trim());
        if (parsed.ui_component === "approval") {
          toolData = parsed;
          content = "Daena is requesting permission to execute an autonomous action.";
        }
      } catch (e) {
        // Fallback to strict text if parsing fails
      }
    }
  }

  return (
    <div className={`flex gap-4`}>
      <div className="shrink-0 mt-0.5">
        {isUser ? (
          <div className="w-6 h-6 rounded-md bg-[#007fd4] flex items-center justify-center">
            <User size={14} className="text-white" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-md bg-[#252526] border border-[#3c3c3c] flex items-center justify-center">
            <Bot size={14} className="text-[#cccccc]" />
          </div>
        )}
      </div>

      <div className="flex-1 max-w-[85%]">
        {!isUser && message.agent && (
          <div className="text-[11px] font-mono text-[#858585] mb-1">[{message.agent.toUpperCase()}]</div>
        )}

        <div className="text-[13px] leading-relaxed text-[#cccccc] markdown-content whitespace-pre-wrap">
          {content}
        </div>

        {/* Generative UI Approval Card matches Antigravity prompt styling */}
        {toolData && (
          <div className="mt-4 border border-[#3c3c3c] bg-[#252526] rounded-md overflow-hidden max-w-md">
            <div className="px-3 py-2 border-b border-[#3c3c3c] bg-[#2d2d2d] flex items-center gap-2">
              <Play size={14} className="text-[#cca700]" />
              <span className="text-[12px] font-semibold text-[#cccccc]">Tool Execution Request</span>
            </div>
            <div className="p-3">
              <div className="text-[12px] text-[#cccccc] mb-2 font-mono break-all">
                Function: <span className="text-[#007fd4]">{toolData.tool_name || "browser_subagent"}</span><br/>
                Arguments: <span className="text-[#c586c0]">{JSON.stringify(toolData.arguments || {})}</span>
              </div>
              <div className="flex gap-2 mt-4">
                 <button 
                   onClick={() => onApproveTool(toolData.tool_name || "browser_subagent", toolData.arguments)}
                   className="flex-1 bg-[#007fd4] hover:bg-[#1177bb] text-white text-[12px] py-1.5 rounded-sm flex items-center justify-center gap-1 transition-colors"
                 >
                   <Check size={14} /> Approve & Run
                 </button>
                 <button className="flex-1 bg-[#3c3c3c] hover:bg-[#4d4d4d] text-white text-[12px] py-1.5 rounded-sm flex items-center justify-center gap-1 transition-colors">
                   <X size={14} /> Deny
                 </button>
              </div>
            </div>
          </div>
        )}

        {/* Time and metadata */}
        <div className="flex items-center gap-3 mt-2 opacity-50 text-[10px] text-[#858585] font-mono">
          <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          {!isUser && message.model && <span>{getModelDisplayName(message.model)}</span>}
          {!isUser && message.latencyMs && <span>{message.latencyMs}ms</span>}
        </div>
      </div>
    </div>
  );
}
