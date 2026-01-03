
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";

export async function sendMessageToGemini(
  text: string,
  attachment?: { data: string; mimeType: string },
  history: { role: 'user' | 'model', text: string, attachment?: { data: string, mimeType: string } }[] = []
) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const contents = history.map(msg => {
    const parts: any[] = [{ text: msg.text || "Analiza el contenido adjunto." }];
    if (msg.attachment) {
      const base64Data = msg.attachment.data.split(',')[1];
      parts.push({
        inlineData: {
          mimeType: msg.attachment.mimeType,
          data: base64Data,
        },
      });
    }
    return { role: msg.role, parts };
  });

  const currentParts: any[] = [{ text: text || "Analiza este material y resuelve los ejercicios con precisión profesional." }];
  if (attachment) {
    const base64Data = attachment.data.split(',')[1];
    currentParts.push({
      inlineData: {
        mimeType: attachment.mimeType,
        data: base64Data,
      },
    });
  }
  contents.push({ role: 'user', parts: currentParts });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.3, // Menor temperatura para máxima precisión en datos
      },
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
