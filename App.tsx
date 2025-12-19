import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import DoctorPortal from './components/DoctorPortal';
import EmergencyDispatch from './components/EmergencyDispatch';
import PatientMobileApp from './components/PatientMobileApp';
import { ViewType, AppMode, Appointment } from './types';
import { Truck, Sparkles, Key, ExternalLink, ShieldCheck, Clock, Calendar as CalendarIcon, CheckCircle2, XCircle } from 'lucide-react';

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>('DOCTOR_DESKTOP');
  const [activeView, setActiveView] = useState<ViewType>(ViewType.CLINIC_DASHBOARD);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  
  // Global Shared State
  const [appointments, setAppointments] = useState<Appointment[]>([
    { id: '1', patientId: 'p1', patientName: 'Sarah Miller', date: '2024-10-28', time: '09:00 AM', reason: 'Routine Checkup', status: 'approved', timestamp: new Date() },
    { id: '2', patientId: 'p2', patientName: 'Jane Cooper', date: '2024-10-28', time: '10:30 AM', reason: 'Emergency Monitoring', status: 'approved', timestamp: new Date() }
  ]);

  useEffect(() => {
    checkKeyStatus();
  }, []);

  const checkKeyStatus = async () => {
    if ((window as any).aistudio) {
      const selected = await (window as any).aistudio.hasSelectedApiKey();
      setHasKey(selected);
    } else {
      setHasKey(true); 
    }
  };

  const handleOpenKeySelector = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  const addAppointment = (apt: Appointment) => {
    setAppointments(prev => [apt, ...prev]);
  };

  const updateAppointmentStatus = (id: string, status: Appointment['status']) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  if (hasKey === false) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-white/10 p-10 rounded-[3rem] text-center shadow-2xl">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-900/40">
            <Key size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-4 tracking-tighter">Gemini 2.5/3 Setup</h1>
          <p className="text-slate-400 text-sm mb-10 leading-relaxed font-medium">
            To use FamCare's high-fidelity AI tracking, voice care, and Maps grounding, you must select a Gemini API key from a paid GCP project.
          </p>
          <div className="space-y-4">
            <button 
              onClick={handleOpenKeySelector}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3"
            >
              <Sparkles size={20} /> CONNECT AI ENGINE
            </button>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest hover:text-indigo-400 transition-colors"
            >
              Billing Documentation <ExternalLink size={10} className="inline ml-1" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (appMode === 'PATIENT_MOBILE') {
      return (
        <PatientMobileApp 
          onExit={() => setAppMode('DOCTOR_DESKTOP')} 
          appointments={appointments}
          onBookAppointment={addAppointment}
        />
      );
    }

    switch (activeView) {
      case ViewType.CLINIC_DASHBOARD:
        return <Dashboard appointments={appointments} />;
      case ViewType.DOCTOR_PORTAL:
        return (
          <DoctorPortal 
            appointments={appointments} 
            onUpdateAptStatus={updateAppointmentStatus} 
          />
        );
      case ViewType.EMERGENCY_DISPATCH:
        return <EmergencyDispatch />;
      case ViewType.CLINIC_SCHEDULE:
        return (
          <div className="flex flex-col xl:flex-row gap-6 h-[calc(100vh-180px)] animate-in fade-in duration-700">
             <div className="flex-1 bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="text-4xl font-black text-slate-900 tracking-tighter">Clinic <span className="text-indigo-600">Schedule</span></h3>
                   <div className="flex gap-4">
                     <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button className="px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors">Day</button>
                        <button className="px-4 py-2 text-xs font-black uppercase tracking-widest bg-white text-indigo-600 rounded-lg shadow-sm">Month</button>
                     </div>
                   </div>
                </div>

                <div className="grid grid-cols-7 gap-4 mb-8">
                   {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                     <div key={day} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest pb-2">{day}</div>
                   ))}
                   {Array.from({length: 31}).map((_, i) => {
                     const dayAppointments = appointments.filter(a => new Date(a.date).getDate() === i + 1);
                     const hasApproved = dayAppointments.some(a => a.status === 'approved');
                     const hasPending = dayAppointments.some(a => a.status === 'pending');
                     
                     return (
                       <div key={i} className={`aspect-square rounded-2xl flex flex-col items-center justify-center font-black transition-all cursor-pointer border ${
                         hasApproved ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 
                         hasPending ? 'bg-amber-50 border-amber-100 text-amber-600' :
                         'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                       } group relative`}>
                         <span className="text-base">{i + 1}</span>
                         <div className="absolute bottom-2 flex gap-1">
                            {hasApproved && <div className="w-1 h-1 rounded-full bg-indigo-500"></div>}
                            {hasPending && <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse"></div>}
                         </div>
                       </div>
                     );
                   })}
                </div>
                
                <div className="space-y-6">
                   <div>
                     <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">Agenda: Today</h4>
                     <div className="space-y-3">
                        {appointments
                         .filter(a => a.status !== 'declined')
                         .sort((a, b) => a.time.localeCompare(b.time))
                         .map((apt) => (
                          <div key={apt.id} className={`flex items-center justify-between p-5 rounded-3xl border transition-all ${
                            apt.status === 'approved' 
                              ? 'bg-slate-50 border-slate-100 shadow-sm' 
                              : 'bg-amber-50 border-amber-100 shadow-none'
                          }`}>
                             <div className="flex items-center gap-5">
                                <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black ${
                                  apt.status === 'approved' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                   <Clock size={16} />
                                   <span className="text-[10px] mt-1">{apt.time.split(' ')[0]}</span>
                                </div>
                                <div>
                                   <p className="text-base font-black text-slate-800 tracking-tight">{apt.patientName}</p>
                                   <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                      {apt.reason}
                                   </p>
                                </div>
                             </div>
                             <div className="flex items-center gap-4">
                                {apt.status === 'pending' && (
                                  <div className="flex gap-2">
                                     <button 
                                      onClick={() => updateAppointmentStatus(apt.id, 'approved')}
                                      className="bg-white text-emerald-600 p-2 rounded-xl border border-emerald-100 hover:bg-emerald-50 shadow-sm"
                                     >
                                        <CheckCircle2 size={18} />
                                     </button>
                                     <button 
                                      onClick={() => updateAppointmentStatus(apt.id, 'declined')}
                                      className="bg-white text-rose-600 p-2 rounded-xl border border-rose-100 hover:bg-rose-50 shadow-sm"
                                     >
                                        <XCircle size={18} />
                                     </button>
                                  </div>
                                )}
                                <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full ${
                                  apt.status === 'approved' ? 'bg-indigo-600 text-white' : 'bg-amber-500 text-white animate-pulse'
                                }`}>
                                   {apt.status}
                                </span>
                             </div>
                          </div>
                        ))}
                     </div>
                   </div>
                </div>
             </div>

             <div className="w-full xl:w-[400px] flex flex-col gap-6">
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
                   <div className="flex items-center gap-3 mb-6">
                      <div className="bg-amber-100 p-3 rounded-2xl text-amber-600">
                        <Clock size={20} />
                      </div>
                      <h4 className="font-black text-slate-800 tracking-tighter uppercase text-sm tracking-widest">Awaiting Approval</h4>
                   </div>
                   <div className="space-y-4">
                      {appointments.filter(a => a.status === 'pending').length > 0 ? (
                        appointments.filter(a => a.status === 'pending').map(apt => (
                          <div key={apt.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-200 transition-all">
                             <p className="font-black text-slate-800 text-sm">{apt.patientName}</p>
                             <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{apt.date} @ {apt.time}</p>
                             <div className="mt-4 flex gap-2">
                                <button 
                                  onClick={() => updateAppointmentStatus(apt.id, 'approved')}
                                  className="flex-1 bg-white text-emerald-600 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-50"
                                >
                                  Confirm
                                </button>
                                <button 
                                  onClick={() => updateAppointmentStatus(apt.id, 'declined')}
                                  className="flex-1 bg-white text-rose-600 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-rose-100 hover:bg-rose-50"
                                >
                                  Reject
                                </button>
                             </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-3xl">
                           <ShieldCheck size={40} className="mx-auto text-slate-100 mb-2" />
                           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">No pending requests</p>
                        </div>
                      )}
                   </div>
                </div>

                <div className="bg-slate-900 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl flex-1 border border-white/5 relative">
                   <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-900 z-10">
                      <div className="flex items-center gap-2">
                         <div className="bg-rose-600 p-2 rounded-lg">
                            <Truck size={16} className="text-white" />
                         </div>
                         <h4 className="text-white font-black text-sm uppercase tracking-tighter">Live Patient Trucking</h4>
                      </div>
                      <button onClick={() => setActiveView(ViewType.EMERGENCY_DISPATCH)} className="text-[10px] font-black text-indigo-400 uppercase hover:text-indigo-300">Expand Hub</button>
                   </div>
                   
                   <div className="flex-1 relative bg-slate-950">
                      <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        src={`https://maps.google.com/maps?q=34.0522,-118.2437&t=k&z=15&output=embed`}
                        className="grayscale-[20%] contrast-[1.1] brightness-[0.7]"
                      ></iframe>
                   </div>
                </div>
             </div>
          </div>
        );
      case ViewType.SETTINGS:
        return (
          <div className="max-w-3xl bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-sm animate-in fade-in duration-700">
             <h3 className="text-3xl font-black text-slate-900 mb-10 tracking-tighter">Workspace <span className="text-indigo-600">Settings</span></h3>
             <div className="space-y-6">
                <button 
                  onClick={handleOpenKeySelector}
                  className="w-full flex items-center justify-between p-6 bg-indigo-50 rounded-3xl border border-indigo-100 hover:bg-indigo-100 transition-all"
                >
                  <div className="text-left">
                    <span className="font-black text-indigo-900 block">Switch Gemini API Key</span>
                    <span className="text-xs text-indigo-400 font-medium">Update the key used for Gemini 3 and 2.5 Flash models</span>
                  </div>
                  <ShieldCheck size={24} className="text-indigo-600" />
                </button>
                {[
                  { title: 'General Clinic Info', desc: 'Managed branding, contact, and address details' },
                  { title: 'Staff Management', desc: 'Control access for doctors, nurses, and admins' },
                  { title: 'AI Threshold Tuning', desc: 'Adjust sensitivity for Gemini risk detection' }
                ].map((item) => (
                  <div key={item.title} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl hover:bg-slate-100 transition-all cursor-pointer group border border-transparent hover:border-slate-200">
                    <div>
                      <span className="font-black text-slate-800 group-hover:text-slate-900 block">{item.title}</span>
                      <span className="text-xs text-slate-400 font-medium">{item.desc}</span>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        );
      default:
        return <Dashboard appointments={appointments} />;
    }
  };

  return (
    <Layout 
      activeView={activeView} 
      setView={setActiveView} 
      appMode={appMode} 
      setAppMode={setAppMode}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
