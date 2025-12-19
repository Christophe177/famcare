
import React from 'react';
import { 
  Users, 
  AlertTriangle, 
  Activity, 
  TrendingUp,
  Clock,
  ChevronRight,
  ShieldAlert,
  Signal,
  MapPin,
  Sparkles,
  Zap
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// @google/genai coding guidelines: Import necessary types
import { Appointment } from '../types';

const clinicData = [
  { name: '8 AM', patients: 12, risk: 2 },
  { name: '10 AM', patients: 18, risk: 5 },
  { name: '12 PM', patients: 25, risk: 8 },
  { name: '2 PM', patients: 20, risk: 6 },
  { name: '4 PM', patients: 15, risk: 3 },
  { name: '6 PM', patients: 10, search: 1 },
];

// Define DashboardProps to resolve TS error: Property 'appointments' does not exist on type 'IntrinsicAttributes'
interface DashboardProps {
  appointments?: Appointment[];
}

const Dashboard: React.FC<DashboardProps> = ({ appointments }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Clinic Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 border-l-4 border-l-rose-500 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Active High Risk</p>
            <AlertTriangle size={18} className="text-rose-500 animate-pulse" />
          </div>
          <h3 className="text-3xl font-black text-slate-800">08</h3>
          <p className="text-[10px] text-rose-600 font-bold mt-1 flex items-center gap-1">
             <Zap size={10} fill="currentColor" /> +2 critical alerts
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Patients</p>
            <Users size={18} className="text-indigo-500" />
          </div>
          <h3 className="text-3xl font-black text-slate-800">142</h3>
          <p className="text-[10px] text-indigo-600 font-bold mt-1 tracking-widest uppercase">Capacity: 85%</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Normal Vitals</p>
            <Activity size={18} className="text-emerald-500" />
          </div>
          <h3 className="text-3xl font-black text-slate-800">114</h3>
          <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase tracking-widest">Stable status</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">AI Triage Queue</p>
            <Clock size={18} className="text-amber-500" />
          </div>
          <h3 className="text-3xl font-black text-slate-800">12</h3>
          <p className="text-[10px] text-amber-600 font-bold mt-1 flex items-center gap-1">
            <Sparkles size={10} /> Gemini 3 Analysis
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clinic Load Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div>
               <h3 className="text-xl font-black text-slate-900 tracking-tighter">PATIENT FLOW <span className="text-indigo-600">ANALYTICS</span></h3>
               <p className="text-xs text-slate-400 font-medium">Real-time occupancy vs risk threshold</p>
            </div>
            <div className="flex gap-4">
              <span className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div> Census
              </span>
              <span className="flex items-center gap-2 text-[10px] font-black text-rose-500 uppercase">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></div> Emergency
              </span>
            </div>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={clinicData}>
                <defs>
                  <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="patients" stroke="#6366f1" fillOpacity={1} fill="url(#colorPatients)" strokeWidth={4} />
                <Area type="monotone" dataKey="risk" stroke="#f43f5e" fillOpacity={0} strokeWidth={3} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mission Control Sidebar */}
        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
            <Signal size={120} className="text-white" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-white font-black text-lg uppercase tracking-tighter">Mission Control</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Live Feed</span>
              </div>
            </div>

            <div className="space-y-6">
              {/* Active Tracking Mini-Card */}
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
                 <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-indigo-600 rounded-lg">
                       <MapPin size={16} className="text-white" />
                    </div>
                    <div>
                       <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Active Dispatch</p>
                       <p className="text-white font-bold text-sm">Jane Cooper (Unit-01)</p>
                    </div>
                 </div>
                 <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>GPS: 34.05N / 118.24W</span>
                    <span className="text-indigo-400">Signal: 98%</span>
                 </div>
                 <div className="mt-3 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-[70%] animate-pulse"></div>
                 </div>
              </div>

              {/* Gemini Grounding Log */}
              <div className="space-y-3">
                 <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Grounding Events (Gemini 2.5)</p>
                 {[
                   { event: "Hospital Search", status: "Verified", time: "1m ago" },
                   { event: "Risk Re-eval", status: "Low", time: "4m ago" },
                   { event: "Route Optimize", status: "Active", time: "12m ago" }
                 ].map((log, i) => (
                   <div key={i} className="flex items-center justify-between py-2 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <Sparkles size={10} className="text-indigo-400" />
                        <span className="text-[11px] font-bold text-slate-300">{log.event}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-emerald-500 uppercase">{log.status}</span>
                        <span className="text-[9px] text-slate-600 font-mono">{log.time}</span>
                      </div>
                   </div>
                 ))}
              </div>

              <button className="w-full mt-4 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-900/40 transition-all active:scale-95">
                 Open Command Console
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
