import React, { useState } from 'react';
import { 
  Users, 
  MapPin, 
  AlertCircle, 
  Phone, 
  ShieldAlert, 
  Activity, 
  ExternalLink,
  Loader2,
  Navigation,
  Search,
  Map as MapIcon,
  Clock,
  Navigation2,
  ChevronRight,
  Sparkles,
  PhoneCall,
  Satellite,
  Zap,
  Truck,
  Check,
  CalendarCheck
} from 'lucide-react';
import { trackEmergencyLocation } from '../services/geminiService';
import { PatientRecord, RiskLevel, Appointment } from '../types';

interface DoctorPortalProps {
  appointments: Appointment[];
  onUpdateAptStatus: (id: string, status: Appointment['status']) => void;
}

const DoctorPortal: React.FC<DoctorPortalProps> = ({ appointments, onUpdateAptStatus }) => {
  const [patients] = useState<PatientRecord[]>([
    { id: '1', name: 'Jane Cooper', weeks: 32, lastBp: '145/95', riskLevel: 'high', location: { lat: 34.0522, lng: -118.2437 }, lastUpdate: '10 mins ago', triageHistory: [] },
    { id: '2', name: 'Sarah Miller', weeks: 28, lastBp: '120/80', riskLevel: 'low', location: { lat: 34.0122, lng: -118.4912 }, lastUpdate: '2 hours ago', triageHistory: [] },
    { id: '3', name: 'Emily Davis', weeks: 35, lastBp: '138/88', riskLevel: 'medium', location: { lat: 34.0736, lng: -118.4004 }, lastUpdate: '1 hour ago', triageHistory: [] }
  ]);

  const [activePatient, setActivePatient] = useState<PatientRecord | null>(null);
  const [mapResult, setMapResult] = useState<{ text: string; links: any[] } | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const handleEmergencyTrack = async (patient: PatientRecord) => {
    setIsTracking(true);
    setActivePatient(patient);
    setMapResult(null);
    const result = await trackEmergencyLocation(patient.name, patient.location.lat, patient.location.lng);
    setMapResult(result);
    setIsTracking(false);
  };

  const getRiskStyles = (level: RiskLevel) => {
    switch (level) {
      case 'high': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
  };

  const pendingRequests = appointments.filter(a => a.status === 'pending');

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Emergency <span className="text-rose-600">Command</span></h2>
          <p className="text-slate-500 font-medium mt-1">Satellite tracking & hospital routing for high-risk maternal care</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Dispatches</span>
            <span className="text-2xl font-black text-indigo-600">02</span>
          </div>
          <div className="h-10 w-px bg-slate-100 mx-2"></div>
          <button className="bg-rose-600 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-rose-700 transition-all shadow-xl shadow-rose-100 active:scale-95">
            <Zap size={18} fill="currentColor" /> BROADCAST ALERT
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-4 space-y-6">
          {/* Pending Appointment Requests */}
          {pendingRequests.length > 0 && (
            <div className="bg-indigo-600 rounded-[2.5rem] p-6 shadow-xl border border-indigo-500 animate-in slide-in-from-left-4 duration-500">
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                    <CalendarCheck className="text-white" size={20} />
                    <h3 className="text-white font-black text-sm uppercase tracking-widest">Appointment Requests</h3>
                 </div>
                 <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-[10px] font-black">{pendingRequests.length} NEW</span>
              </div>
              <div className="space-y-3">
                {pendingRequests.map(req => (
                  <div key={req.id} className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                       <p className="text-white font-black text-xs">{req.patientName}</p>
                       <p className="text-white/60 text-[10px] font-bold">{req.date}</p>
                    </div>
                    <p className="text-white/80 text-[10px] font-medium italic">"{req.reason}"</p>
                    <div className="flex gap-2">
                       <button 
                         onClick={() => onUpdateAptStatus(req.id, 'approved')}
                         className="flex-1 bg-white text-indigo-600 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-colors"
                       >
                         Approve
                       </button>
                       <button 
                         onClick={() => onUpdateAptStatus(req.id, 'declined')}
                         className="px-3 bg-white/10 text-white/60 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10"
                       >
                         Decline
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
               <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Patient List</h3>
               <Search className="text-slate-400" size={16} />
            </div>
            
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto custom-scrollbar">
              {patients.map((p) => (
                <div 
                  key={p.id} 
                  onClick={() => { setActivePatient(p); if(p.riskLevel === 'high') handleEmergencyTrack(p); }}
                  className={`p-6 cursor-pointer transition-all relative ${activePatient?.id === p.id ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}
                >
                  {activePatient?.id === p.id && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-600"></div>}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm ${p.riskLevel === 'high' ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-100 text-slate-600'}`}>
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 leading-tight">{p.name}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.weeks}W Gestation</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border ${getRiskStyles(p.riskLevel)}`}>
                      {p.riskLevel}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEmergencyTrack(p); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${p.riskLevel === 'high' ? 'bg-rose-600 text-white shadow-lg shadow-rose-100' : 'bg-slate-900 text-white'}`}
                    >
                      <Truck size={14} /> LIVE TRACK
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="xl:col-span-8 flex flex-col gap-6">
          <div className="bg-slate-900 rounded-[3rem] p-1 shadow-2xl overflow-hidden min-h-[600px] flex flex-col relative">
            <div className="absolute top-8 left-8 right-8 z-10 flex items-center justify-between pointer-events-none">
              <div className="bg-slate-900/80 backdrop-blur-xl p-4 rounded-[1.5rem] border border-white/10 text-white shadow-2xl flex items-center gap-4 pointer-events-auto">
                <div className="bg-indigo-600 p-2 rounded-xl">
                  <Satellite size={20} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight">FamCare SAT-TRACK V3</h3>
                  <p className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em]">Signal: Verified GPS</p>
                </div>
              </div>
            </div>

            <div className="flex-1 bg-slate-950 relative overflow-hidden">
               {activePatient ? (
                 <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    src={`https://maps.google.com/maps?q=${activePatient.location.lat},${activePatient.location.lng}&t=k&z=16&output=embed`}
                    className="grayscale-[30%] contrast-[1.2] brightness-[0.8]"
                 ></iframe>
               ) : (
                 <div className="absolute inset-0 flex items-center justify-center flex-col text-center p-12">
                    <div className="bg-slate-900/50 p-10 rounded-full mb-8 border border-white/5 backdrop-blur-sm">
                       <MapIcon size={80} className="text-slate-800" />
                    </div>
                    <h4 className="text-slate-600 font-black text-2xl uppercase tracking-tighter">Satellite Offline</h4>
                    <p className="text-slate-700 max-w-sm mt-4 font-medium italic">Select a patient to initiate real-time surveillance.</p>
                 </div>
               )}
            </div>

            <div className={`transition-all duration-700 transform bg-slate-900/95 backdrop-blur-2xl border-t border-white/10 p-8 ${mapResult || isTracking ? 'translate-y-0 h-[350px]' : 'translate-y-full h-0'}`}>
               <div className="max-w-6xl mx-auto flex flex-col h-full">
                  <div className="flex items-center justify-between mb-8">
                     <div className="flex items-center gap-3">
                        <div className="bg-indigo-500/20 p-2 rounded-xl border border-indigo-500/30">
                           <Sparkles size={18} className="text-indigo-400" />
                        </div>
                        <div>
                           <h4 className="text-white font-black text-lg uppercase tracking-tighter">AI Dispatch Intelligence</h4>
                           <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Grounding: Google Maps Hospital Search</p>
                        </div>
                     </div>
                  </div>

                  {mapResult && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in slide-in-from-bottom-6 duration-700">
                       <div className="space-y-4">
                          <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] relative">
                             <p className="text-slate-300 text-sm leading-relaxed font-medium italic">
                                "{mapResult.text}"
                             </p>
                          </div>
                          <button className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-rose-900/40 hover:bg-rose-500 transition-all flex items-center justify-center gap-2 active:scale-95">
                             <PhoneCall size={18} fill="currentColor" /> ALERT NEAREST HOSPITAL
                          </button>
                       </div>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorPortal;
