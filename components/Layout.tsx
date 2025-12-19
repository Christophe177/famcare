
import React from 'react';
import { ViewType, AppMode } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  ShieldAlert, 
  Calendar, 
  Settings,
  HeartPulse,
  Smartphone,
  Monitor,
  ChevronRight,
  Stethoscope,
  Activity,
  Signal,
  Sparkles
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewType;
  setView: (view: ViewType) => void;
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setView, appMode, setAppMode }) => {
  const doctorNav = [
    { id: ViewType.CLINIC_DASHBOARD, icon: LayoutDashboard, label: 'Dashboard' },
    { id: ViewType.DOCTOR_PORTAL, icon: Users, label: 'Patients' },
    { id: ViewType.EMERGENCY_DISPATCH, icon: ShieldAlert, label: 'Emergency Hub' },
    { id: ViewType.CLINIC_SCHEDULE, icon: Calendar, label: 'Schedule' },
    { id: ViewType.SETTINGS, icon: Settings, label: 'Settings' },
  ];

  if (appMode === 'PATIENT_MOBILE') {
    return <div className="h-screen bg-slate-950 overflow-hidden">{children}</div>;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Professional Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col hidden md:flex shrink-0">
        <div className="p-8 flex items-center gap-3">
          <div className="bg-rose-600 p-2.5 rounded-2xl shadow-lg shadow-rose-100">
            <HeartPulse className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">FamCare <span className="text-rose-600">MD</span></h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Medical Workspace</p>
          </div>
        </div>
        
        <nav className="flex-1 px-6 space-y-2 mt-4">
          {doctorNav.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group ${
                activeView === item.id 
                  ? 'bg-rose-50 text-rose-700 font-bold shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} className={activeView === item.id ? 'text-rose-600' : 'text-slate-400'} />
                <span className="text-sm">{item.label}</span>
              </div>
              {activeView === item.id && <ChevronRight size={14} />}
            </button>
          ))}
        </nav>

        {/* View Switcher (Bottom) */}
        <div className="p-6 mt-auto bg-slate-50/50 border-t border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">Simulate Interface</p>
          <div className="grid grid-cols-2 gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
            <button 
              onClick={() => setAppMode('DOCTOR_DESKTOP')}
              className={`flex flex-col items-center justify-center py-3 rounded-xl gap-1.5 transition-all ${(appMode as any) === 'DOCTOR_DESKTOP' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <Monitor size={18} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Desktop</span>
            </button>
            <button 
              onClick={() => setAppMode('PATIENT_MOBILE')}
              className={`flex flex-col items-center justify-center py-3 rounded-xl gap-1.5 transition-all ${(appMode as any) === 'PATIENT_MOBILE' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <Smartphone size={18} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Mobile</span>
            </button>
          </div>
          
          <div className="mt-6 flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-rose-600">
               <Stethoscope size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-800">Dr. Thompson</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Senior OBGYN</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white/80 backdrop-blur-xl shrink-0 border-b border-slate-200 flex items-center justify-between px-10 z-40">
          <div>
            <h2 className="text-lg font-black text-slate-800 capitalize tracking-tight flex items-center gap-2">
              {activeView.replace('CLINIC_', '').replace('_', ' ')}
              <span className="text-[10px] font-black text-slate-300 ml-2">• GEMINI 2.5 ACTIVE</span>
            </h2>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-4 bg-emerald-50 px-5 py-2.5 rounded-full border border-emerald-100 shadow-sm">
               <div className="flex items-center gap-1.5 border-r border-emerald-200 pr-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Clinic: Optimal</span>
               </div>
               <div className="flex items-center gap-2">
                  <Signal size={12} className="text-emerald-500" />
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">SAT-LINK: SECURE</span>
               </div>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 max-w-[1600px] w-full mx-auto">
          {children}
        </div>

        {/* Global Telemetry Ticker */}
        <footer className="h-10 bg-slate-900 border-t border-white/5 shrink-0 flex items-center px-6 overflow-hidden relative">
           <div className="flex items-center gap-8 animate-[ticker_20s_linear_infinite] whitespace-nowrap">
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                <Sparkles size={12} className="text-indigo-400" />
                <span>Gemini Engine Status: 2.5 Flash Grounding Active</span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                <Signal size={12} className="text-emerald-400" />
                <span>Live Feed: Latency 24ms</span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                <Activity size={12} className="text-rose-400" />
                <span>Emergency Hub: Monitoring Unit-01 Telemetry</span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                <ShieldAlert size={12} className="text-amber-400" />
                <span>Global Health Triage: No New Critical Signals</span>
              </div>
           </div>
           
           <style>{`
             @keyframes ticker {
               0% { transform: translateX(0); }
               100% { transform: translateX(-50%); }
             }
           `}</style>
        </footer>
      </main>
    </div>
  );
};

export default Layout;
