import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, X } from 'lucide-react';

export const VoiceMode = ({ onClose }: { onClose: () => void }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');

  // Keep ref in sync so the onend handler always reads the latest value
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);

  const handleSynthesize = useCallback(async (text: string) => {
    setIsSpeaking(true);
    try {
      const { getApiBase } = await import('../lib/api');
      const base = await getApiBase();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      await fetch(`${base}/voice/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      setTimeout(() => setIsSpeaking(false), 5000);
    } catch {
      setIsSpeaking(false);
    }
  }, []);

  // Initialize SpeechRecognition ONCE — no dependency on transcript
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) return;

    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'tr-TR';

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      let currentText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentText += event.results[i][0].transcript;
      }
      setTranscript(currentText);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Read from ref to avoid stale closure
      if (transcriptRef.current.length > 2) {
        handleSynthesize(transcriptRef.current);
      }
    };

    recognitionRef.current = recognition;

    return () => { recognition.stop(); };
  }, [handleSynthesize]); // stable deps only

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      recognitionRef.current?.start();
    }
  };

  return (
    <div className="fixed inset-0 bg-[var(--color-bg-deep)]/98 z-50 flex flex-col items-center justify-center p-8 backdrop-blur-2xl">
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all"
      >
        <X size={20} />
      </button>

      {/* Siri-like Waveform */}
      <div className="relative w-64 h-64 flex items-center justify-center mb-16">
        <div className={`absolute inset-0 rounded-full bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-accent)] blur-3xl transition-all duration-1000 ${
          isListening ? 'opacity-30 scale-150' : isSpeaking ? 'opacity-25 scale-125' : 'opacity-10 scale-100'
        }`} />

        <button
          onClick={toggleListen}
          className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${
            isListening
              ? 'bg-[var(--color-error)] shadow-[0_0_60px_var(--color-error-dim)]'
              : isSpeaking
                ? 'bg-[var(--color-accent)] shadow-[0_0_60px_var(--color-accent-dim)]'
                : 'bg-neutral-800 hover:bg-neutral-700 shadow-[0_0_30px_rgba(108,99,255,0.15)]'
          }`}
        >
          {isListening ? <MicOff className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-white" />}
        </button>
      </div>

      {/* Transcript Text */}
      <div className="text-center max-w-2xl min-h-[8rem]">
        {isListening && <p className="text-[var(--color-accent)] font-medium mb-3 text-sm tracking-wider uppercase">Dinliyor...</p>}
        {isSpeaking && <p className="text-[var(--color-primary)] font-medium mb-3 text-sm tracking-wider uppercase">Daena Konusuyor...</p>}
        <p className="text-2xl text-neutral-300 font-light leading-relaxed">
          {transcript || (isSpeaking ? "..." : "Konusmak icin mikrofona dokunun.")}
        </p>
      </div>
    </div>
  );
};
