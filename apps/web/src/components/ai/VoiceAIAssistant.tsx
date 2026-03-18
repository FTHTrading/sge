"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Loader2, MessageSquare, Volume2, X } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function VoiceAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [transcript, setTranscript] = useState("");
  
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize Web Speech API
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
        };

        recognition.onend = () => {
          setIsListening(false);
          // When listening ends, if we have a transcript, process it
          if (transcriptRef.current.trim().length > 0) {
            handleUserMessage(transcriptRef.current);
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Hack to use current transcript in onend
  const transcriptRef = useRef(transcript);
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript("");
      recognitionRef.current?.start();
      setIsListening(true);
      if (audioRef.current) {
        audioRef.current.pause(); // stop any current speech
      }
    }
  };

  const handleUserMessage = async (text: string) => {
    if (!text.trim()) return;
    
    setTranscript("");
    setIsProcessing(true);
    
    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    try {
      // 1. Get AI Response
      const chatRes = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })) })
      });
      
      const chatData = await chatRes.json();
      if (!chatRes.ok) throw new Error(chatData.error);
      
      // 2. Update UI with AI text
      const assistantMsg: Message = { role: "assistant", content: chatData.text };
      setMessages([...newMessages, assistantMsg]);

      // 3. Synthesize Speech
      const speakRes = await fetch("/api/ai/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: chatData.text })
      });

      if (!speakRes.ok) throw new Error("Failed to synthesize speech");

      // 4. Play Audio
      const blob = await speakRes.blob();
      const url = URL.createObjectURL(blob);
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      audioRef.current.src = url;
      audioRef.current.play().catch(e => console.error("Audio playback failed", e));

    } catch (error) {
      console.error("AI Assistant Error:", error);
      setMessages([...newMessages, { role: "assistant", content: "I'm sorry, I'm having trouble connecting right now." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-emerald-500 text-black shadow-lg hover:bg-emerald-400 transition-all flex items-center gap-2 group z-50 animate-bounce hover:animate-none"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="hidden group-hover:block whitespace-nowrap font-medium pr-2">Need help? Talk to AI</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50">
      <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-emerald-500" />
          <h3 className="font-semibold text-zinc-100">SGE Voice Assistant</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-100">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto max-h-96 min-h-[200px] flex flex-col gap-4">
        {messages.length === 0 ? (
          <div className="text-center text-zinc-500 mt-8">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Hi! Click the microphone and ask me anything about claiming SGE or using the platform.</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-emerald-500/10 text-emerald-100 self-end mr-4' : 'bg-zinc-800 text-zinc-300 self-start ml-4'}`}>
              {msg.content}
            </div>
          ))
        )}
        {transcript && (
          <div className="p-3 rounded-lg text-sm bg-emerald-500/10 text-emerald-100 self-end opacity-70">
            {transcript}...
          </div>
        )}
        {isProcessing && (
          <div className="self-start text-zinc-500 flex items-center gap-2 p-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm border-r border-zinc-700 pr-2">AI is thinking...</span>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-zinc-800 bg-zinc-900 flex justify-center">
        <button 
          onClick={toggleListening}
          disabled={isProcessing}
          className={`p-4 rounded-full transition-all ${
            isListening 
              ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 animate-pulse' 
              : 'bg-emerald-500 text-black hover:bg-emerald-400'
          } ${isProcessing && 'opacity-50 cursor-not-allowed'}`}
        >
          {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>
      </div>
    </div>
  );
}
