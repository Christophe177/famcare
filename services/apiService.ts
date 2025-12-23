
import { PatientRecord, Appointment, RiskLevel, Message } from '../types';

const API_BASE_URL = 'http://localhost:8000';

export const apiService = {
  async fetchPatients(): Promise<PatientRecord[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/patients`);
      if (!response.ok) throw new Error('Backend unreachable');
      const data = await response.json();
      return data.map((p: any) => ({
        ...p,
        location: { lat: p.lat, lng: p.lng },
        triageHistory: p.triage_history.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }))
      }));
    } catch (err) {
      console.warn("Using local fallback data - Backend not detected.");
      throw err;
    }
  },

  async fetchAppointments(): Promise<Appointment[]> {
    const response = await fetch(`${API_BASE_URL}/appointments`);
    if (!response.ok) throw new Error('Failed to fetch appointments');
    const data = await response.json();
    return data.map((a: any) => ({
      ...a,
      timestamp: new Date() // Simplified for demo
    }));
  },

  async createAppointment(appointment: Appointment): Promise<Appointment> {
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...appointment,
        status: appointment.status || 'pending'
      }),
    });
    if (!response.ok) throw new Error('Failed to save appointment');
    return await response.json();
  },

  async updatePatientTriage(patientId: string, riskLevel: RiskLevel, message: Message): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/triage`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        riskLevel, 
        message: {
          role: message.role,
          text: message.text
        }
      }),
    });
    if (!response.ok) throw new Error('Failed to update triage');
  }
};
