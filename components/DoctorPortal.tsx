
import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Sparkles, 
  ShieldAlert, 
  Zap, 
  ArrowLeft, 
  Loader2, 
  Activity, 
  ChevronRight,
  MapPin,
  AlertTriangle,
  PhoneCall
} from 'lucide-react';
import { trackEmergencyLocation } from '../services/geminiService';
import { PatientRecord, RiskLevel, Appointment } from '../types';

interface DoctorPortalProps {
  patients: PatientRecord[];
  appointments: Appointment[];
  onUpdateAptStatus: (id: string, status: Appointment['status']) => void;
  onBack: () => void;
}

const DoctorPortal: React.FC<DoctorPortalProps> = ({ patients, appointments, onUpdateAptStatus, onBack }) => {
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

  const handleBackToDirectory = () => {
    setActivePatient(null);
    setMapResult(null);
  };

  const highRiskPatients = patients.filter(p => p.riskLevel === 'high');

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Enhanced Navigation Header */}
      <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <button 
          onClick={onBack}
          className="flex items-center gap-3 px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-95"
        >
          <ArrowLeft size={16} strokeWidth={3} />
          Exit Portal
        </button>

        {activePatient ? (
          <div className="flex items-center gap-4">
             <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Observing Patient</p>
                <p className="text-base font-black text-slate-900 leading-none mt-1.5">{activePatient.name}</p>
             </div>
             <button onClick={handleBackToDirectory} className="text-[10px] font-black uppercase text-rose-600 bg-rose-50 px-5 py-2.5 rounded-xl border border-rose-100 hover:bg-rose-100 transition-all">Clear Selection</button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${highRiskPatients.length > 0 ? 'bg-rose-600 animate-pulse' : 'bg-emerald-500'}`}></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {highRiskPatients.length > 0 ? `${highRiskPatients.length} CRITICAL ALERTS ACTIVE` : 'Rwanda Medical Grid Synchronized'}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Patient Directory Sidebar */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden min-h-[400px]">
             <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                <Sparkles size={120} />
             </div>
             <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-6">AI Live Triage Hub</h3>
             <div className="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                {patients.flatMap(p => p.triageHistory.map((h, i) => ({ ...h, patientName: p.name, patientRisk: p.riskLevel }))).slice(0, 8).map((triage, i) => (
                  <div key={i} className={`p-4 rounded-2xl border transition-all ${triage.patientRisk === 'high' ? 'bg-rose-500/10 border-rose-500/20 shadow-[0_0_20px_rgba(225,29,72,0.1)]' : 'bg-white/5 border-white/10'}`}>
                     <div className="flex items-center justify-between mb-2">
                        <p className="text-white font-black text-xs">{triage.patientName}</p>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${triage.patientRisk === 'high' ? 'bg-rose-600 text-white animate-pulse' : triage.patientRisk === 'medium' ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'}`}>
                          {triage.patientRisk} Risk
                        </span>
                     </div>
                     <p className="text-[11px] text-slate-400 italic">"{triage.text}"</p>
                     <p className="text-[8px] text-slate-600 font-mono mt-2 uppercase tracking-widest">Grounded: {triage.timestamp.toLocaleTimeString()}</p>
                  </div>
                ))}
             </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
               <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Patient List</h3>
               <Search className="text-slate-400" size={18} />
            </div>
            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto custom-scrollbar">
              {patients.map((p) => (
                <div key={p.id} onClick={() => { setActivePatient(p); if(p.riskLevel === 'high') handleEmergencyTrack(p); }} className={`p-6 cursor-pointer transition-all ${activePatient?.id === p.id ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm ${p.riskLevel === 'high' ? 'bg-rose-600 text-white animate-pulse shadow-lg' : 'bg-slate-100 text-slate-600'}`}>
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900">{p.name}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.weeks}W Gestation</p>
                      </div>
                    </div>
                    {p.riskLevel === 'high' && <AlertTriangle className="text-rose-500 animate-pulse" size={16} />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Satellite Tracking Area */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          {activePatient && activePatient.riskLevel === 'high' && (
             <div className="bg-rose-600 text-white p-6 rounded-[2rem] shadow-xl flex items-center justify-between animate-in slide-in-from-top-4">
                <div className="flex items-center gap-4">
                   <div className="bg-white/20 p-3 rounded-2xl">
                      <ShieldAlert size={28} className="animate-bounce" />
                   </div>
                   <div>
                      <h4 className="font-black text-lg leading-none uppercase tracking-tighter">Emergency Signal Active</h4>
                      <p className="text-[10px] font-bold opacity-80 mt-1 uppercase tracking-widest">AI Detection: Possible Preeclampsia or Preterm Event</p>
                   </div>
                </div>
                <div className="flex gap-2">
                   <button className="bg-white text-rose-600 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2">
                      <PhoneCall size={14} /> Contact Patient
                   </button>
                </div>
             </div>
          )}

          <div className="bg-slate-900 rounded-[3rem] p-1 shadow-2xl overflow-hidden min-h-[600px] flex flex-col relative border-[12px] border-slate-950">
            <div className="flex-1 bg-slate-950 relative overflow-hidden">
               {activePatient ? (
                 <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    src={`https://maps.google.com/maps?q=${activePatient.location.lat},${activePatient.location.lng}&t=k&z=16&output=embed`}
                    className="grayscale-[30%] contrast-[1.2] brightness-[0.8]"
                 ></iframe>
               ) : (
                 <div className="absolute inset-0 flex items-center justify-center flex-col text-center p-12">
                    <Zap size={80} className="text-slate-800 mb-6" />
                    <h4 className="text-slate-600 font-black text-2xl uppercase tracking-tighter leading-none">Global Mapping Offline</h4>
                    <p className="text-slate-700 max-w-sm mt-4 italic font-medium">Select a patient from the Rwandan registry to activate Gemini Satellite Link.</p>
                 </div>
               )}
            </div>

            <div className={`transition-all duration-700 transform bg-slate-900/95 backdrop-blur-3xl border-t border-white/10 p-10 ${mapResult || isTracking ? 'translate-y-0 h-[350px]' : 'translate-y-full h-0'}`}>
               <div className="max-w-6xl mx-auto">
                  {mapResult && (
                    <div className="space-y-8">
                       <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] relative">
                          <MapPin size={24} className="absolute -top-4 -left-4 text-emerald-500 bg-slate-900 rounded-full p-1" />
                          <p className="text-slate-300 text-sm leading-relaxed font-medium italic">"{mapResult.text}"</p>
                       </div>
                       <div className="flex gap-4">
                          <button className="flex-1 py-5 bg-rose-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-rose-500 transition-all active:scale-95 shadow-2xl shadow-rose-900/40">Dispatch Emergency Team</button>
                          <button className="flex-1 py-5 bg-white/10 text-white rounded-2xl font-black text-sm uppercase tracking-widest border border-white/10 hover:bg-white/20 transition-all">Verify Facilities</button>
                       </div>
                    </div>
                  )}
                  {isTracking && (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                       <Loader2 className="animate-spin text-indigo-500" size={48} />
                       <p className="text-white font-black uppercase tracking-widest text-[10px]">Gemini 2.5: Verifying Rwandan Medical Grid Coordinates...</p>
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
