
import React, { useState } from 'react';
import { Activity, Bell, Heart, AlertTriangle, ChevronRight, Plus, PhoneCall } from 'lucide-react';
import { VitalLog } from '../types';

const PregnancyCare: React.FC = () => {
  const [vitals, setVitals] = useState<VitalLog[]>([
    { id: '1', date: '2024-10-25', systolic: 118, diastolic: 76, weight: 68.5, fetalKicks: 12, symptoms: [], riskLevel: 'low' },
    { id: '2', date: '2024-10-24', systolic: 135, diastolic: 88, weight: 68.2, fetalKicks: 10, symptoms: ['Headache'], riskLevel: 'medium' }
  ]);

  const latestVital = vitals[0];
  const isHighRisk = latestVital.systolic >= 140 || latestVital.diastolic >= 90 || latestVital.riskLevel === 'high';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Maternal Health Tracker</h2>
          <p className="text-slate-500">Monitoring vital signs and pregnancy progress</p>
        </div>
        <button className="bg-rose-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-rose-700 transition-all shadow-lg shadow-rose-200">
          <PhoneCall size={18} /> EMERGENCY CALL
        </button>
      </div>

      {/* Emergency Alert Card */}
      {isHighRisk && (
        <div className="bg-rose-50 border-2 border-rose-200 p-6 rounded-2xl flex items-start gap-4 animate-pulse">
          <div className="bg-rose-100 p-3 rounded-xl text-rose-600">
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-rose-800 font-bold text-lg">Potential Health Risk Detected</h3>
            <p className="text-rose-700 mb-3">Your blood pressure reading is elevated. Please rest for 15 minutes and retake. If symptoms persist, contact Dr. Sarah immediately.</p>
            <div className="flex gap-3">
              <button className="bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">Notify Doctor</button>
              <button className="bg-white border border-rose-200 text-rose-600 px-4 py-2 rounded-lg text-sm font-semibold">View Protocol</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vital Cards */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 text-sm font-medium">Blood Pressure</span>
            <Activity className="text-indigo-600" size={20} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-800">{latestVital.systolic}/{latestVital.diastolic}</span>
            <span className="text-slate-400 text-sm">mmHg</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
             <span className={`w-2 h-2 rounded-full ${latestVital.systolic > 130 ? 'bg-orange-500' : 'bg-green-500'}`}></span>
             <span className="text-xs text-slate-500">{latestVital.systolic > 130 ? 'Slightly Elevated' : 'Normal Range'}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 text-sm font-medium">Fetal Kick Count</span>
            <Heart className="text-rose-500" size={20} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-800">{latestVital.fetalKicks}</span>
            <span className="text-slate-400 text-sm">in 2 hrs</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-green-500"></span>
             <span className="text-xs text-slate-500">Active & Healthy</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 text-sm font-medium">Current Week</span>
            <Bell className="text-amber-500" size={20} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-800">28</span>
            <span className="text-slate-400 text-sm">Weeks</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
             <span className="text-xs text-slate-500">Third Trimester Entry</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Logs */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800">Recent Health Logs</h3>
            <button className="text-indigo-600 text-sm font-semibold flex items-center gap-1">
              <Plus size={16} /> Add Entry
            </button>
          </div>
          <div className="space-y-4">
            {vitals.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${log.riskLevel === 'high' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                    <Activity size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    <p className="text-xs text-slate-500">BP: {log.systolic}/{log.diastolic} • {log.fetalKicks} Kicks</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {log.symptoms.length > 0 && (
                    <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Symptoms</span>
                  )}
                  <ChevronRight size={16} className="text-slate-300" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Doctor Information */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-6">Primary Healthcare Provider</h3>
          <div className="flex items-center gap-4 mb-6">
            <img src="https://picsum.photos/seed/doc/80/80" className="w-16 h-16 rounded-2xl object-cover" alt="Doctor" />
            <div>
              <p className="font-bold text-slate-800">Dr. Sarah Thompson</p>
              <p className="text-sm text-slate-500">OBGYN • City General Hospital</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-xs text-green-600 font-medium">Available for urgent chat</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <button className="w-full py-3 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-all">
              Message Doctor
            </button>
            <button className="w-full py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all">
              Schedule Appointment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PregnancyCare;
