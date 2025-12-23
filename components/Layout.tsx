
import React from 'react';
import { ViewType, AppMode } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  ShieldAlert, 
  Settings,
  HeartPulse,
  Smartphone,
  Monitor,
  ChevronRight,
  Stethoscope,
  Activity,
  Signal,
  Sparkles,
  Bot
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
    { id: ViewType.DASHBOARD, icon: LayoutDashboard, label: 'Dashboard' },
    { id: ViewType.PATIENTS, icon: Users, label: 'Patient Directory' },
    { id: ViewType.PREGNANCY_CARE, icon: HeartPulse, label: 'Maternal Care' },
    { id: ViewType.AI_ASSISTANT, icon: Bot, label: 'AI Assistant' },
    { id: ViewType.DOCTOR_PORTAL, icon: Stethoscope, label: 'Doctor Portal' },
    { id: ViewType.EMERGENCY_DISPATCH, icon: ShieldAlert, label: 'Emergency Hub' },
    { id: ViewType.SETTINGS, icon: Settings, label: 'Settings' },
  ];

  if (appMode === 'PATIENT_MOBILE') {
    return <div className="h-screen bg-slate-950 overflow-hidden">{children}</div>;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col hidden md:flex shrink-0">
        <div className="p-8 flex items-center gap-3">
          <div className="bg-rose-600 p-2.5 rounded-2xl shadow-lg shadow-rose-100">
            <HeartPulse className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">FamCare</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Family Workspace</p>
          </div>
        </div>
        
        <nav className="flex-1 px-6 space-y-1 mt-2">
          {doctorNav.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${
                activeView === item.id 
                  ? 'bg-rose-50 text-rose-700 font-bold' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} className={activeView === item.id ? 'text-rose-600' : 'text-slate-400'} />
                <span className="text-sm">{item.label}</span>
              </div>
              {activeView === item.id && <ChevronRight size={14} />}
            </button>
          ))}
        </nav>

        {/* View Switcher */}
        <div className="p-6 mt-auto bg-slate-50/50 border-t border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Interface Mode</p>
          <div className="grid grid-cols-2 gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button 
              onClick={() => setAppMode('DOCTOR_DESKTOP')}
              className={`flex flex-col items-center justify-center py-2 rounded-lg gap-1 transition-all ${(appMode as any) === 'DOCTOR_DESKTOP' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <Monitor size={16} />
              <span className="text-[9px] font-black uppercase">Desktop</span>
            </button>
            <button 
              onClick={() => setAppMode('PATIENT_MOBILE')}
              className={`flex flex-col items-center justify-center py-2 rounded-lg gap-1 transition-all ${(appMode as any) === 'PATIENT_MOBILE' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <Smartphone size={16} />
              <span className="text-[9px] font-black uppercase">Mobile</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 shrink-0 z-40">
          <h2 className="text-lg font-black text-slate-800 capitalize tracking-tight flex items-center gap-2">
            {activeView.replace('_', ' ')}
            <span className="text-[10px] font-black text-slate-300 ml-2">• AI CORE ACTIVE</span>
          </h2>
          <div className="flex items-center gap-4">
             <div className="bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">System Optimal</span>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
          {children}
        </div>

        <footer className="h-10 bg-slate-900 border-t border-white/5 shrink-0 flex items-center px-6 overflow-hidden relative">
           <div className="flex items-center gap-8 animate-[ticker_25s_linear_infinite] whitespace-nowrap">
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                <Sparkles size={12} className="text-indigo-400" />
                <span>Gemini Engine: 2.5 Flash Native Audio Ready</span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                <Signal size={12} className="text-emerald-400" />
                <span>Cloud Grounding Active: Google Maps API Synchronized</span>
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
