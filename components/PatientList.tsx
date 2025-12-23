
import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  ChevronRight, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  MoreVertical,
  Plus,
  Stethoscope
} from 'lucide-react';
import { PatientRecord, RiskLevel } from '../types';

interface PatientListProps {
  patients: PatientRecord[];
  onSelectPatient: (patient: PatientRecord) => void;
}

const PatientList: React.FC<PatientListProps> = ({ patients, onSelectPatient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<RiskLevel | 'all'>('all');

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || p.riskLevel === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: patients.length,
    highRisk: patients.filter(p => p.riskLevel === 'high').length,
    stable: patients.filter(p => p.riskLevel === 'low').length,
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Patient Directory</h2>
          <p className="text-slate-500 font-medium">Monitoring {stats.total} active family records.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-rose-50 border border-rose-100 px-5 py-3 rounded-2xl flex flex-col items-center min-w-[100px]">
             <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">High Risk</span>
             <span className="text-xl font-black text-rose-600">{stats.highRisk}</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 px-5 py-3 rounded-2xl flex flex-col items-center min-w-[100px]">
             <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Stable</span>
             <span className="text-xl font-black text-emerald-600">{stats.stable}</span>
          </div>
          <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-widest hover:bg-black transition-all">
             <Plus size={16} strokeWidth={3} /> Add Patient
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or case ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all font-medium"
          />
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
          {(['all', 'high', 'medium', 'low'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setFilter(level)}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === level 
                  ? 'bg-slate-900 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Patient Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPatients.map((patient, i) => (
          <div 
            key={patient.id} 
            onClick={() => onSelectPatient(patient)}
            className={`group bg-white rounded-[2.5rem] border p-1 transition-all hover:shadow-2xl hover:shadow-slate-200 cursor-pointer ${
              patient.riskLevel === 'high' ? 'border-rose-200' : 'border-slate-100'
            }`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="p-6 h-full flex flex-col">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border-4 border-white shadow-xl ${
                    patient.riskLevel === 'high' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {patient.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-lg leading-tight">{patient.name}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{patient.weeks}W Gestation</p>
                  </div>
                </div>
                <button className="p-2 text-slate-300 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-all">
                  <MoreVertical size={20} />
                </button>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Blood Pressure</p>
                  <p className="text-sm font-black text-slate-800">{patient.lastBp}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Risk Status</p>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      patient.riskLevel === 'high' ? 'bg-rose-600 animate-pulse' : 
                      patient.riskLevel === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}></div>
                    <span className={`text-[10px] font-black uppercase ${
                      patient.riskLevel === 'high' ? 'text-rose-600' : 
                      patient.riskLevel === 'medium' ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {patient.riskLevel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2 mt-auto">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pregnancy Progress</span>
                  <span className="text-[10px] font-black text-slate-800">{Math.round((patient.weeks / 40) * 100)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                      patient.riskLevel === 'high' ? 'bg-rose-500' : 'bg-slate-900'
                    }`}
                    style={{ width: `${(patient.weeks / 40) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <Clock size={12} className="text-slate-400" />
                   <span className="text-[10px] font-bold text-slate-400 uppercase">Updated {patient.lastUpdate}</span>
                </div>
                <button className="flex items-center gap-1 text-[10px] font-black text-slate-900 uppercase tracking-widest group-hover:gap-2 transition-all">
                  Profile <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPatients.length === 0 && (
        <div className="bg-white py-20 rounded-[3rem] border border-dashed border-slate-200 text-center">
          <Users size={48} className="mx-auto text-slate-200 mb-4" />
          <h4 className="text-xl font-black text-slate-900 tracking-tighter">No Patients Found</h4>
          <p className="text-slate-400 max-w-xs mx-auto mt-2 text-sm font-medium leading-relaxed">Try adjusting your filters or search terms to find the matching family record.</p>
        </div>
      )}
    </div>
  );
};

export default PatientList;
