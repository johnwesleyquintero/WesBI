
import { GoogleGenAI, Type } from "@google/genai";
import type { ProductData } from '../types';

const summarizeDataForPrompt = (data: ProductData[]): string => {
    const totalSKUs = data.length;
    const totalUnits = data.reduce((sum, item) => sum + item.available, 0);

    const atRisk = data.filter(d => d.riskScore > 70).sort((a, b) => b.riskScore - a.riskScore).slice(0, 5);
    const hotItems = data.filter(d => d.sellThroughRate > 70).sort((a, b) => b.sellThroughRate - a.sellThroughRate).slice(0, 5);
    const agedInventory = data.filter(d => d.totalInvAgeDays > 180).sort((a, b) => b.totalInvAgeDays - a.totalInvAgeDays).slice(0, 5);

    return `
    FBA Inventory Analysis Report:
    - Total SKUs: ${totalSKUs}
    - Total Available Units: ${totalUnits}

    Top 5 High-Risk SKUs (by risk score):
    ${atRisk.map(d => `- SKU: ${d.sku}, Risk Score: ${d.riskScore}, Available: ${d.available}, Avg Age: ${d.totalInvAgeDays} days`).join('\n') || 'None'}

    Top 5 Hot-Selling SKUs (by sell-through rate):
    ${hotItems.map(d => `- SKU: ${d.sku}, Sell-Through: ${d.sellThroughRate}%, Available: ${d.available}`).join('\n') || 'None'}

    Top 5 Oldest Inventory SKUs (by average age):
    ${agedInventory.map(d => `- SKU: ${d.sku}, Avg Age: ${d.totalInvAgeDays} days, Available: ${d.available}`).join('\n') || 'None'}
    `;
};

export const getInsightsFromGemini = async (data: ProductData[]): Promise<string[]> => {
    if (!data || data.length === 0) return [];
    
    if (!process.env.API_KEY) {
        console.warn("API_KEY environment variable not set. Returning mock insights.");
        return [
            "SKU with high sell-through but low stock requires immediate reordering to prevent stockouts.",
            "A significant portion of inventory is aged over 180 days. Consider running a promotional campaign.",
            "High-risk SKUs are tying up capital. Evaluate liquidating this inventory to improve cash flow."
        ];
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const dataSummary = summarizeDataForPrompt(data);
        const prompt = `
        You are WesBI, an expert FBA (Fulfillment by Amazon) operations analyst.
        Based on the following FBA inventory data summary, provide 3 to 5 concise, actionable business insights.
        Focus on opportunities to increase profit, reduce fees, and improve inventory health.
        Do not repeat the data summary. Provide only the insights.

        Data Summary:
        ${dataSummary}
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        insights: {
                            type: Type.ARRAY,
                            description: "An array of 3 to 5 actionable business insights.",
                            items: {
                                type: Type.STRING
                            }
                        }
                    },
                    required: ["insights"]
                }
            }
        });
        
        const jsonResponse = JSON.parse(response.text);
        return jsonResponse.insights || [];

    } catch (error) {
        console.error("Error fetching insights from Gemini:", error);
        return ["Failed to generate AI insights. Please check your API key and network connection."];
    }
};
