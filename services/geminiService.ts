import { GoogleGenAI, Type, GenerateContentResponse, Modality, FunctionDeclaration } from "@google/genai";
import { 
  CLINICAL_TRIAGE_PROMPT, 
  FAMILY_ASSISTANT_PROMPT, 
  GROUNDING_MAPS_PROMPT, 
  LIVE_AUDIO_PROMPT, 
  JOURNAL_ANALYSIS_PROMPT 
} from "./prompts";

export interface TriageResult {
  advice: string;
  riskLevel: 'low' | 'medium' | 'high';
  recommendedAction: string;
  triggeredFunctions?: any[];
}

const handleApiError = async (error: any) => {
  console.error("Gemini API Error:", error);
  if (error?.message?.includes("Requested entity was not found") || error?.message?.includes("API_KEY")) {
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
    }
  }
};

/**
 * Triage Logic: Utilizes Gemini 3 Pro for Complex Reasoning
 * This ensures danger signs are correctly identified via the system instruction.
 */
export const getPatientRiskAssessment = async (message: string, history: string, patientInfo?: string): Promise<TriageResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `[PATIENT PROFILE]\n${patientInfo}\n\n[HISTORY]\n${history}\n\n[USER INPUT]\n${message}`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Highest reasoning capability for medical safety
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: CLINICAL_TRIAGE_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            advice: { type: Type.STRING },
            riskLevel: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
            recommendedAction: { type: Type.STRING }
          },
          required: ["advice", "riskLevel", "recommendedAction"]
        }
      },
    });
    
    return JSON.parse(response.text || '{}');
  } catch (error) {
    await handleApiError(error);
    return {
      advice: "I'm having trouble analyzing your symptoms. If you feel unwell, please contact your local health center immediately.",
      riskLevel: 'medium',
      recommendedAction: "Seek immediate medical consultation."
    };
  }
};

/**
 * Assistant Logic: Utilizes Gemini 3 Flash for fast, conversational support.
 */
export const getFamilyAdvice = async (message: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: message }] }],
      config: {
        systemInstruction: FAMILY_ASSISTANT_PROMPT,
      }
    });
    return response.text || "I'm sorry, I'm resting my circuits. Try again soon!";
  } catch (error) {
    await handleApiError(error);
    return "Umuseke is currently offline.";
  }
};

/**
 * Hospital Grounding: Uses Gemini 2.5 Flash as it's the only model supporting Maps tool.
 */
export const trackEmergencyLocation = async (patientName: string, lat: number, lng: number): Promise<{ text: string; links: any[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Required for tool support
      contents: [{ parts: [{ text: `Find hospitals near patient ${patientName} at [${lat}, ${lng}].` }] }],
      config: {
        systemInstruction: GROUNDING_MAPS_PROMPT,
        tools: [{ googleMaps: {} }],
        toolConfig: { retrievalConfig: { latLng: { latitude: lat, longitude: lng } } }
      },
    });
    const links = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { text: response.text || "Scanning Rwandan health grid...", links: links };
  } catch (error) {
    await handleApiError(error);
    return { text: "Location services unavailable.", links: [] };
  }
}

/**
 * Live Audio: Native multimodal stream.
 */
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
      systemInstruction: LIVE_AUDIO_PROMPT,
    },
  });
};

/**
 * Journal NLP: Gemini 3 Flash for efficient feature extraction.
 */
export const analyzeJournalEntry = async (entry: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: entry }] }],
      config: {
        systemInstruction: JOURNAL_ANALYSIS_PROMPT,
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
      },
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    await handleApiError(error);
    return { sentiment: "Neutral", summary: "Analysis failed.", recommendations: [] };
  }
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
