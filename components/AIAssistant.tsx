import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, HeartPulse, AlertCircle, MessageSquare } from 'lucide-react';
import { getPatientRiskAssessment, getFamilyAdvice } from '../services/geminiService';
import { Message } from '../types';

const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Muraho! I am your FamCare AI Assistant. Switch to "Health Mode" for medical triage or stay in "General Mode" for family organization. How can I help you today?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'general' | 'medical'>('medical');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', text: textToSend, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      let responseText: string;
      if (mode === 'medical') {
        const history = messages.slice(-5).map(m => `${m.role}: ${m.text}`).join('\n');
        const result = await getPatientRiskAssessment(textToSend, history);
        responseText = result.advice;
      } else {
        responseText = await getFamilyAdvice(textToSend);
      }
      
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: responseText, 
        timestamp: new Date() 
      }]);
    } catch (err) {
      console.error("Assistant Error:", err);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: "I encountered an error while processing your request. Please try again or contact support if the issue persists.", 
        timestamp: new Date() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = mode === 'medical' 
    ? [
        { label: "Check Vision Changes", text: "I have blurry vision and a bad headache." },
        { label: "Kick Count Guide", text: "How many kicks should I feel at 32 weeks?" },
        { label: "Swelling Check", text: "My feet are very swollen today." }
      ]
    : [
        { label: "Diet Advice", text: "What are healthy local Rwandan foods for pregnancy?" },
        { label: "Family Calendar", text: "Help me organize a family vaccination schedule." },
        { label: "Parenting Tip", text: "How do I manage stress as a new parent?" }
      ];

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`${mode === 'medical' ? 'bg-rose-600 shadow-rose-100' : 'bg-indigo-600 shadow-indigo-100'} p-3 rounded-2xl shadow-lg transition-colors`}>
            {mode === 'medical' ? <HeartPulse size={20} className="text-white" /> : <Bot size={20} className="text-white" />}
          </div>
          <div>
            <h3 className="font-black text-slate-800 tracking-tight">
              {mode === 'medical' ? 'Clinical Triage Engine' : 'Family Companion AI'}
            </h3>
            <p className="text-[10px] font-black text-slate-400 flex items-center gap-1 uppercase tracking-widest">
              <Sparkles size={10} className="text-indigo-500" /> Powered by Gemini 3 Pro
            </p>
          </div>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          <button 
            onClick={() => setMode('medical')}
            className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'medical' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}
          >
            Health
          </button>
          <button 
            onClick={() => setMode('general')}
            className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'general' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
          >
            General
          </button>
        </div>
      </div>

      <div className="bg-rose-50 px-6 py-2 flex items-center gap-2 border-b border-rose-100">
        <AlertCircle size={14} className="text-rose-600" />
        <p className="text-[9px] text-rose-700 font-black uppercase tracking-widest">
          AI Monitoring Active • Not a substitute for professional medical care
        </p>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-50/30"
      >
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                msg.role === 'user' ? 'bg-slate-900 text-white' : (mode === 'medical' ? 'bg-white text-rose-600 border border-rose-100' : 'bg-white text-indigo-600 border border-indigo-100')
              }`}>
                {msg.role === 'user' ? <User size={18} /> : (mode === 'medical' ? <HeartPulse size={18} /> : <Bot size={18} />)}
              </div>
              <div className={`p-5 rounded-[2rem] text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-100' 
                  : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'
              }`}>
                {msg.text}
                <p className="text-[8px] font-black opacity-50 mt-3 uppercase tracking-widest">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-pulse">
            <div className="flex gap-4 items-center">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center bg-white border border-slate-100 shadow-sm`}>
                <Loader2 size={18} className="text-indigo-600 animate-spin" />
              </div>
              <div className="bg-white border border-slate-100 px-6 py-3 rounded-[1.5rem] text-xs text-slate-400 font-black uppercase tracking-widest">
                Gemini Reasoning...
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-white border-t border-slate-100">
        <div className="flex flex-wrap gap-2 mb-4">
          {suggestions.map((s, i) => (
            <button 
              key={i}
              onClick={() => handleSend(s.text)}
              className="px-4 py-2 bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all flex items-center gap-2"
            >
              <MessageSquare size={12} /> {s.label}
            </button>
          ))}
        </div>
        <div className="relative flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={mode === 'medical' ? "Report symptoms (e.g., headache, vision)..." : "Ask about parenting or organization..."}
            className="flex-1 bg-slate-100 border-2 border-transparent rounded-[1.5rem] px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-0 focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className={`${mode === 'medical' ? 'bg-rose-600 shadow-rose-200' : 'bg-indigo-600 shadow-indigo-200'} text-white p-4 rounded-2xl transition-all shadow-xl active:scale-90 disabled:opacity-30 disabled:grayscale`}
          >
            <Send size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
