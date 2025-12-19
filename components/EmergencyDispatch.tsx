
import React, { useState, useEffect, useRef } from 'react';
import { 
  Map as MapIcon, 
  Satellite, 
  ShieldAlert, 
  PhoneCall, 
  Zap, 
  Loader2, 
  Sparkles, 
  ExternalLink,
  AlertCircle,
  Truck,
  ChevronRight,
  MapPin,
  Activity,
  Signal,
  ArrowRight
} from 'lucide-react';
import { trackEmergencyLocation } from '../services/geminiService';
import { PatientRecord } from '../types';

const EmergencyDispatch: React.FC = () => {
  const [patients, setPatients] = useState<PatientRecord[]>([
    { id: '1', name: 'Jane Cooper', weeks: 32, lastBp: '145/95', riskLevel: 'high', location: { lat: 34.0522, lng: -118.2437 }, lastUpdate: '10 mins ago', triageHistory: [] },
    { id: '3', name: 'Emily Davis', weeks: 35, lastBp: '138/88', riskLevel: 'medium', location: { lat: 34.0736, lng: -118.4004 }, lastUpdate: '1 hour ago', triageHistory: [] },
    { id: '4', name: 'Sofia Rodriguez', weeks: 38, lastBp: '150/100', riskLevel: 'high', location: { lat: 33.9416, lng: -118.4085 }, lastUpdate: 'Just now', triageHistory: [] }
  ]);

  const [activePatient, setActivePatient] = useState<PatientRecord | null>(patients.find(p => p.riskLevel === 'high') || null);
  const [mapResult, setMapResult] = useState<{ text: string; links: any[] } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isLiveSimulating, setIsLiveSimulating] = useState(false);
  const [simCoords, setSimCoords] = useState<{lat: number, lng: number} | null>(activePatient?.location || null);
  const [logs, setLogs] = useState<string[]>(["System initialized.", "Awaiting signal..."]);

  const simulationRef = useRef<number | null>(null);

  // Handle Simulation movement
  useEffect(() => {
    if (isLiveSimulating && activePatient) {
      simulationRef.current = window.setInterval(() => {
        setSimCoords(prev => {
          if (!prev) return prev;
          // Slowly move the coordinates North-West
          return {
            lat: prev.lat + 0.0002,
            lng: prev.lng - 0.0002
          };
        });
      }, 2000);
      addLog(`Tracking sequence initiated for ${activePatient.name}`);
    } else {
      if (simulationRef.current) clearInterval(simulationRef.current);
    }
    return () => {
      if (simulationRef.current) clearInterval(simulationRef.current);
    };
  }, [isLiveSimulating, activePatient?.id]);

  // Periodic Grounding Call (Every 15s during simulation)
  useEffect(() => {
    let groundingInterval: number | null = null;
    if (isLiveSimulating && activePatient && simCoords) {
      groundingInterval = window.setInterval(() => {
        performGrounding();
      }, 15000);
    }
    return () => {
      if (groundingInterval) clearInterval(groundingInterval);
    };
  }, [isLiveSimulating, activePatient?.id, simCoords]);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 5));
  };

  const performGrounding = async () => {
    if (!activePatient || !simCoords) return;
    setIsTracking(true);
    addLog("Gemini 2.5: Re-calculating nearest Level III NICUs...");
    
    const result = await trackEmergencyLocation(
      activePatient.name, 
      simCoords.lat, 
      simCoords.lng
    );
    
    setMapResult(result);
    setIsTracking(false);
    addLog(`Grounding successful: ${result.links.length} facilities verified.`);
  };

  const toggleSimulation = () => {
    if (!isLiveSimulating) {
      setSimCoords(activePatient?.location || null);
      performGrounding();
    }
    setIsLiveSimulating(!isLiveSimulating);
  };

  const selectPatient = (p: PatientRecord) => {
    setActivePatient(p);
    setSimCoords(p.location);
    setMapResult(null);
    setIsLiveSimulating(false);
    addLog(`Target switched to ${p.name}`);
  };

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header with Live Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
           <div className={`p-3 rounded-2xl shadow-lg transition-all duration-500 ${isLiveSimulating ? 'bg-rose-600 shadow-rose-200 animate-pulse' : 'bg-slate-100'}`}>
             <Truck size={24} className={isLiveSimulating ? 'text-white' : 'text-slate-400'} />
           </div>
           <div>
             <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
               Emergency Dispatch Console
               {isLiveSimulating && <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-full animate-pulse uppercase tracking-widest ml-2">Live Tracking</span>}
             </h2>
             <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Grounding Engine: Gemini 2.5 Flash</p>
           </div>
        </div>
        
        <div className="flex items-center gap-4">
           <button 
             onClick={toggleSimulation}
             className={`px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 transition-all shadow-xl active:scale-95 ${
               isLiveSimulating 
               ? 'bg-slate-900 text-white hover:bg-black' 
               : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
             }`}
           >
             {isLiveSimulating ? <Zap size={14} fill="currentColor" className="text-amber-400" /> : <Activity size={14} />}
             {isLiveSimulating ? 'HALT SIMULATION' : 'START LIVE TRACKING'}
           </button>
           <button className="bg-rose-600 text-white px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 hover:bg-rose-700 transition-all shadow-xl active:scale-95">
             <PhoneCall size={14} fill="currentColor" /> CONTACT FLEET
           </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col xl:flex-row gap-6 overflow-hidden">
        {/* Map Interface */}
        <div className="flex-1 bg-slate-900 rounded-[3rem] border-4 border-slate-950 shadow-2xl relative overflow-hidden">
           {simCoords ? (
             <iframe
               width="100%"
               height="100%"
               style={{ border: 0 }}
               loading="lazy"
               allowFullScreen
               src={`https://maps.google.com/maps?q=${simCoords.lat},${simCoords.lng}&t=k&z=17&output=embed`}
               className={`grayscale-[30%] contrast-[1.1] brightness-[0.8] transition-opacity duration-1000 ${isTracking ? 'opacity-40' : 'opacity-80'}`}
             ></iframe>
           ) : (
             <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-4">
               <MapPin size={48} className="animate-bounce" />
               <p className="font-black uppercase tracking-widest text-sm">Awaiting Target Signal...</p>
             </div>
           )}
           
           {/* Map HUD Overlays */}
           <div className="absolute top-6 left-6 z-20 flex flex-col gap-3">
              <div className="bg-slate-950/90 backdrop-blur-xl border border-white/10 px-4 py-3 rounded-2xl text-white shadow-2xl min-w-[200px]">
                 <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                       <Satellite size={16} className="text-indigo-500 animate-pulse" />
                       <span className="text-[10px] font-black uppercase tracking-widest">SAT-Link</span>
                    </div>
                    {isLiveSimulating && <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></div>}
                 </div>
                 <div className="space-y-1">
                    <p className="text-[11px] font-mono text-slate-400">LAT: {simCoords?.lat.toFixed(6)}</p>
                    <p className="text-[11px] font-mono text-slate-400">LNG: {simCoords?.lng.toFixed(6)}</p>
                 </div>
              </div>

              <div className="bg-slate-950/90 backdrop-blur-xl border border-white/10 p-3 rounded-2xl text-white shadow-2xl">
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Signal Intercepts</p>
                 <div className="space-y-1">
                    {logs.map((log, i) => (
                      <p key={i} className={`text-[9px] font-bold leading-tight ${i === 0 ? 'text-indigo-400' : 'text-slate-500 opacity-60'}`}>
                        {log}
                      </p>
                    ))}
                 </div>
              </div>
           </div>

           {/* AI Rerouting Overlay */}
           {isTracking && (
             <div className="absolute inset-0 bg-indigo-900/20 backdrop-blur-[2px] z-30 flex items-center justify-center pointer-events-none">
                <div className="bg-indigo-600 px-6 py-3 rounded-2xl flex items-center gap-3 text-white font-black text-xs shadow-2xl animate-pulse">
                   <Sparkles size={18} /> GEMINI 2.5 REROUTING...
                </div>
             </div>
           )}

           {/* Bottom Info Bar */}
           <div className="absolute bottom-8 left-8 right-8 z-20 flex justify-center">
              <div className="bg-slate-950/90 backdrop-blur-2xl border border-white/10 px-8 py-4 rounded-full flex items-center gap-8 shadow-2xl">
                 <div className="flex flex-col items-center">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Ground Spd</span>
                    <span className="text-white font-black">{isLiveSimulating ? '58' : '0'} km/h</span>
                 </div>
                 <div className="w-px h-6 bg-white/10"></div>
                 <div className="flex flex-col items-center">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Reroute Frequency</span>
                    <span className="text-indigo-400 font-black">15s Cycle</span>
                 </div>
                 <div className="w-px h-6 bg-white/10"></div>
                 <div className="flex flex-col items-center text-rose-500">
                    <span className="text-[8px] font-black opacity-60 uppercase tracking-widest">Priority</span>
                    <span className="font-black">CRITICAL</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Gemini Hospital Sidebar */}
        <div className="w-full xl:w-[480px] flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar">
           {/* Emergency Queue */}
           <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm shrink-0">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="font-black text-slate-900 uppercase tracking-tighter">Emergency Signals</h3>
                 <span className="bg-rose-100 text-rose-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Active</span>
              </div>
              <div className="space-y-2">
                 {patients.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => selectPatient(p)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        activePatient?.id === p.id 
                          ? 'bg-rose-50 border-rose-200 shadow-inner' 
                          : 'bg-slate-50 border-transparent hover:border-slate-200'
                      }`}
                    >
                       <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${activePatient?.id === p.id ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                            {p.name.charAt(0)}
                          </div>
                          <div className="text-left">
                             <p className="text-sm font-black text-slate-800">{p.name}</p>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">34.05N • 118.24W</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${p.riskLevel === 'high' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`}></div>
                          <ChevronRight size={18} className={activePatient?.id === p.id ? 'text-rose-600' : 'text-slate-300'} />
                       </div>
                    </button>
                 ))}
              </div>
           </div>

           {/* Gemini Grounding Hub */}
           <div className="flex-1 bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden flex flex-col shadow-xl">
              <div className="flex items-center gap-3 mb-8 relative z-10">
                 <div className="bg-indigo-600 p-2.5 rounded-xl border border-indigo-500/50 shadow-lg shadow-indigo-900/40">
                    <Sparkles size={20} className="text-indigo-200" />
                 </div>
                 <div>
                    <h4 className="font-black text-lg leading-tight uppercase tracking-tighter">Grounding Hub</h4>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                       <Signal size={10} className="text-emerald-500" /> Verifying Medical Grid
                    </p>
                 </div>
              </div>

              {mapResult ? (
                <div className="flex-1 flex flex-col space-y-6 animate-in fade-in slide-in-from-right-4">
                   <div className="bg-white/5 border border-white/10 p-6 rounded-3xl relative backdrop-blur-sm">
                      <div className="absolute -top-3 left-6 bg-indigo-600 px-3 py-1 rounded-full flex items-center gap-2">
                         <AlertCircle size={10} />
                         <span className="text-[9px] font-black uppercase tracking-widest">AI Dispatch Instruction</span>
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed font-medium">
                         "{mapResult.text}"
                      </p>
                   </div>

                   <div className="flex-1 space-y-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                         <ArrowRight size={12} className="text-emerald-500" /> Grounded Facility URIs
                      </p>
                      <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[350px] custom-scrollbar pr-2">
                        {mapResult.links.map((chunk, i) => chunk.maps && (
                           <a 
                             key={i} 
                             href={chunk.maps.uri} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="group flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-emerald-500/50 transition-all shadow-sm"
                           >
                             <div className="flex items-center gap-4 overflow-hidden">
                                <div className="bg-slate-800 p-2.5 rounded-xl group-hover:bg-emerald-600 transition-colors border border-white/5">
                                   <MapIcon size={18} className="text-slate-400 group-hover:text-white" />
                                </div>
                                <div className="truncate">
                                   <p className="text-xs font-black text-slate-100 truncate">{chunk.maps.title}</p>
                                   <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest mt-0.5">Route Verified</p>
                                </div>
                             </div>
                             <ExternalLink size={14} className="text-slate-600 group-hover:text-emerald-400 shrink-0" />
                           </a>
                        ))}
                      </div>
                   </div>

                   <button className="w-full py-5 bg-rose-600 text-white rounded-[1.5rem] font-black text-sm shadow-2xl shadow-rose-900/50 hover:bg-rose-500 transition-all flex items-center justify-center gap-3 active:scale-95 group">
                      <Zap size={20} fill="currentColor" className="group-hover:animate-bounce" /> 
                      AUTHORIZE FLEET DISPATCH
                   </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-600 text-center px-6">
                   <div className="bg-slate-800/50 p-6 rounded-full mb-4">
                      <Loader2 size={32} className="animate-spin text-indigo-500" />
                   </div>
                   <p className="italic text-sm font-medium">Select a patient or start tracking to initiate Gemini grounding.</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyDispatch;
