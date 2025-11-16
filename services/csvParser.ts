
import type { ProductData } from '../types';

// --- Data processing functions moved from worker.js to centralize logic ---

/**
 * Calculates a risk score for a product based on inventory age, sell-through,
 * and stock levels. This logic was formerly in the web worker.
 * @param {Omit<ProductData, 'riskScore'>} item - The product data item.
 * @returns {number} A risk score from 0 to 100.
 */
const calculateRiskScore = (item: Omit<ProductData, 'riskScore'>): number => {
    let score = 0;
    const { totalInvAgeDays, available, shippedT30, pendingRemoval } = item;

    if (totalInvAgeDays > 365) score += 40;
    else if (totalInvAgeDays > 180) score += 25;
    else if (totalInvAgeDays > 90) score += 10;
    
    const sellThrough = available + shippedT30 > 0 ? (shippedT30 / (available + shippedT30)) * 100 : 0;
    if (sellThrough < 10) score += 30;
    else if (sellThrough < 25) score += 20;
    else if (sellThrough < 50) score += 10;
    
    if (pendingRemoval > 10) score += 20;
    else if (pendingRemoval > 5) score += 10;
    
    if (available < 5 && shippedT30 > 20) score += 15;
    
    return Math.min(score, 100);
};


/**
 * Transforms raw CSV row objects into structured ProductData, calculating derived fields.
 * This logic was formerly in the web worker.
 * @param {any[]} results - Array of row objects from PapaParse.
 * @returns {ProductData[]} Array of processed ProductData objects.
 */
const parseAndProcessData = (results: any[]): ProductData[] => {
    return results.map((row) => {
        const available = Number(row['available'] || 0);
        const shippedT30 = Number(row['units-shipped-t30'] || 0);

        const invAge0to90 = Number(row['inv-age-0-to-90-days'] || 0);
        const invAge91to180 = Number(row['inv-age-91-to-180-days'] || 0);
        const invAge181to270 = Number(row['inv-age-181-to-270-days'] || 0);
        const invAge271to365 = Number(row['inv-age-271-to-365-days'] || 0);
        const invAge365plus = Number(row['inv-age-365-plus-days'] || 0);

        const totalInv = invAge0to90 + invAge91to180 + invAge181to270 + invAge271to365 + invAge365plus;
        const avgAge = totalInv > 0 ? (
            (invAge0to90 * 45) +
            (invAge91to180 * 135) +
            (invAge181to270 * 225) +
            (invAge271to365 * 318) +
            (invAge365plus * 400) 
        ) / totalInv : 0;
        
        const partialData: Omit<ProductData, 'riskScore'> = {
            sku: row['sku'] || '',
            asin: row['asin'] || '',
            name: row['product-name'] || '',
            condition: row['condition'] || '',
            available: available,
            pendingRemoval: Number(row['pending-removal-quantity'] || 0),
            invAge0to90,
            invAge91to180,
            invAge181to270,
            invAge271to365,
            invAge365plus,
            totalInvAgeDays: Math.round(avgAge),
            shippedT30: shippedT30,
            sellThroughRate: available + shippedT30 > 0 ? Math.round((shippedT30 / (available + shippedT30)) * 100) : 0,
            recommendedAction: row['recommended-action'] || 'No Action',
            category: row['category'] || 'Unknown',
        };

        const riskScore = calculateRiskScore(partialData);
        return { ...partialData, riskScore };
    });
};


/**
 * Parses a CSV file using PapaParse on the main thread.
 * This function has been refactored to remove the Web Worker to address
 * production stability issues. The data transformation logic is now included here.
 * @param {File} file - The CSV file to be parsed and processed.
 * @returns {Promise<ProductData[]>} A promise that resolves to an array of processed product data.
 */
export const parseCSV = (file: File): Promise<ProductData[]> => {
    return new Promise((resolve, reject) => {
        // PapaParse is loaded from a CDN and available on the window object.
        if (!window.Papa) {
            return reject(new Error('PapaParse library is not available. This might be a network issue.'));
        }

        window.Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results: any) => {
                if (results.errors.length > 0) {
                    console.error('CSV parsing errors:', results.errors);
                    reject(new Error(`Failed to parse CSV file: ${results.errors.map((e: any) => e.message).join(', ')}`));
                    return;
                }
                try {
                    const processedData = parseAndProcessData(results.data);
                    resolve(processedData);
                } catch (e: any) {
                    console.error('Error processing data:', e);
                    reject(new Error(e.message || 'An unexpected error occurred during data processing.'));
                }
            },
            error: (error: Error) => {
                console.error('CSV parsing critical error:', error);
                reject(error);
            }
        });
    });
};
