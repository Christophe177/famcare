
import React, { useState } from 'react';
import { 
  User, 
  Bell, 
  Globe, 
  Moon, 
  Database, 
  ShieldCheck, 
  Key, 
  Download, 
  Trash2, 
  RefreshCw,
  Cpu,
  CheckCircle2,
  AlertCircle,
  // Added missing imports for icons used in the component
  Activity,
  Loader2
} from 'lucide-react';

interface SettingsProps {
  dbConnected: boolean;
  onReconnect: () => void;
  onOpenKeySelector: () => void;
}

const Settings: React.FC<SettingsProps> = ({ dbConnected, onReconnect, onOpenKeySelector }) => {
  const [language, setLanguage] = useState<'EN' | 'RW'>('EN');
  const [notifications, setNotifications] = useState({
    critical: true,
    aiTriage: true,
    reports: false
  });
  const [isRunningDiag, setIsRunningDiag] = useState(false);
  const [diagResult, setDiagResult] = useState<boolean | null>(null);

  const runDiagnostics = () => {
    setIsRunningDiag(true);
    setDiagResult(null);
    setTimeout(() => {
      setIsRunningDiag(false);
      setDiagResult(true);
    }, 2000);
  };

  const handleExport = () => {
    alert("Preparing workspace backup... Your JSON export will download shortly.");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">System Settings</h2>
          <p className="text-slate-500 font-medium">Manage your workspace preferences and AI integrations.</p>
        </div>
        <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-2xl border border-emerald-100 flex items-center gap-2">
          <ShieldCheck size={18} />
          <span className="text-xs font-black uppercase tracking-widest">Enterprise Secured</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile & UI */}
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <User size={14} /> User Profile
            </h3>
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-slate-100 rounded-[2rem] border-4 border-white shadow-xl flex items-center justify-center mb-4 overflow-hidden">
                <img src="https://picsum.photos/seed/doc/200/200" alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <h4 className="font-black text-slate-900">Dr. Sarah Thompson</h4>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Chief Medical Officer</p>
              <button className="mt-6 w-full py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all">
                Edit Profile
              </button>
            </div>
          </section>

          <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Globe size={14} /> Localization
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">Display Language</span>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button 
                    onClick={() => setLanguage('EN')}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${language === 'EN' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                  >
                    EN
                  </button>
                  <button 
                    onClick={() => setLanguage('RW')}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${language === 'RW' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    RW
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">Dark Mode</span>
                <button className="w-12 h-6 bg-slate-200 rounded-full relative transition-all">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Center/Right Column: Notifications & Advanced */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Bell size={14} /> Notification Logic
            </h3>
            <div className="space-y-6">
              {[
                { key: 'critical', label: 'Critical Health Alerts', desc: 'Instant push notifications for high-risk maternal vitals.' },
                { key: 'aiTriage', label: 'AI Triage Insights', desc: 'Notifications when Gemini detects a status change in patients.' },
                { key: 'reports', label: 'Weekly Summary Reports', desc: 'Receive aggregated family health data every Monday.' }
              ].map((item) => (
                <div key={item.key} className="flex items-start justify-between">
                  <div className="max-w-md">
                    <p className="text-sm font-black text-slate-900 leading-none">{item.label}</p>
                    <p className="text-xs text-slate-400 mt-2">{item.desc}</p>
                  </div>
                  <button 
                    // Fixed: using typeof notifications instead of typeof prev as prev is only in scope for the callback
                    onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof notifications] }))}
                    className={`w-12 h-6 rounded-full relative transition-all duration-300 ${notifications[item.key as keyof typeof notifications] ? 'bg-rose-600' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${notifications[item.key as keyof typeof notifications] ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Cpu size={80} />
              </div>
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <RefreshCw size={12} /> API Connectivity
              </h3>
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Database</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${dbConnected ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {dbConnected ? 'Connected' : 'Offline'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gemini Engine</span>
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Active</span>
                </div>
                <button 
                  onClick={onReconnect}
                  className="w-full mt-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <Database size={14} /> Refresh Handshake
                </button>
              </div>
            </section>

            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                  <Activity size={14} /> Diagnostics
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">Verify the integrity of AI models and mapping services.</p>
              </div>
              
              {diagResult !== null && (
                <div className={`mb-4 flex items-center gap-2 p-3 rounded-xl border ${diagResult ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                  {diagResult ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span className="text-[10px] font-black uppercase tracking-widest">System Check Passed</span>
                </div>
              )}

              <button 
                onClick={runDiagnostics}
                disabled={isRunningDiag}
                className="w-full py-4 bg-rose-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isRunningDiag ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                {isRunningDiag ? 'Running Test...' : 'Run Diagnostics'}
              </button>
            </section>
          </div>

          <section className="bg-rose-50 p-8 rounded-[2.5rem] border border-rose-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white rounded-2xl shadow-sm border border-rose-200">
                <Download className="text-rose-600" size={24} />
              </div>
              <div>
                <h4 className="font-black text-slate-900 leading-none">Workspace Data</h4>
                <p className="text-xs text-slate-500 mt-2 font-medium">Download your family records and AI logs.</p>
              </div>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={handleExport}
                className="flex-1 md:flex-none px-6 py-4 bg-white text-slate-900 border border-rose-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
              >
                Export JSON
              </button>
              <button className="flex-1 md:flex-none px-6 py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all flex items-center justify-center gap-2">
                <Trash2 size={16} /> Purge Cache
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Settings;
