import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface Subtitle {
  start: number;
  end: number;
  text: string;
}

export async function translateVideo(videoBase64: string, mimeType: string): Promise<Subtitle[]> {
  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              data: videoBase64,
              mimeType: mimeType,
            },
          },
          {
            text: "Analiza este video y traduce todo el audio hablado al español latinoamericano. Devuelve un JSON con una lista de objetos que contengan 'start' (segundo de inicio), 'end' (segundo de fin) y 'text' (traducción al español). Asegúrate de que los tiempos sean precisos para el doblaje.",
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            start: { type: Type.NUMBER },
            end: { type: Type.NUMBER },
            text: { type: Type.STRING },
          },
          required: ["start", "end", "text"],
        },
      },
    },
  });

  const result = await model;
  try {
    return JSON.parse(result.text || "[]");
  } catch (e) {
    console.error("Error parsing Gemini response:", e);
    return [];
  }
}

export async function generateSpeech(text: string, voiceName: string = 'Kore'): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Di con tono natural y claro: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("Error generating speech:", error);
    return null;
  }
}
