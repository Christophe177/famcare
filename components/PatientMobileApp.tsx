import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Heart, 
  ShieldAlert, 
  Activity, 
  ChevronLeft, 
  Sparkles,
  Loader2,
  Monitor,
  Calendar,
  User,
  Mic,
  Plus,
  CheckCircle2,
  Stethoscope,
  Info,
  X,
  MapPin,
  Building2,
  Navigation,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Clock,
  History,
  XCircle,
  CalendarDays
} from 'lucide-react';
import { getPatientRiskAssessment, TriageResult, connectToLiveCare, trackEmergencyLocation, encodeAudio, decodeAudio, decodeAudioData } from '../services/geminiService';
import { Message, RiskLevel, Appointment } from '../types';

interface PatientMobileAppProps {
  onExit: () => void;
  appointments: Appointment[];
  onBookAppointment: (apt: Appointment) => void;
}

const SYMPTOMS_LIST = [
  "Nausea", "Headache", "Swelling", "Reduced Movement", "Cramping", 
  "Dizziness", "Back Pain", "Fatigue", "Heartburn", "Insomnia"
];

const PatientMobileApp: React.FC<PatientMobileAppProps> = ({ onExit, appointments, onBookAppointment }) => {
  // Navigation State
  const [hasSelectedHospital, setHasSelectedHospital] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  const [nearbyHospitals, setNearbyHospitals] = useState<any[]>([]);
  const [isHospitalLoading, setIsHospitalLoading] = useState(false);

  // App State
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hello Jane, I'm your FamCare AI Assistant. Please select any symptoms you're experiencing or type how you feel below.", timestamp: new Date(), riskUpdate: 'low' }
  ]);
  const [input, setInput] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentRisk, setCurrentRisk] = useState<RiskLevel>('low');
  const [actionHint, setActionHint] = useState('Everything looks normal. Keep tracking your baby\'s movement.');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'health' | 'appointments'>('chat');
  
  // Booking Form State
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('09:00 AM');
  const [bookingReason, setBookingReason] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const liveSessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    fetchHospitals();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeTab, hasSelectedHospital]);

  const fetchHospitals = async () => {
    setIsHospitalLoading(true);
    try {
      const result = await trackEmergencyLocation("Jane Cooper", 34.0522, -118.2437);
      const hospitals = result.links.filter(l => l.maps).map(l => l.maps);
      setNearbyHospitals(hospitals);
    } catch (err) {
      console.error("Failed to fetch hospitals:", err);
    } finally {
      setIsHospitalLoading(false);
    }
  };

  const selectHospital = (hospital: any) => {
    setSelectedHospital(hospital);
    setHasSelectedHospital(true);
    setMessages(prev => [...prev, {
      role: 'model',
      text: `Great, I've grounded your session to ${hospital.title}. All triage data will be synced with their maternity unit. How are you feeling right now?`,
      timestamp: new Date()
    }]);
  };

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom) 
        : [...prev, symptom]
    );
  };

  const handleSend = async () => {
    if ((!input.trim() && selectedSymptoms.length === 0) || isLoading) return;

    const symptomsText = selectedSymptoms.length > 0 ? `[Symptoms: ${selectedSymptoms.join(', ')}] ` : '';
    const fullMessage = symptomsText + input;
    
    const userMsg: Message = { role: 'user', text: fullMessage, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSelectedSymptoms([]);
    setIsLoading(true);

    try {
      const history = messages.slice(-5).map(m => `${m.role}: ${m.text}`).join('\n');
      const result: TriageResult = await getPatientRiskAssessment(fullMessage, history);
      
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: result.advice, 
        timestamp: new Date(),
        riskUpdate: result.riskLevel as RiskLevel
      }]);

      setCurrentRisk(result.riskLevel as RiskLevel);
      setActionHint(result.recommendedAction);
    } catch (err) {
      console.error("Chat Error:", err);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: "I'm having a bit of trouble connecting to the medical engine. Please try again or contact your clinic.", 
        timestamp: new Date() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startLiveVoice = async () => {
    try {
      setIsLiveActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputAudioCtx;

      const sessionPromise = connectToLiveCare({
        onopen: () => {
          const source = inputAudioCtx.createMediaStreamSource(stream);
          const processor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
          processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const int16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              int16[i] = inputData[i] * 32768;
            }
            sessionPromise.then(session => {
              session.sendRealtimeInput({
                media: {
                  data: encodeAudio(new Uint8Array(int16.buffer)),
                  mimeType: 'audio/pcm;rate=16000'
                }
              });
            });
          };
          source.connect(processor);
          processor.connect(inputAudioCtx.destination);
        },
        onmessage: async (message: any) => {
          const parts = message.serverContent?.modelTurn?.parts || [];
          for (const part of parts) {
            const base64Audio = part.inlineData?.data;
            if (base64Audio) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioCtx.currentTime);
              const buffer = await decodeAudioData(decodeAudio(base64Audio), outputAudioCtx, 24000, 1);
              const source = outputAudioCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputAudioCtx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }
          }
        },
        onclose: () => setIsLiveActive(false),
        onerror: (e: any) => {
          console.error(e);
          setIsLiveActive(false);
        }
      });

      liveSessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setIsLiveActive(false);
    }
  };

  const stopLiveVoice = () => {
    if (liveSessionRef.current) {
      liveSessionRef.current.close();
      liveSessionRef.current = null;
    }
    setIsLiveActive(false);
    setIsVoiceMode(false);
  };

  const submitAppointment = () => {
    if (!bookingDate || !bookingReason) return;
    const newApt: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      patientId: 'p1',
      patientName: 'Jane Cooper',
      date: bookingDate,
      time: bookingTime,
      reason: bookingReason,
      status: 'pending',
      timestamp: new Date()
    };
    onBookAppointment(newApt);
    setShowBookingForm(false);
    setBookingReason('');
    setMessages(prev => [...prev, {
      role: 'model',
      text: `Your appointment request for ${bookingDate} at ${bookingTime} has been sent to Dr. Thompson. You'll be notified as soon as it's approved.`,
      timestamp: new Date()
    }]);
    setActiveTab('chat');
  };

  const getRiskColor = (level: RiskLevel) => {
    switch(level) {
      case 'high': return 'bg-rose-500';
      case 'medium': return 'bg-amber-500';
      default: return 'bg-emerald-500';
    }
  };

  if (!hasSelectedHospital) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-6 overflow-hidden relative">
        <div className="absolute top-6 left-6 z-[100]">
          <button onClick={onExit} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-full border border-white/10 text-white transition-all">
            <Monitor size={16} className="text-rose-400" />
            <span className="text-xs font-black uppercase tracking-widest">Dashboard</span>
          </button>
        </div>

        <div className="w-full max-w-[380px] h-[800px] bg-white rounded-[3.5rem] shadow-[0_0_100px_rgba(244,63,94,0.15)] border-[12px] border-slate-900 overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-500">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-900 rounded-b-3xl z-50 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-800 mr-2"></div>
            <div className="w-10 h-1 bg-slate-800 rounded-full"></div>
          </div>

          <div className="flex-1 flex flex-col pt-16 px-8 overflow-y-auto custom-scrollbar">
            <div className="mb-8">
               <div className="w-16 h-16 bg-rose-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-rose-100">
                  <MapPin className="text-white" size={32} />
               </div>
               <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-tight mb-2">Emergency Grounding</h2>
               <p className="text-sm text-slate-500 font-medium">Please select your primary care center before proceeding.</p>
            </div>

            <div className="space-y-4 mb-8">
              {isHospitalLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <Loader2 size={40} className="animate-spin text-rose-600" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Scanning Satellite Grid...</p>
                </div>
              ) : (
                nearbyHospitals.map((hospital, i) => (
                  <button
                    key={i}
                    onClick={() => selectHospital(hospital)}
                    className="w-full text-left p-5 bg-slate-50 border border-slate-200 rounded-[2rem] hover:bg-rose-50 hover:border-rose-300 transition-all group flex items-start gap-4"
                  >
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 group-hover:text-rose-600">
                       <Building2 size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                       <h4 className="font-black text-slate-800 tracking-tight truncate">{hospital.title}</h4>
                       <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Grounded Facility</p>
                       <div className="flex items-center gap-2 mt-3 text-slate-400 group-hover:text-rose-500 transition-colors">
                          <span className="text-[10px] font-bold">SELECT FACILITY</span>
                          <ArrowRight size={12} />
                       </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'approved': return { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <CheckCircle2 size={16} /> };
      case 'declined': return { color: 'text-rose-600', bg: 'bg-rose-50', icon: <XCircle size={16} /> };
      default: return { color: 'text-amber-600', bg: 'bg-amber-50', icon: <Clock size={16} className="animate-pulse" /> };
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-6 overflow-hidden relative">
      <div className="absolute top-6 left-6 z-[100]">
        <button onClick={onExit} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-xl px-5 py-2.5 rounded-full border border-white/10 text-white transition-all group">
          <Monitor size={16} className="text-rose-400" />
          <span className="text-xs font-black uppercase tracking-widest">Dashboard</span>
        </button>
      </div>

      <div className="w-full max-w-[380px] h-[800px] bg-white rounded-[3.5rem] shadow-[0_0_100px_rgba(244,63,94,0.15)] border-[12px] border-slate-900 overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-500">
        <header className="pt-12 pb-5 px-6 bg-rose-600 text-white relative shrink-0">
          <div className="flex items-center justify-between mb-4">
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><ChevronLeft size={20} /></button>
            <h1 className="font-black text-lg tracking-tight flex items-center gap-2">
              FamCare <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded-full uppercase">Live</span>
            </h1>
            <ShieldCheck size={18} className="text-rose-200" />
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black uppercase tracking-widest opacity-80 flex items-center gap-2">
                 <Building2 size={10} /> {selectedHospital?.title}
              </span>
              <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${getRiskColor(currentRisk)}`}>
                {currentRisk}
              </div>
            </div>
            <p className="text-[11px] leading-relaxed font-medium">"{actionHint}"</p>
          </div>
        </header>

        <div className="flex bg-slate-100 p-1 mx-6 mt-4 rounded-2xl border border-slate-200 shrink-0">
          <button onClick={() => setActiveTab('chat')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-tighter transition-all ${activeTab === 'chat' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}>
            <Sparkles size={14} /> Care Chat
          </button>
          <button onClick={() => setActiveTab('health')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-tighter transition-all ${activeTab === 'health' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}>
            <Stethoscope size={14} /> Symptoms
          </button>
          <button onClick={() => setActiveTab('appointments')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-tighter transition-all ${activeTab === 'appointments' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}>
            <CalendarDays size={14} /> Book
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col pt-4">
          {activeTab === 'chat' && (
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-white custom-scrollbar">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                  <div className={`max-w-[88%] p-4 rounded-[1.5rem] text-sm shadow-sm ${msg.role === 'user' ? 'bg-rose-600 text-white rounded-br-none shadow-rose-100' : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-rose-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Analyzing...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'health' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white custom-scrollbar">
               <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tighter mb-2">Track Symptoms</h3>
                  <p className="text-xs text-slate-500 font-medium">Select indicators to update your health chart.</p>
               </div>
               <div className="grid grid-cols-2 gap-3">
                  {SYMPTOMS_LIST.map((symptom) => (
                    <button key={symptom} onClick={() => toggleSymptom(symptom)} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedSymptoms.includes(symptom) ? 'bg-rose-50 border-rose-300 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                      <span className={`text-xs font-bold ${selectedSymptoms.includes(symptom) ? 'text-rose-700' : ''}`}>{symptom}</span>
                      {selectedSymptoms.includes(symptom) ? <CheckCircle2 size={16} className="text-rose-600" /> : <Plus size={16} className="text-slate-300" />}
                    </button>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white custom-scrollbar">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900 tracking-tighter">Appointments</h3>
                {!showBookingForm && (
                  <button onClick={() => setShowBookingForm(true)} className="bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-rose-100">Request Slot</button>
                )}
              </div>

              {showBookingForm ? (
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Book New Slot</h4>
                    <button onClick={() => setShowBookingForm(false)} className="text-slate-400 p-1"><X size={16} /></button>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Preferred Date</label>
                    <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Preferred Time</label>
                    <select value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20">
                      <option>09:00 AM</option><option>10:00 AM</option><option>11:00 AM</option>
                      <option>01:00 PM</option><option>02:00 PM</option><option>03:00 PM</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Reason for Visit</label>
                    <textarea value={bookingReason} onChange={(e) => setBookingReason(e.target.value)} placeholder="e.g. Regular ultrasound check..." className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/20" />
                  </div>
                  <button onClick={submitAppointment} className="w-full bg-rose-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-100 transition-all active:scale-95">Send Request</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {appointments.filter(a => a.patientId === 'p1').map((apt) => {
                    const statusInfo = getStatusDisplay(apt.status);
                    return (
                      <div key={apt.id} className="bg-white border border-slate-100 p-4 rounded-[1.5rem] flex items-center justify-between shadow-sm group hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${statusInfo.bg} ${statusInfo.color}`}>
                            {statusInfo.icon}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800 tracking-tight">{apt.date}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{apt.time}</p>
                          </div>
                        </div>
                        <div className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${statusInfo.bg} ${statusInfo.color}`}>
                          {apt.status}
                        </div>
                      </div>
                    );
                  })}
                  {appointments.filter(a => a.patientId === 'p1').length === 0 && (
                    <div className="text-center py-20 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                      <History size={40} className="mx-auto text-slate-200 mb-3" />
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No history yet</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {activeTab === 'chat' && (
          <div className="p-4 bg-white border-t border-slate-100 pb-10 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] shrink-0">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <button onClick={() => { setIsVoiceMode(true); startLiveVoice(); }} className="bg-slate-100 text-rose-600 p-4 rounded-2xl transition-colors"><Mic size={20} /></button>
                <div className="flex-1 bg-slate-100 rounded-2xl px-5 py-3.5 flex items-center gap-2">
                  <Sparkles size={16} className="text-rose-400" />
                  <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask Gemini health questions..." className="bg-transparent border-none outline-none w-full text-sm font-medium text-slate-800" />
                </div>
                <button onClick={handleSend} disabled={isLoading || (!input.trim() && selectedSymptoms.length === 0)} className="bg-rose-600 text-white p-4 rounded-2xl shadow-lg shadow-rose-200 disabled:opacity-50"><Send size={20} /></button>
              </div>
            </div>
          </div>
        )}

        <div className="h-16 bg-white border-t border-slate-100 flex items-center justify-around px-8 shadow-inner shrink-0">
           <button onClick={() => setActiveTab('chat')} className={`p-3 transition-colors ${activeTab === 'chat' ? 'text-rose-600' : 'text-slate-300'}`}><Plus size={22} /></button>
           <button onClick={() => setActiveTab('health')} className={`p-3 transition-colors ${activeTab === 'health' ? 'text-rose-600' : 'text-slate-300'}`}><Activity size={22} /></button>
           <button onClick={() => setActiveTab('appointments')} className={`p-3 transition-colors ${activeTab === 'appointments' ? 'text-rose-600' : 'text-slate-300'}`}><CalendarDays size={22} /></button>
           <button className="p-3 text-slate-300"><User size={22} /></button>
        </div>
      </div>
    </div>
  );
};

export default PatientMobileApp;
