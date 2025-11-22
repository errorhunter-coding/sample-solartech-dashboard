import { GoogleGenAI, Type } from "@google/genai";
import { IdentifiedFault } from '../types';

// Helper to get API key safely
const getApiKey = (): string => {
  const key = process.env.API_KEY;
  if (!key) {
    console.error("API_KEY is missing from environment variables.");
    return "";
  }
  return key;
};

export const sendChatMessage = async (history: { role: string, parts: { text: string }[] }[], message: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    // Using gemini-3-pro-preview as requested for chatbot
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      history: history,
      config: {
        systemInstruction: "You are SolarBot, an expert AI assistant for solar panel maintenance, electrical engineering, and renewable energy efficiency. Be concise, helpful, and professional.",
      }
    });

    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "I'm having trouble connecting to the solar network right now. Please try again later.";
  }
};

export const analyzeSolarImage = async (base64Image: string, mimeType: string): Promise<IdentifiedFault[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });

    // Schema for structured output
    const responseSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ['micro-crack', 'hotspot', 'soiling', 'delamination', 'discoloration', 'corrosion', 'other'] },
          confidence: { type: Type.NUMBER },
          severity: { type: Type.STRING, enum: ['Low', 'Medium', 'High', 'Critical'] },
          recommendation: { type: Type.STRING }
        },
        required: ['type', 'confidence', 'severity', 'recommendation']
      }
    };

    // Using gemini-3-pro-preview for high quality vision reasoning
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          },
          {
            text: "Analyze this solar panel image for faults. Identify issues like micro-cracks, hotspots, soiling, shading, delamination, discoloration, or corrosion. Provide a confidence score (0-100), severity level, and maintenance recommendation for each fault found."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as IdentifiedFault[];
    }
    return [];
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    // Return a fallback error object disguised as a fault so the UI handles it gracefully
    return [{
      type: 'other',
      confidence: 0,
      severity: 'Low',
      recommendation: "Failed to analyze image. Please try again."
    }];
  }
};
