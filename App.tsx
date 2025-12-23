
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import PregnancyCare from './components/PregnancyCare';
import AIAssistant from './components/AIAssistant';
import DoctorPortal from './components/DoctorPortal';
import EmergencyDispatch from './components/EmergencyDispatch';
import PatientMobileApp from './components/PatientMobileApp';
import Settings from './components/Settings';
import PatientList from './components/PatientList';
import { ViewType, AppMode, Appointment, PatientRecord, Message, RiskLevel } from './types';
// Added ArrowRight to fixed the "Cannot find name 'ArrowRight'" error on line 256
import { Key, Loader2, Database, AlertCircle, X, Bell, ArrowRight } from 'lucide-react';
import { apiService } from './services/apiService';

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>('DOCTOR_DESKTOP');
  const [activeView, setActiveView] = useState<ViewType>(ViewType.DASHBOARD);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dbConnected, setDbConnected] = useState(false);
  
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  // New state for cross-portal emergency notifications
  const [activeAlert, setActiveAlert] = useState<{patientName: string, reason: string} | null>(null);

  useEffect(() => {
    const initApp = async () => {
      await checkKeyStatus();
      await loadData();
      setIsLoading(false);
    };
    initApp();
  }, []);

  const loadData = async () => {
    try {
      const [fetchedPatients, fetchedAppointments] = await Promise.all([
        apiService.fetchPatients(),
        apiService.fetchAppointments()
      ]);
      setPatients(fetchedPatients);
      setAppointments(fetchedAppointments);
      setDbConnected(true);
    } catch (err) {
      console.error("Database connection failed. Check if api/main.py is running.");
      setDbConnected(false);
      // Fallback mock data with detailed Alice information
      setPatients([
        { 
          id: 'p1', 
          name: 'Mutoni Alice', 
          age: 28,
          bloodType: 'A+',
          emergencyContact: 'Robert Mutoni (Husband) - +250 788 123 456',
          allergies: ['Penicillin', 'Dust'],
          weeks: 32, 
          lastBp: '145/95', 
          riskLevel: 'medium', 
          location: { lat: -1.9441, lng: 30.0619 }, 
          lastUpdate: 'Offline', 
          triageHistory: [] 
        },
        { 
          id: 'p2', 
          name: 'Umuhoza Grace', 
          age: 24,
          bloodType: 'O-',
          emergencyContact: 'Mama Grace - +250 788 987 654',
          allergies: ['None'],
          weeks: 24, 
          lastBp: '118/72', 
          riskLevel: 'low', 
          location: { lat: -1.9706, lng: 30.1044 }, 
          lastUpdate: '2 hours ago', 
          triageHistory: [] 
        },
        { 
          id: 'p3', 
          name: 'Ingabire Marie', 
          age: 34,
          bloodType: 'B+',
          emergencyContact: 'Jean Paul - +250 788 000 111',
          allergies: ['Latex'],
          weeks: 38, 
          lastBp: '158/102', 
          riskLevel: 'high', 
          location: { lat: -1.9547, lng: 30.0822 }, 
          lastUpdate: 'Just now', 
          triageHistory: [] 
        },
      ]);
    }
  };

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

  const updatePatientTriage = async (patientId: string, riskLevel: RiskLevel, newMessage: Message) => {
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        // Trigger global alert if high risk
        if (riskLevel === 'high') {
          setActiveAlert({
            patientName: p.name,
            reason: newMessage.text.substring(0, 60) + "..."
          });
        }
        
        return {
          ...p,
          riskLevel,
          lastUpdate: 'Just now',
          triageHistory: [newMessage, ...p.triageHistory].slice(0, 10)
        };
      }
      return p;
    }));

    if (dbConnected) {
      try {
        await apiService.updatePatientTriage(patientId, riskLevel, newMessage);
      } catch (err) {
        console.error("Database sync failed", err);
      }
    }
  };

  const addAppointment = async (apt: Appointment) => {
    setAppointments(prev => [apt, ...prev]);
    if (dbConnected) {
      try {
        await apiService.createAppointment(apt);
      } catch (err) {
        console.error("Database sync failed", err);
      }
    }
  };

  const updateAppointmentStatus = (id: string, status: Appointment['status']) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  if (hasKey === false) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
        <div className="max-w-md w-full bg-slate-900 border border-white/10 p-10 rounded-[2.5rem] text-center">
          <Key size={48} className="mx-auto mb-6 text-rose-600" />
          <h1 className="text-2xl font-black mb-4 tracking-tighter">AI Setup Required</h1>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">Please connect your Gemini API key to activate the FamCare health engine.</p>
          <button onClick={handleOpenKeySelector} className="w-full py-4 bg-rose-600 hover:bg-rose-500 rounded-2xl font-black transition-all">
            CONNECT AI KEY
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
           <Loader2 className="animate-spin text-rose-600 mx-auto mb-4" size={40} />
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Establishing Database Handshake...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (appMode === 'PATIENT_MOBILE') {
      const currentPatient = patients.find(p => p.id === 'p1') || patients[0];
      return (
        <PatientMobileApp 
          onExit={() => setAppMode('DOCTOR_DESKTOP')} 
          appointments={appointments}
          onBookAppointment={addAppointment}
          patientRecord={currentPatient}
          onTriageUpdate={(risk, msg) => updatePatientTriage(currentPatient.id, risk, msg)}
        />
      );
    }

    switch (activeView) {
      case ViewType.DASHBOARD:
        return <Dashboard appointments={appointments} />;
      case ViewType.PATIENTS:
        return <PatientList patients={patients} onSelectPatient={(p) => setActiveView(ViewType.DOCTOR_PORTAL)} />;
      case ViewType.PREGNANCY_CARE:
        return <PregnancyCare />;
      case ViewType.AI_ASSISTANT:
        return <AIAssistant />;
      case ViewType.DOCTOR_PORTAL:
        return (
          <DoctorPortal 
            patients={patients}
            appointments={appointments} 
            onUpdateAptStatus={updateAppointmentStatus} 
            onBack={() => setActiveView(ViewType.DASHBOARD)}
          />
        );
      case ViewType.EMERGENCY_DISPATCH:
        return <EmergencyDispatch patients={patients} />;
      case ViewType.SETTINGS:
        return (
          <Settings 
            dbConnected={dbConnected} 
            onReconnect={loadData} 
            onOpenKeySelector={handleOpenKeySelector} 
          />
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
      <div className="relative">
        {/* Global Emergency Alert Notification (Doctor Portal) */}
        {activeAlert && appMode === 'DOCTOR_DESKTOP' && (
          <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-right-4 duration-500">
             <div className="bg-rose-600 text-white p-6 rounded-[2rem] shadow-[0_20px_50px_rgba(225,29,72,0.4)] border border-rose-400 flex items-center gap-4 max-w-sm">
                <div className="bg-white/20 p-3 rounded-2xl">
                   <AlertCircle className="animate-pulse" size={24} />
                </div>
                <div className="flex-1">
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Urgent Medical Alert</p>
                   <p className="text-sm font-black mt-0.5">{activeAlert.patientName}</p>
                   <p className="text-[10px] opacity-70 mt-1 truncate">{activeAlert.reason}</p>
                </div>
                <button 
                  onClick={() => { setActiveAlert(null); setActiveView(ViewType.DOCTOR_PORTAL); }}
                  className="bg-white/10 p-2 rounded-xl hover:bg-white/20 transition-all"
                >
                   <ArrowRight size={18} />
                </button>
                <button 
                  onClick={() => setActiveAlert(null)}
                  className="absolute -top-2 -right-2 bg-slate-900 text-white p-1 rounded-full border border-white/20"
                >
                   <X size={12} />
                </button>
             </div>
          </div>
        )}
        {renderContent()}
      </div>
    </Layout>
  );
};

export default App;
