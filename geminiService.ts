
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Generates product descriptions using Gemini API.
 * Refactored to follow @google/genai guidelines.
 */
export const generateProductDescription = async (name: string, brand: string, attributes: string) => {
  try {
    // Create a new instance for the request to ensure up-to-date API key usage
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a short and long description for a product named "${name}" by brand "${brand}". Attributes: ${attributes}. Format the response as JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            shortDescription: { type: Type.STRING },
            longDescription: { type: Type.STRING }
          },
          required: ["shortDescription", "longDescription"]
        }
      }
    });
    
    // .text is a property, not a method
    const text = response.text;
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Gemini Content Generation Error:", error);
    return null;
  }
};
