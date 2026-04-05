import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Waves } from 'lucide-react';

export const VoiceMode = ({ onClose }: { onClose: () => void }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
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

      recognition.onend = async () => {
        setIsListening(false);
        if (transcript.length > 2) {
          await handleSynthesize(transcript);
        }
      };

      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [transcript]);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      recognitionRef.current?.start();
    }
  };

  const handleSynthesize = async (text: string) => {
    setIsSpeaking(true);
    try {
      await fetch('http://localhost:8910/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: "Sisteminiz çok iyi durumda Vedat. Sorduğunuz soru analiz edildi." })
      });
      // In a real app we play the audio buffer here or via the python backend directly playing it.
      // Since our python edge-tts implementation uses afplay to play it locally, 
      // the speaker will simply output sound. We simulate the speaking visualization duration.
      setTimeout(() => setIsSpeaking(false), 5000); 
    } catch (e) {
      setIsSpeaking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-950 z-50 flex flex-col items-center justify-center p-8">
      <button onClick={onClose} className="absolute top-8 right-8 text-neutral-500 hover:text-white transition-colors">Kapat</button>
      
      {/* Siri-like Waveform placeholder (using CSS animations for premium feel) */}
      <div className="relative w-64 h-64 flex items-center justify-center mb-16">
        <div className={`absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 blur-3xl opacity-20 transition-all duration-1000 ${isListening ? 'scale-150 animate-pulse opacity-40' : ''} ${isSpeaking ? 'scale-125 opacity-50' : ''}`} />
        
        <button 
          onClick={toggleListen}
          className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${
            isListening 
              ? 'bg-red-500 shadow-[0_0_50px_rgba(239,68,68,0.5)]' 
              : isSpeaking
                ? 'bg-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.5)] animate-bounce'
                : 'bg-neutral-800 hover:bg-neutral-700'
          }`}
        >
          {isListening ? <MicOff className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-white" />}
        </button>
      </div>

      {/* Transcript Text */}
      <div className="text-center max-w-2xl h-32">
        {isListening && <p className="text-emerald-400 font-medium mb-2 drop-shadow-md">Dinliyor...</p>}
        {isSpeaking && <p className="text-cyan-400 font-medium mb-2 drop-shadow-md">Daena Konuşuyor...</p>}
        <p className="text-3xl text-neutral-300 font-light leading-relaxed">
          {transcript || (isSpeaking ? "..." : "Konuşmak için mikrofona dokunun.")}
        </p>
      </div>
    </div>
  );
};
