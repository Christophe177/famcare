
export enum ViewType {
  DASHBOARD = 'DASHBOARD',
  PATIENTS = 'PATIENTS',
  PREGNANCY_CARE = 'PREGNANCY_CARE',
  AI_ASSISTANT = 'AI_ASSISTANT',
  DOCTOR_PORTAL = 'DOCTOR_PORTAL',
  EMERGENCY_DISPATCH = 'EMERGENCY_DISPATCH',
  SETTINGS = 'SETTINGS'
}

export type AppMode = 'DOCTOR_DESKTOP' | 'PATIENT_MOBILE';

export type RiskLevel = 'low' | 'medium' | 'high';

export type AppointmentStatus = 'pending' | 'approved' | 'rescheduled' | 'declined';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  reason: string;
  status: AppointmentStatus;
  timestamp: Date;
}

export interface VitalLog {
  id: string;
  date: string;
  systolic: number;
  diastolic: number;
  weight: number;
  fetalKicks: number;
  symptoms: string[];
  riskLevel: RiskLevel;
}

export interface PatientRecord {
  id: string;
  name: string;
  age: number;
  bloodType: string;
  emergencyContact: string;
  allergies: string[];
  weeks: number;
  lastBp: string;
  riskLevel: RiskLevel;
  location: { lat: number; lng: number };
  lastUpdate: string;
  triageHistory: Message[];
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  riskUpdate?: RiskLevel;
}
