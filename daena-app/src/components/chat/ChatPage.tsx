import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/stores/appStore";
import { sendMessage, getModelDisplayName, isModelFree } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, Mic, ArrowDown, Clock, Zap, Bot, User, CheckCircle2, ChevronRight, XIcon, Loader2 } from "lucide-react";
import type { ChatMessage } from "@/types";

const QUICK_ACTIONS = [
  { icon: "💰", label: "Create Invoice", desc: "Finance agent", prompt: "@finance Create an invoice" },
  { icon: "📊", label: "Find Leads", desc: "Data agent", prompt: "@data Find new leads" },
  { icon: "📣", label: "Write Content", desc: "Marketing agent", prompt: "@marketing Draft a post" },
  { icon: "🔬", label: "Research", desc: "Research agent", prompt: "@research Market trends" },
];

export function ChatPage() {
  const {
    conversations, activeConversationId, addConversation,
    addMessage, isLoading, setLoading, agents,
  } = useAppStore();
  const [input, setInput] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const messages = activeConv?.messages || [];

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages.length]);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachedFile) || isLoading) return;
    
    let text = input.trim();
    if (attachedFile) {
      text = `[Attachment: ${attachedFile.name}]\n${text}`;
    }

    setInput("");
    setAttachedFile(null);

    let convId = activeConversationId;
    if (!convId) { convId = addConversation(); }

    let targetAgent: string | undefined;
    const mentionMatch = text.match(/@(\w+)/);
    if (mentionMatch) {
      const mentioned = mentionMatch[1].toLowerCase();
      const agent = agents.find((a) => a.id === mentioned || a.name.toLowerCase() === mentioned);
      if (agent) targetAgent = agent.id;
    }

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    addMessage(convId, userMsg);
    setLoading(true);

    try {
      const result = await sendMessage(text, targetAgent);
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
        content: "System Error: Backend is not responding.",
        timestamp: new Date().toISOString(),
      });
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const startVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition not supported in this environment.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(prev => prev + (prev ? " " : "") + transcript);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognition.start();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0C0E16]">
      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-6"
      >
        {messages.length === 0 ? (
          <EmptyState onQuickAction={t => { setInput(t); inputRef.current?.focus(); }} />
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((msg, i) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={scrollToBottom}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[#1A1C23] border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all z-30"
          >
            <ArrowDown size={16} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="p-4 bg-[#0C0E16] border-t border-white/5">
        <div className="max-w-4xl mx-auto flex flex-col gap-2">
          
          {attachedFile && (
            <div className="flex items-center gap-2 self-start px-3 py-1.5 rounded-lg bg-[#6C63FF]/10 border border-[#6C63FF]/30 text-xs text-[#6C63FF]">
               <Paperclip size={12} />
               <span className="truncate max-w-[200px]">{attachedFile.name}</span>
               <button onClick={() => setAttachedFile(null)} className="p-0.5 hover:bg-[#6C63FF]/20 rounded"><XIcon size={12} /></button>
            </div>
          )}

          <div className={`flex items-end gap-2 bg-[#1A1C23] border ${isRecording ? 'border-[#FF5757] shadow-[0_0_15px_rgba(255,87,87,0.2)]' : 'border-white/10'} rounded-xl p-2 transition-all`}>
            
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
            <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-lg hover:bg-white/5 text-white/40 transition-colors shrink-0">
              <Paperclip size={18} />
            </button>
            
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isRecording ? "Listening..." : "Type a message or trigger an @agent..."}
              rows={1}
              className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-white/90 placeholder:text-white/30 py-2.5 max-h-40 leading-relaxed"
              style={{ minHeight: "40px" }}
              onInput={e => {
                const el = e.currentTarget;
                el.style.height = "40px";
                el.style.height = Math.min(el.scrollHeight, 160) + "px";
              }}
            />
            
            <button onClick={startVoice} className={`p-2 rounded-lg hover:bg-white/5 transition-colors shrink-0 ${isRecording ? 'text-[#FF5757] animate-pulse' : 'text-white/40'}`}>
              <Mic size={18} />
            </button>
            
            <button
              onClick={handleSend}
              disabled={(!input.trim() && !attachedFile) || isLoading}
              className={`p-2.5 rounded-lg shrink-0 transition-all ${
                (input.trim() || attachedFile) && !isLoading
                  ? "bg-[#6C63FF] text-white shadow-lg hover:bg-[#7b73ff]"
                  : "bg-white/5 text-white/20"
              }`}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onQuickAction }: { onQuickAction: (p: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#6C63FF]/20 border border-[#6C63FF]/30 flex items-center justify-center mb-6">
         <Bot size={32} className="text-[#6C63FF]" />
      </div>
      <h2 className="text-2xl font-bold mb-2">How can I assist?</h2>
      <p className="text-sm text-white/40 mb-10">Select a prompt or ask a general query</p>

      <div className="grid grid-cols-2 gap-3 w-full max-w-xl">
        {QUICK_ACTIONS.map((qa) => (
          <button
            key={qa.label}
            onClick={() => onQuickAction(qa.prompt)}
            className="p-4 rounded-xl text-left bg-[#1A1C23] border border-white/5 hover:border-white/10 hover:bg-[#20222A] transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">{qa.icon}</span>
              <ChevronRight size={14} className="text-white/10 group-hover:text-white/30" />
            </div>
            <div className="text-[13px] font-semibold text-white/80">{qa.label}</div>
            <div className="text-[10px] text-white/40 mt-1">{qa.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-4 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div className="shrink-0 mt-1">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#6C63FF] to-blue-400 flex items-center justify-center shadow-lg">
            <User size={14} className="text-white" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#1A1C23] border border-white/10 flex items-center justify-center">
            <Bot size={14} className="text-white/60" />
          </div>
        )}
      </div>

      <div className={`max-w-[75%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
        {!isUser && message.agent && (
          <div className="flex items-center gap-1.5 mb-1.5 ml-1">
            <span className="text-[10px] font-bold tracking-wider text-[#6C63FF] uppercase">{message.agent} agent</span>
          </div>
        )}

        <div
          className={`px-5 py-3.5 text-[13px] leading-relaxed relative ${
            isUser
              ? "bg-[#1A1C23] border border-white/10 text-white/90 rounded-2xl rounded-tr-sm"
              : "bg-transparent text-white/80"
          }`}
        >
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>

        {/* Meta row */}
        <div className={`flex items-center gap-3 mt-1.5 px-1 opacity-50`}>
          <span className="text-[10px] flex items-center gap-1"><Clock size={10} /> {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          {!isUser && message.model && (
            <span className="text-[10px] flex items-center gap-1"><Zap size={10} /> {getModelDisplayName(message.model)}</span>
          )}
          {!isUser && message.latencyMs && (
             <span className="text-[10px] font-mono">{message.latencyMs}ms</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
      <div className="shrink-0 mt-1">
        <div className="w-8 h-8 rounded-full bg-[#1A1C23] border border-white/10 flex items-center justify-center">
          <Loader2 size={14} className="text-[#6C63FF] animate-spin" />
        </div>
      </div>
      <div className="flex items-center px-4 py-3 bg-transparent">
        <div className="text-[13px] text-white/40 font-medium">Processing request...</div>
      </div>
    </motion.div>
  );
}
