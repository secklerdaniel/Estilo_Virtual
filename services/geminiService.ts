import { GoogleGenAI, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
};

export const generateFlatLay = async (images: { base64: string }[]): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash-image';
    const prompt = `Você é um estilista de moda super criativo. Usando as peças de roupa fornecidas crie uma composição de 'flat lay' premium, estilo catálogo de moda de luxo digital. Todas as peças devem ter o seu destaque. Use um fundo cinza claro e uniforme. As peças devem formar um quadrado perfeito centralizado. Gere apenas a imagem, sem nenhum texto adicional.`;
    
    const imageParts = images.map(img => fileToGenerativePart(img.base64, 'image/png'));

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: prompt }, ...imageParts],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    // FIX: Iterate through response parts to find the generated image,
    // as its position in the array is not guaranteed.
    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    
    throw new Error("Nenhuma imagem foi gerada. A resposta pode ter sido bloqueada.");

  } catch (error) {
    console.error("Erro ao gerar flat lay:", error);
    throw new Error("Não foi possível criar o flat lay. Tente novamente.");
  }
};

export const generateBaseModel = async (userImageBase64: string): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash-image';
    const prompt = `Você é um fotógrafo de moda profissional com IA. Transforme a pessoa nesta imagem em uma foto de modelo de corpo inteiro, adequada para um teste virtual. **Importante: vista a pessoa com uma camiseta regata e bermuda pretas simples, justas e lisas.** Esta roupa base deve ser bem neutra para servir como tela. O fundo deve ser um fundo de estúdio limpo e neutro (cinza claro, #f0f0f0). A pessoa deve ter uma expressão neutra e profissional de modelo. **Importante: mantenha 100% a identidade, as características únicas e o tipo físico da pessoa**. Coloque-a em uma pose padrão e relaxada de modelo em pé. A imagem final deve ser fotorrealista. Retorne SOMENTE a imagem final.`;
    
    const userImagePart = fileToGenerativePart(userImageBase64, 'image/jpeg');

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: prompt }, userImagePart],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    
    throw new Error("Nenhuma imagem de modelo base foi gerada. A resposta pode ter sido bloqueada.");

  } catch (error) {
    console.error("Erro ao gerar modelo base:", error);
    throw new Error("Não foi possível criar o modelo base. Tente com outra foto.");
  }
};


export const generateTryOn = async (userImageBase64: string, clothingImageBase64: string): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash-image';
    const prompt = `You are an expert AI for virtual try-on and outfit composition.  
You will receive:
- One **model image** (a person wearing basic clothes).
- One or more **garment images** (clothes to be worn by the model).

Your goal: **dress the person from the model image with ALL the garments provided**, creating a natural, realistic final photo.

### RULES (in order of importance):

1. **Preserve the model** — Keep the original person's face, hair, body, pose, and lighting untouched. Do NOT replace or alter them.

2. **Preserve the background** — The model image background must remain 100% intact.

3. **Remove base outfit** — Replace the base black t-shirt and leggings with neutral undergarments or invisible clothing, so the new garments can be overlaid naturally.

4. **Extract garments only** — From each garment image, isolate the clothing piece only. Ignore any people, poses, or backgrounds.

5. **Dress the model** — Fit all garments onto the model realistically, respecting layering (e.g., shirts under jackets) and adapting to body shape and pose with natural shadows and wrinkles.

6. **Consistency** — Match lighting, perspective, and color tone of garments to the model image.

7. **Final output** — Return only the completed dressed model image. Do not include text, borders, or watermarks.`;
    
    const userImagePart = fileToGenerativePart(userImageBase64, 'image/jpeg');
    const clothingImagePart = fileToGenerativePart(clothingImageBase64, 'image/png');

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [ { text: prompt }, userImagePart, clothingImagePart ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      }
    });

    // FIX: Iterate through response parts to find the generated image,
    // as its position in the array is not guaranteed.
    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    
    throw new Error("Nenhuma imagem de provador foi gerada. A resposta pode ter sido bloqueada.");
  } catch (error) {
    console.error("Erro ao gerar provador virtual:", error);
    throw new Error("Não foi possível gerar o provador virtual. Tente novamente.");
  }
};

export const changePose = async (baseImageBase64: string, poseInstruction: string): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash-image';
    const prompt = `You are an expert fashion photographer AI. Take this image and regenerate it from a different perspective. The person, clothing, and background style must remain identical. The new perspective should be: "${poseInstruction}". Return ONLY the final image.`;
    
    const imagePart = fileToGenerativePart(baseImageBase64, 'image/png');

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: prompt }, imagePart],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    
    throw new Error("Não foi possível mudar a pose da imagem. A resposta pode ter sido bloqueada.");

  } catch (error) {
    console.error("Erro ao mudar a pose:", error);
    throw new Error("Não foi possível mudar a pose. Tente novamente.");
  }
};