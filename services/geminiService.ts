
import { GoogleGenAI } from "@google/genai";
import { MockupOptions, ChatMessage, Resolution } from "../types";

export class GeminiService {
  private async withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 2000): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      const isQuotaError = error.message?.includes('429') || error.status === 429 || error.message?.includes('RESOURCE_EXHAUSTED');
      if (isQuotaError && retries > 0) {
        console.warn(`Quota exceeded, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.withRetry(fn, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  /**
   * Generates a base mockup with models/products only
   */
  async generateBaseMockup(category: string, options: MockupOptions, chatHistory: ChatMessage[], resolution: Resolution): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const chatContext = chatHistory.length > 0 
      ? `Solicitudes adicionales: ${chatHistory.map(m => m.content).join('. ')}` 
      : '';

    const fullPrompt = `Como fotógrafo profesional experto de MOCKUPS-PROSTUDIO, crea una imagen cuadrada de un ${category} completamente en BLANCO.
      Detalles: ${options.quantity} unidades, etnia ${options.ethnicity}, rasgos ${options.physicalTrait}, género ${options.gender}, estilo ${options.style}, en ${options.location} (${options.city}).
      Ambiente: ${options.environment}.
      Resolución solicitada: ${resolution}.
      ${chatContext}
      IMPORTANTE: El producto debe estar vacío, sin logos ni diseños. Calidad fotográfica comercial de alto nivel para el mercado de Etsy USA.`;

    let modelName: string;
    let imageSize: '1K' | '2K' | '4K' | undefined;

    switch (resolution) {
      case '8K Expert':
        modelName = 'gemini-3-pro-image-preview';
        imageSize = '4K';
        break;
      case 'UHD':
        modelName = 'gemini-3-pro-image-preview';
        imageSize = '2K';
        break;
      case 'HD':
        modelName = 'gemini-3-pro-image-preview';
        imageSize = '1K';
        break;
      default: // Baja, Media
        modelName = 'gemini-2.5-flash-image';
        break;
    }

    return this.withRetry(async () => {
      const config: any = { imageConfig: { aspectRatio: "1:1" } };
      if (imageSize) {
        config.imageConfig.imageSize = imageSize;
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: { parts: [{ text: fullPrompt }] },
        config: config
      });

      const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (part?.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      throw new Error("No se pudo generar la imagen base.");
    });
  }

  /**
   * Applies design with ultra-precision to foreground products only
   */
  async applyAndResizeDesign(base64Mockup: string, designImage: string, size: number, resolution: Resolution, chatHistory: ChatMessage[] = []): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const cleanMockup = base64Mockup.split(',')[1] || base64Mockup;
    const cleanDesign = designImage.split(',')[1] || designImage;

    const chatContext = chatHistory.length > 0 
      ? `Ajustes específicos: ${chatHistory.map(m => m.content).join('. ')}` 
      : '';

    const prompt = `
      SISTEMA DE CALIBRACIÓN DE PRECISIÓN MOCKUPS-PROSTUDIO.
      Input 1: Escena base.
      Input 2: Gráfico de diseño.

      REGLAS DE MONTAJE DE ALTA PRECISIÓN:
      1. SEGMENTACIÓN DE PRIMER PLANO: Identifica quirúrgicamente los productos (camisetas, tazas, bolsos) que están en el PRIMER PLANO de la imagen. El diseño debe aplicarse ÚNICAMENTE a estos elementos. IGNORA totalmente sujetos u objetos de fondo o entorno, NO LOS AFECTES EN ABSOLUTO.
      2. MAPEO DE DESPLAZAMIENTO HIPERREALISTA: El diseño debe deformarse siguiendo con precisión absoluta los pliegues, arrugas, curvas y textura del material (tela, cerámica, etc.). DEBE INTEGRARSE FÍSICAMENTE como si estuviera impreso sobre el objeto, no como una calcomanía plana.
      3. INTEGRACIÓN LUMINOSA INTELIGENTE: El gráfico DEBE heredar los gradientes de luz, sombras proyectadas y reflejos ambientales de la imagen original. Si hay un pliegue oscuro, el diseño debe oscurecerse en esa zona exacta con coherencia.
      4. ESCALA MILIMÉTRICA UNIFORME: Escala el diseño al ${size}% del área imprimible del pecho/frontal/superficie de forma consistente y en PROPORCIÓN IDÉNTICA en TODOS los sujetos del primer plano.
      5. RESOLUCIÓN EXPERTA: Output en calidad ${resolution}.
      6. ${chatContext}
      7. PRESERVACIÓN ABSOLUTA: No cambies rasgos faciales, fondos, poses ni ningún elemento que no sea la superficie del producto en primer plano.
    `;

    let modelName: string;
    let imageSize: '1K' | '2K' | '4K' | undefined;

    switch (resolution) {
      case '8K Expert':
        modelName = 'gemini-3-pro-image-preview';
        imageSize = '4K';
        break;
      case 'UHD':
        modelName = 'gemini-3-pro-image-preview';
        imageSize = '2K';
        break;
      case 'HD':
        modelName = 'gemini-3-pro-image-preview';
        imageSize = '1K';
        break;
      default: // Baja, Media
        modelName = 'gemini-2.5-flash-image';
        break;
    }

    return this.withRetry(async () => {
      const config: any = { imageConfig: { aspectRatio: "1:1" } };
      if (imageSize) {
        config.imageConfig.imageSize = imageSize;
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [
            { inlineData: { data: cleanMockup, mimeType: 'image/png' } },
            { inlineData: { data: cleanDesign, mimeType: 'image/png' } },
            { text: prompt }
          ]
        },
        config: config
      });

      const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (part?.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      throw new Error("Error en la calibración de precisión.");
    });
  }
}

export const geminiService = new GeminiService();