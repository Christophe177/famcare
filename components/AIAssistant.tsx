import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, HeartPulse, AlertCircle } from 'lucide-react';
import { getPatientRiskAssessment, getFamilyAdvice } from '../services/geminiService';
import { Message } from '../types';

const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Hello! I am your FamCare AI Health Assistant. I am here to support you during your pregnancy journey. How are you feeling today?', timestamp: new Date() }
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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      let responseText: string;
      if (mode === 'medical') {
        const history = messages.slice(-5).map(m => `${m.role}: ${m.text}`).join('\n');
        const result = await getPatientRiskAssessment(input, history);
        responseText = result.advice;
      } else {
        responseText = await getFamilyAdvice(input);
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

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`${mode === 'medical' ? 'bg-rose-600' : 'bg-indigo-600'} p-2 rounded-lg transition-colors`}>
            {mode === 'medical' ? <HeartPulse size={20} className="text-white" /> : <Bot size={20} className="text-white" />}
          </div>
          <div>
            <h3 className="font-bold text-slate-800">
              {mode === 'medical' ? 'Patient Health Support' : 'FamCare Assistant'}
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Sparkles size={10} className="text-indigo-500" /> AI Engine Active
            </p>
          </div>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setMode('medical')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${mode === 'medical' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
          >
            Health Mode
          </button>
          <button 
            onClick={() => setMode('general')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${mode === 'general' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
          >
            General
          </button>
        </div>
      </div>

      <div className="bg-rose-50 px-4 py-2 flex items-center gap-2 border-b border-rose-100">
        <AlertCircle size={14} className="text-rose-600" />
        <p className="text-[10px] text-rose-700 font-medium uppercase tracking-wider">
          AI is for support only. In emergencies, call 911 or your OBGYN immediately.
        </p>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
      >
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-slate-200' : (mode === 'medical' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600')
              }`}>
                {msg.role === 'user' ? <User size={16} /> : (mode === 'medical' ? <HeartPulse size={16} /> : <Bot size={16} />)}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-slate-800 text-white rounded-tr-none shadow-indigo-100/50 shadow-lg' 
                  : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
              }`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 items-center">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${mode === 'medical' ? 'bg-rose-100' : 'bg-indigo-100'}`}>
                <Loader2 size={16} className={`${mode === 'medical' ? 'text-rose-600' : 'text-indigo-600'} animate-spin`} />
              </div>
              <div className="bg-slate-50 px-4 py-2 rounded-xl text-sm text-slate-400 italic">
                {mode === 'medical' ? 'Analyzing medical context...' : 'Thinking...'}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex flex-wrap gap-2 mb-3">
          <button onClick={() => setInput("I have a severe headache")} className="px-3 py-1 bg-slate-50 text-slate-600 text-[10px] font-bold rounded-full border border-slate-200 hover:border-rose-300 transition-colors">Headache</button>
          <button onClick={() => setInput("Swelling in my ankles")} className="px-3 py-1 bg-slate-50 text-slate-600 text-[10px] font-bold rounded-full border border-slate-200 hover:border-rose-300 transition-colors">Swelling</button>
          <button onClick={() => setInput("Decreased baby movement")} className="px-3 py-1 bg-slate-50 text-slate-600 text-[10px] font-bold rounded-full border border-slate-200 hover:border-rose-300 transition-colors">Kick Count</button>
        </div>
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={mode === 'medical' ? "Describe your symptoms or ask a health question..." : "Ask anything about family management..."}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className={`${mode === 'medical' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-100' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'} text-white p-3 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
