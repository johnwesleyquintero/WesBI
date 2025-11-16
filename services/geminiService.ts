import { GoogleGenAI, Type } from "@google/genai";
import type { ProductData } from '../types';

const summarizeDataForPrompt = (data: ProductData[]): string => {
    const totalSKUs = data.length;
    const totalUnits = data.reduce((sum, item) => sum + item.available, 0);
    const totalInventoryValue = data.reduce((sum, item) => sum + (item.inventoryValue || 0), 0);

    const atRisk = data.filter(d => d.riskScore > 70);
    const capitalAtRisk = atRisk.reduce((sum, item) => sum + (item.inventoryValue || 0), 0);
    const topAtRiskByValue = atRisk.sort((a, b) => (b.inventoryValue || 0) - (a.inventoryValue || 0)).slice(0, 5);

    const hotItems = data.filter(d => d.sellThroughRate > 70).sort((a, b) => b.sellThroughRate - a.sellThroughRate).slice(0, 5);
    const agedInventory = data.filter(d => d.totalInvAgeDays > 180).sort((a, b) => b.totalInvAgeDays - a.totalInvAgeDays).slice(0, 5);

    return `
    FBA Inventory Analysis Report:
    - Total SKUs: ${totalSKUs}
    - Total Available Units: ${totalUnits}
    - Total Inventory Value: $${Math.round(totalInventoryValue).toLocaleString()}
    - Total Capital At Risk (Risk Score > 70): $${Math.round(capitalAtRisk).toLocaleString()}

    Top 5 At-Risk SKUs (by inventory value):
    ${topAtRiskByValue.map(d => `- SKU: ${d.sku}, Inv. Value: $${Math.round(d.inventoryValue || 0).toLocaleString()}, Risk: ${d.riskScore}, Units: ${d.available}`).join('\n') || 'None'}

    Top 5 Hot-Selling SKUs (by sell-through rate):
    ${hotItems.map(d => `- SKU: ${d.sku}, Sell-Through: ${d.sellThroughRate}%, Available: ${d.available}`).join('\n') || 'None'}

    Top 5 Oldest Inventory SKUs (by average age):
    ${agedInventory.map(d => `- SKU: ${d.sku}, Avg Age: ${d.totalInvAgeDays} days, Available: ${d.available}`).join('\n') || 'None'}
    `;
};

export const getInsightsFromGemini = async (data: ProductData[], apiKey: string): Promise<string[]> => {
    if (!data || data.length === 0) return [];
    
    if (!apiKey) {
        console.warn("User API_KEY not set. Returning informational insight.");
        return [
            "AI features are enabled, but no Gemini API key is configured. Please add your key in the settings (cog icon) to generate insights.",
        ];
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const dataSummary = summarizeDataForPrompt(data);
        const prompt = `
        You are WesBI, an expert FBA (Fulfillment by Amazon) operations analyst.
        Based on the following FBA inventory data summary, provide 3 to 5 concise, actionable business insights.
        Focus on opportunities to increase profit, reduce fees, unlock cash flow, and improve inventory health.
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

export const getStrategyFromGemini = async (data: ProductData[], goal: string, apiKey: string): Promise<string> => {
    if (!data || data.length === 0) return "No data available to generate a strategy.";
    if (!apiKey) return "Cannot generate strategy: Gemini API key is not configured in settings.";

    try {
        const ai = new GoogleGenAI({ apiKey });
        const dataSummary = summarizeDataForPrompt(data);
        const prompt = `
        You are WesBI, an expert FBA (Fulfillment by Amazon) operations analyst and strategist.
        Based on the following FBA inventory data summary, generate a detailed, actionable strategic plan to achieve the following business goal: "${goal}".

        Your plan should be formatted in Markdown and include:
        1.  A brief **Objective** statement.
        2.  A list of **Key Priorities** (2-3 bullet points).
        3.  A **Step-by-Step Action Plan** with specific, numbered actions. If relevant, mention specific SKUs from the data summary.
        4.  A concluding **Expected Outcome** statement.

        Do not repeat the raw data summary. Focus on clear, operational steps.

        Data Summary:
        ${dataSummary}
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        
        return response.text;

    } catch (error) {
        console.error("Error fetching strategy from Gemini:", error);
        return "Failed to generate AI Strategy. Please check your API key and network connection. The model may also be overloaded.";
    }
};