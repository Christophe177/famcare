import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  ChevronLeft, 
  Sparkles,
  Loader2,
  Mic,
  Plus,
  MapPin,
  XCircle,
  User,
  Activity,
  Calendar,
  ChevronRight,
  Bot,
  Heart,
  PhoneCall,
  AlertTriangle,
  UserCircle,
  ArrowRight,
  CheckCircle2,
  Zap,
  Clock,
  ClipboardList,
  Smile,
  Meh,
  Frown,
  Flame,
  AlertCircle,
  ClipboardCheck,
  Stethoscope as DoctorIcon
} from 'lucide-react';
import { getPatientRiskAssessment, TriageResult, trackEmergencyLocation, connectToLiveCare, encodeAudio, decodeAudio, decodeAudioData } from '../services/geminiService';
import { Message, RiskLevel, Appointment, PatientRecord } from '../types';

interface PatientMobileAppProps {
  onExit: () => void;
  appointments: Appointment[];
  onBookAppointment: (apt: Appointment) => void;
  patientRecord: PatientRecord;
  onTriageUpdate: (risk: RiskLevel, message: Message) => void;
}

const SYMPTOMS_LIST = [
  "Nausea", "Headache", "Swelling", "Reduced Movement", "Cramping", 
  "Dizziness", "Back Pain", "Fatigue"
];

