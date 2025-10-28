import { GoogleGenAI, Type } from "@google/genai";
import { SnackIdea } from '../types';

export const generateSnackIdeas = async (ingredients: string[]): Promise<SnackIdea[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `Generate 5 creative snack ideas using some of the following ingredients: ${ingredients.join(', ')}. Provide a unique name for each snack and a list of key ingredients.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            snackName: {
                                type: Type.STRING,
                                description: 'The creative name of the snack.',
                            },
                            ingredients: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.STRING,
                                },
                                description: 'The key ingredients for the snack.',
                            },
                        },
                        propertyOrdering: ["snackName", "ingredients"],
                    },
                },
            },
        });
        
        const jsonText = response.text.trim();
        if (!jsonText) {
            return [];
        }
        const ideas: SnackIdea[] = JSON.parse(jsonText);
        return ideas;

    } catch (error) {
        console.error("Error generating snack ideas:", error);
        throw new Error("Failed to generate snack ideas from AI.");
    }
};