import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";

export interface TriageResult {
  advice: string;
  riskLevel: 'low' | 'medium' | 'high';
  recommendedAction: string;
}

/**
 * Helper to handle key selection dialog. 
 * We don't re-throw here so the calling function can return a safe fallback.
 */
const handleApiError = async (error: any) => {
  console.error("Gemini API Error:", error);
  if (error?.message?.includes("Requested entity was not found") || error?.message?.includes("API_KEY")) {
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
    }
  }
};

/**
 * Patient-facing risk assessment - using Gemini 3 Pro for complex reasoning
 */
export const getPatientRiskAssessment = async (message: string, history: string): Promise<TriageResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Conversation History: ${history}\n\nPatient Message: ${message}`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: `You are the FamCare Patient AI, powered by Gemini 3. Your primary job is to monitor pregnancy risk. Analyze symptoms and provide advice, riskLevel, and recommendedAction in JSON format.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            advice: { type: Type.STRING },
            riskLevel: { type: Type.STRING }, // Use string to allow any value, though we aim for enum
            recommendedAction: { type: Type.STRING }
          },
          required: ["advice", "riskLevel", "recommendedAction"]
        }
      },
    });
    
    const text = response.text || '{}';
    return JSON.parse(text) as TriageResult;
  } catch (error) {
    await handleApiError(error);
    return {
      advice: "I'm having trouble analyzing your symptoms right now. Please rest and contact your OBGYN immediately if you are concerned.",
      riskLevel: 'medium',
      recommendedAction: "Please contact your healthcare provider for a manual check-up."
    };
  }
};

/**
 * General family advice - using Gemini 3 Flash
 */
export const getFamilyAdvice = async (message: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: message }] }],
      config: {
        systemInstruction: "You are the FamCare General Assistant. Help families with organization and general parenting tips.",
      }
    });
    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    await handleApiError(error);
    return "I'm having trouble connecting right now. Please try again in a moment.";
  }
};

/**
 * Emergency hospital discovery using Google Maps Grounding
 */
export const trackEmergencyLocation = async (patientName: string, lat: number, lng: number): Promise<{ text: string; links: any[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: `Identify the nearest hospitals with Level III or IV NICU for patient ${patientName} at [${lat}, ${lng}]. Provide direct navigation URIs.` }] }],
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      },
    });

    const links = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return {
      text: response.text || "Analyzing medical infrastructure nearby...",
      links: links
    };
  } catch (error) {
    await handleApiError(error);
    return { text: "Error locating nearby hospitals via Satellite Link.", links: [] };
  }
}

export interface JournalAnalysis {
  sentiment: string;
  summary: string;
  recommendations: string[];
}

export const analyzeJournalEntry = async (content: string): Promise<JournalAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: content }] }],
      config: {
        systemInstruction: "Analyze journal entry for mood, summary, and recommendations.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: { type: Type.STRING },
            summary: { type: Type.STRING },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["sentiment", "summary", "recommendations"]
        }
      }
    });
    const text = response.text || '{}';
    return JSON.parse(text) as JournalAnalysis;
  } catch (error) {
    await handleApiError(error);
    return { sentiment: "Neutral", summary: "Entry recorded safely.", recommendations: ["Consider reflecting on this entry later today."] };
  }
};

export const connectToLiveCare = (callbacks: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
      },
      systemInstruction: 'You are an empathetic medical assistant for pregnant women. Listen carefully and provide comfort and health guidance.',
    },
  });
};

export function encodeAudio(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) { binary += String.fromCharCode(bytes[i]); }
  return btoa(binary);
}

export function decodeAudio(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); }
  return bytes;
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) { channelData[i] = dataInt16[i * numChannels + channel] / 32768.0; }
  }
  return buffer;
}