const PatientMobileApp: React.FC<PatientMobileAppProps> = ({ onExit, appointments, onBookAppointment, patientRecord, onTriageUpdate }) => {
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3>(1); 
  const [activeTab, setActiveTab] = useState<'chat' | 'health' | 'appointments'>('chat');
  
  const [tempProfile, setTempProfile] = useState({
    name: '',
    age: '',
    bloodType: 'A+',
    emergencyContact: '',
    weeks: ''
  });

  const [showBooking, setShowBooking] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkInStep, setCheckInStep] = useState<1 | 2 | 3>(1); 

  const [feelingScore, setFeelingScore] = useState<number | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [lastRiskResult, setLastRiskResult] = useState<RiskLevel | null>(null);
  const [isAnalyzingRisk, setIsAnalyzingRisk] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `Muraho! I'm your FamCare Assistant. Use the "Check-in" button to update your health status or chat with me anytime.`, timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [isLiveActive, setIsLiveActive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  const [nearbyHospitals, setNearbyHospitals] = useState<any[]>([]);
  const [isHospitalLoading, setIsHospitalLoading] = useState(false);

  const [bookDate, setBookDate] = useState('');
  const [bookTime, setBookTime] = useState('');
  const [bookReason, setBookReason] = useState('');

  useEffect(() => {
    fetchHospitals();
    return () => {
      if (sessionPromiseRef.current) sessionPromiseRef.current.then(s => s.close());
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const fetchHospitals = async () => {
    setIsHospitalLoading(true);
    try {
      const result = await trackEmergencyLocation('Patient', -1.9441, 30.0619);
      const hospitals = result.links.filter(l => l.maps).map(l => l.maps);
      setNearbyHospitals(hospitals.length > 0 ? hospitals : [
        {title: "CHUK (Centre Hospitalier Universitaire de Kigali)", uri: "#"}, 
        {title: "King Faisal Hospital", uri: "#"}
      ]);
    } catch (err) { console.error(err); }
    finally { setIsHospitalLoading(false); }
  };

  const handleSend = async (customMessage?: string) => {
    const textToSend = customMessage || input.trim();
    if (!textToSend) return;
    if (isLoading) return;

    const userMsg: Message = { role: 'user', text: textToSend, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.slice(-5).map(m => `${m.role}: ${m.text}`).join('\n');
      const patientContext = `Name: ${tempProfile.name}, Age: ${tempProfile.age}, Weeks: ${tempProfile.weeks}, Blood: ${tempProfile.bloodType}`;
      const result: TriageResult = await getPatientRiskAssessment(textToSend, history, patientContext);
      
      const aiResponse: Message = { 
        role: 'model', 
        text: result.advice, 
        timestamp: new Date(),
        riskUpdate: result.riskLevel as RiskLevel
      };

      setMessages(prev => [...prev, aiResponse]);
      setLastRiskResult(result.riskLevel as RiskLevel);
      onTriageUpdate(result.riskLevel as RiskLevel, aiResponse);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const submitCheckIn = async () => {
    setIsAnalyzingRisk(true);
    setCheckInStep(3);
    
    const symptomsText = selectedSymptoms.length > 0 ? `Symptoms: ${selectedSymptoms.join(', ')}` : 'No specific symptoms';
    const checkInSummary = `Health Check-in: I feel like a ${feelingScore}/10. ${symptomsText}.`;
    
    try {
      const patientContext = `Name: ${tempProfile.name}, Age: ${tempProfile.age}, Weeks: ${tempProfile.weeks}`;
      const result: TriageResult = await getPatientRiskAssessment(checkInSummary, "", patientContext);
      
      setLastRiskResult(result.riskLevel as RiskLevel);
      
      const reportMsg: Message = { role: 'user', text: checkInSummary, timestamp: new Date() };
      const aiMsg: Message = { role: 'model', text: result.advice, timestamp: new Date(), riskUpdate: result.riskLevel as RiskLevel };
      
      setMessages(prev => [...prev, reportMsg, aiMsg]);
      onTriageUpdate(result.riskLevel as RiskLevel, aiMsg);
    } catch (err) { console.error(err); }
    finally { setIsAnalyzingRisk(false); }
  };

  const startLiveCall = async () => {
    if (isLiveActive) {
      if (sessionPromiseRef.current) (await sessionPromiseRef.current).close();
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      setIsLiveActive(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      inputAudioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;
      sessionPromiseRef.current = connectToLiveCare({
        onopen: () => {
          const source = inputCtx.createMediaStreamSource(stream);
          const sp = inputCtx.createScriptProcessor(4096, 1, 1);
          sp.onaudioprocess = (e) => {
            const data = e.inputBuffer.getChannelData(0);
            const int16 = new Int16Array(data.length);
            for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
            sessionPromiseRef.current?.then(s => s.sendRealtimeInput({ media: { data: encodeAudio(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } }));
          };
          source.connect(sp); sp.connect(inputCtx.destination);
        },
        onmessage: async (m: any) => {
          const audioData = m.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (audioData) {
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
            const buf = await decodeAudioData(decodeAudio(audioData), outputCtx, 24000, 1);
            const src = outputCtx.createBufferSource(); src.buffer = buf; src.connect(outputCtx.destination);
            src.start(nextStartTimeRef.current); nextStartTimeRef.current += buf.duration;
          }
        },
        onclose: () => setIsLiveActive(false),
      });
      setIsLiveActive(true);
    } catch (e) { console.error(e); }
  };

  const handleBookAppointment = () => {
    if (!bookDate || !bookTime || !bookReason) return;
    onBookAppointment({
      id: Math.random().toString(36).substr(2, 9),
      patientId: 'p1', patientName: tempProfile.name || 'Mutoni Alice',
      date: bookDate, time: bookTime, reason: bookReason,
      status: 'pending', timestamp: new Date()
    });
    setShowBooking(false); setActiveTab('appointments');
  };

  const getScoreColor = (score: number) => {
    if (score <= 3) return 'bg-emerald-500';
    if (score <= 6) return 'bg-amber-500';
    if (score <= 8) return 'bg-orange-500';
    return 'bg-rose-600';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-6 overflow-hidden relative">
      <div className="w-full max-w-[380px] h-[800px] bg-white rounded-[3.5rem] border-[12px] border-slate-900 overflow-hidden flex flex-col relative shadow-[0_0_100px_rgba(0,0,0,0.5)]">
        
        {onboardingStep === 1 && (
          <div className="flex-1 flex flex-col p-8 pt-16 animate-in slide-in-from-right duration-300">
            <MapPin className="text-rose-600 mb-6" size={48} />
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-4 leading-tight">Facility Link</h2>
            <p className="text-sm text-slate-500 mb-8 font-medium">Select your nearest referral hospital.</p>
            <div className="space-y-4 overflow-y-auto flex-1 pb-10 custom-scrollbar pr-1">
              {isHospitalLoading ? <div className="flex flex-col items-center py-20 gap-4"><Loader2 className="animate-spin text-rose-600" size={32} /></div> : nearbyHospitals.map((h, i) => (
                <button key={i} onClick={() => {setSelectedHospital(h); setOnboardingStep(2);}} className="w-full text-left p-6 bg-slate-50 border border-slate-200 rounded-[2rem] hover:border-rose-300 transition-all flex items-center justify-between">
                   <h4 className="font-black text-slate-800 text-sm leading-tight">{h.title}</h4>
                   <ChevronRight className="text-slate-300" size={20} />
                </button>
              ))}
            </div>
          </div>
        )}

        {onboardingStep === 2 && (
          <div className="flex-1 flex flex-col p-8 pt-16 animate-in slide-in-from-right duration-300">
            <UserCircle className="text-indigo-600 mb-6" size={48} />
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-4 leading-tight">Patient Identity</h2>
            <div className="space-y-5 flex-1 overflow-y-auto pb-10 custom-scrollbar pr-1">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Legal Name</label>
                <input type="text" value={tempProfile.name} onChange={e => setTempProfile({...tempProfile, name: e.target.value})} placeholder="e.g. Mutoni Alice" className="w-full bg-slate-100 border-2 border-transparent rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Age</label>
                  <input type="number" value={tempProfile.age} onChange={e => setTempProfile({...tempProfile, age: e.target.value})} placeholder="Yrs" className="w-full bg-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:bg-white focus:border-indigo-500 border-2 border-transparent transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Weeks</label>
                  <input type="number" value={tempProfile.weeks} onChange={e => setTempProfile({...tempProfile, weeks: e.target.value})} placeholder="Wks" className="w-full bg-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:bg-white focus:border-indigo-500 border-2 border-transparent transition-all" />
                </div>
              </div>
              
              {/* Emergency phone visible only when age AND weeks are provided */}
              {tempProfile.age && tempProfile.weeks ? (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
                  <label className="text-[10px] font-black text-rose-600 uppercase tracking-widest px-2 flex items-center gap-2">
                    <AlertCircle size={10} /> Emergency Contact Phone
                  </label>
                  <input 
                    type="tel" 
                    value={tempProfile.emergencyContact} 
                    onChange={e => setTempProfile({...tempProfile, emergencyContact: e.target.value})} 
                    placeholder="+250 7XX XXX XXX" 
                    className="w-full bg-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none border-2 border-rose-100 focus:border-rose-500 focus:bg-white transition-all shadow-sm" 
                  />
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                   <p className="text-[10px] font-medium text-slate-400 italic text-center leading-relaxed">Please provide your age and pregnancy weeks to reveal emergency contact options.</p>
                </div>
              )}

              <button 
                onClick={() => setOnboardingStep(3)} 
                disabled={!tempProfile.name || !tempProfile.age || !tempProfile.weeks || !tempProfile.emergencyContact} 
                className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl mt-4 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all"
              >
                Complete Activation
              </button>
            </div>
          </div>
        )}

        {onboardingStep === 3 && (
          <>
            {showCheckIn && (
              <div className="absolute inset-0 z-[150] bg-slate-950/90 backdrop-blur-2xl p-8 flex flex-col justify-end animate-in slide-in-from-bottom-full duration-500">
                 <div className="bg-white rounded-[2.5rem] p-8 space-y-6 shadow-2xl relative">
                    <button onClick={() => {setShowCheckIn(false); setCheckInStep(1);}} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400"><XCircle size={24} /></button>
                    {checkInStep === 1 && (
                      <div className="animate-in fade-in slide-in-from-bottom-4">
                         <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-6">How do you feel?</h3>
                         <div className="grid grid-cols-5 gap-3">
                           {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                             <button key={score} onClick={() => setFeelingScore(score)} className={`flex flex-col items-center justify-center h-16 rounded-2xl transition-all ${feelingScore === score ? `${getScoreColor(score)} text-white scale-110 shadow-lg` : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                               <span className="text-xs font-black">{score}</span>
                             </button>
                           ))}
                         </div>
                         <button onClick={() => setCheckInStep(2)} disabled={feelingScore === null} className="w-full mt-8 py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest disabled:opacity-50">Next: Symptoms <ArrowRight className="inline ml-2" size={16} /></button>
                      </div>
                    )}
                    {checkInStep === 2 && (
                      <div className="animate-in fade-in slide-in-from-bottom-4">
                         <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-4">Any symptoms?</h3>
                         <div className="flex flex-wrap gap-2 mb-8">
                           {SYMPTOMS_LIST.map(s => (
                             <button key={s} onClick={() => {
                               setSelectedSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
                             }} className={`px-4 py-2 rounded-full text-[10px] font-black border transition-all ${selectedSymptoms.includes(s) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-500'}`}>
                               {s}
                             </button>
                           ))}
                         </div>
                         <button onClick={submitCheckIn} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3">
                            <Sparkles size={18} /> Analyze Health Risk
                         </button>
                      </div>
                    )}
                    {checkInStep === 3 && (
                      <div className="animate-in zoom-in duration-300 text-center py-6">
                         {isAnalyzingRisk ? (
                           <div className="space-y-4">
                              <Loader2 className="animate-spin text-indigo-600 mx-auto" size={48} />
                              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">AI Triage in Progress...</p>
                           </div>
                         ) : (
                           <div className="space-y-6">
                              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-white shadow-xl ${lastRiskResult === 'high' ? 'bg-rose-600 animate-pulse' : lastRiskResult === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                                <Activity size={40} />
                              </div>
                              <h3 className="text-2xl font-black text-slate-900 tracking-tighter capitalize">{lastRiskResult} Risk Detected</h3>
                              <button onClick={() => {setShowCheckIn(false); setCheckInStep(1);}} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Return to App</button>
                           </div>
                         )}
                      </div>
                    )}
                 </div>
              </div>
            )}

            {showBooking && (
              <div className="absolute inset-0 z-[140] bg-slate-950/90 backdrop-blur-2xl p-8 flex flex-col justify-end animate-in slide-in-from-bottom-full duration-500">
                 <div className="bg-white rounded-[2.5rem] p-8 space-y-4 shadow-2xl relative">
                    <button onClick={() => setShowBooking(false)} className="absolute top-6 right-6 p-2 text-slate-400"><XCircle size={24} /></button>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Schedule Visit</h3>
                    <input type="date" value={bookDate} onChange={e => setBookDate(e.target.value)} className="w-full bg-slate-50 rounded-2xl px-5 py-4 font-bold text-sm outline-none border border-slate-100" />
                    <input type="time" value={bookTime} onChange={e => setBookTime(e.target.value)} className="w-full bg-slate-50 rounded-2xl px-5 py-4 font-bold text-sm outline-none border border-slate-100" />
                    <textarea placeholder="Reason..." value={bookReason} onChange={e => setBookReason(e.target.value)} className="w-full bg-slate-50 rounded-2xl px-5 py-4 font-bold text-sm outline-none border border-slate-100 h-24 resize-none" />
                    <button onClick={handleBookAppointment} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95">Confirm Appointment</button>
                 </div>
              </div>
            )}

            {showSOS && (
              <div className="absolute inset-0 z-[200] bg-rose-950/95 backdrop-blur-2xl p-8 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
                 <div className="w-24 h-24 bg-rose-600 rounded-full flex items-center justify-center mb-8 animate-pulse shadow-2xl shadow-rose-600/50"><AlertTriangle size={48} className="text-white" /></div>
                 <h2 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">SOS</h2>
                 <p className="text-rose-200 text-sm mb-12">Sending emergency coordinates to {selectedHospital?.title} and your emergency contact.</p>
                 <button onClick={() => window.open(`tel:${tempProfile.emergencyContact}`)} className="w-full bg-white text-rose-900 py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 mb-4"><PhoneCall size={18} /> Call Contact</button>
                 <button onClick={() => setShowSOS(false)} className="text-rose-300 font-bold">Cancel</button>
              </div>
            )}

            <header className="pt-12 pb-5 px-6 bg-indigo-600 text-white shrink-0 shadow-lg relative z-50">
              <div className="flex items-center justify-between mb-4">
                <button onClick={onExit} className="p-2 -ml-2 hover:bg-white/10 rounded-full"><ChevronLeft size={24} /></button>
                <div className="flex flex-col items-center">
                  <h1 className="font-black text-lg tracking-tight">FamCare</h1>
                  {lastRiskResult && (
                    <div className={`flex items-center gap-1.5 px-3 py-0.5 rounded-full mt-1 ${lastRiskResult === 'high' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}>
                      <AlertCircle size={10} className="text-white" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-white">Risk: {lastRiskResult}</span>
                    </div>
                  )}
                </div>
                <button onClick={() => setShowSOS(true)} className="bg-rose-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95">SOS</button>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center"><DoctorIcon size={16} /></div>
                   <p className="text-[11px] font-bold leading-tight text-white/90 truncate max-w-[150px]">{selectedHospital?.title}</p>
                </div>
                <button onClick={() => setShowCheckIn(true)} className="bg-white text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-50 flex items-center gap-2 transition-all">
                   <ClipboardCheck size={14} /> Check-In
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-hidden relative flex flex-col bg-slate-50">
              {activeTab === 'chat' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                     {messages.map((msg, i) => (
                       <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                         <div className={`max-w-[85%] p-4 rounded-[2rem] text-sm shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'}`}>
                           {msg.text}
                         </div>
                       </div>
                     ))}
                     {isLoading && <div className="flex justify-start"><div className="bg-white border p-4 rounded-[2rem] rounded-tl-none flex items-center gap-2"><Loader2 className="animate-spin text-indigo-600" size={16} /><span className="text-[10px] font-black text-slate-400 uppercase">Analyzing...</span></div></div>}
                  </div>
                  <div className="p-4 bg-white border-t flex items-center gap-2 shadow-2xl">
                    <button onClick={startLiveCall} className={`p-4 rounded-2xl transition-all ${isLiveActive ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-400'}`}><Mic size={24} /></button>
                    <div className="flex-1 bg-slate-100 rounded-2xl px-5 py-4 flex items-center gap-2 border-2 border-slate-100 focus-within:border-indigo-500 focus-within:bg-white transition-all shadow-inner">
                      <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask AI Assistant..." className="flex-1 bg-transparent text-sm font-black text-slate-900 outline-none" />
                    </div>
                    <button onClick={() => handleSend()} disabled={isLoading} className="bg-indigo-600 text-white p-4 rounded-2xl shadow-xl shadow-indigo-200 active:scale-95 disabled:opacity-50 transition-all"><Send size={24} /></button>
                  </div>
                </div>
              )}
              {activeTab === 'health' && (
                <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-white">
                   <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Vitals Monitor</h3>
                   <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white relative shadow-2xl overflow-hidden">
                      <Zap size={100} className="absolute -right-8 -top-8 text-white opacity-5" />
                      <h4 className="font-black text-lg mb-1">{tempProfile.name || 'Mutoni Alice'}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Age {tempProfile.age || '28'} • Week {tempProfile.weeks || '32'}</p>
                      {lastRiskResult && (
                         <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Current Risk Analysis</p>
                            <div className="flex items-center gap-3">
                               <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${lastRiskResult === 'high' ? 'bg-rose-600' : lastRiskResult === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                                 {lastRiskResult} Risk
                               </div>
                               <p className="text-[10px] text-slate-400 font-medium italic">Verified by AI</p>
                            </div>
                         </div>
                      )}
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                           <span className="text-[8px] font-black uppercase text-slate-500 block mb-1">Blood Type</span>
                           <span className="text-sm font-black">{tempProfile.bloodType}</span>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                           <span className="text-[8px] font-black uppercase text-slate-500 block mb-1">Emergency</span>
                           <span className="text-[10px] font-black truncate block">{tempProfile.emergencyContact || 'Not Set'}</span>
                        </div>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-indigo-50 p-6 rounded-[2.5rem] border border-indigo-100 text-center">
                         <Heart size={32} className="text-indigo-600 mx-auto mb-3" />
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">BP</span>
                         <span className="text-lg font-black text-slate-800">120/80</span>
                      </div>
                      <div className="bg-emerald-50 p-6 rounded-[2.5rem] border border-emerald-100 text-center">
                         <Activity size={32} className="text-emerald-500 mx-auto mb-3" />
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Fetal</span>
                         <span className="text-lg font-black text-slate-800">Normal</span>
                      </div>
                   </div>
                </div>
              )}
              {activeTab === 'appointments' && (
                <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-white">
                   <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Agenda</h3>
                      <button onClick={() => setShowBooking(true)} className="bg-indigo-600 text-white p-4 rounded-2xl shadow-xl active:scale-90 transition-all"><Plus size={20} /></button>
                   </div>
                   <div className="space-y-4">
                      {appointments.length > 0 ? appointments.map(apt => (
                        <div key={apt.id} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white rounded-2xl flex flex-col items-center justify-center border border-slate-200">
                                 <span className="text-[10px] font-black text-indigo-600 uppercase leading-none">{apt.date.split('-')[1]}</span>
                                 <span className="text-sm font-black text-slate-800 leading-none mt-1">{apt.date.split('-')[2]}</span>
                              </div>
                              <div>
                                 <h4 className="font-black text-slate-800 text-sm leading-tight">{apt.reason}</h4>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{apt.time}</p>
                              </div>
                           </div>
                           <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${apt.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{apt.status}</div>
                        </div>
                      )) : <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200"><Calendar size={48} className="mx-auto text-slate-200 mb-4" /><p className="text-xs font-black text-slate-400 uppercase">No visits scheduled</p></div>}
                   </div>
                </div>
              )}
            </div>

            <nav className="h-24 bg-white border-t flex items-center justify-around px-8 shrink-0 pb-8 relative z-50">
               <button onClick={() => setActiveTab('chat')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'chat' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}><Bot size={28} /><span className="text-[9px] font-black uppercase tracking-widest">AI Care</span></button>
               <button onClick={() => setActiveTab('health')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'health' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}><Activity size={28} /><span className="text-[9px] font-black uppercase tracking-widest">Monitor</span></button>
               <button onClick={() => setActiveTab('appointments')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'appointments' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}><Calendar size={28} /><span className="text-[9px] font-black uppercase tracking-widest">Agenda</span></button>
            </nav>
          </>
        )}
      </div>
    </div>
  );
};

export default PatientMobileApp;