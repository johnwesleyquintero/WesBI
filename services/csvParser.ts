import type { ProductData } from '../types';
import { calculateRiskScore } from './dataProcessor';

/**
 * Safely parses a value into a number. Returns 0 if the value is not a valid number.
 * @param val The value to parse.
 * @returns A valid number.
 */
const parseNumeric = (val: any): number => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
};

/**
 * Transforms raw CSV row objects into structured ProductData, calculating derived fields.
 * This logic was formerly in the web worker.
 * @param {any[]} results - Array of row objects from PapaParse.
 * @returns {ProductData[]} Array of processed ProductData objects.
 */
const parseAndProcessData = (results: any[]): ProductData[] => {
    const mappedData = results.map((row): ProductData | null => {
        const sku = row['sku'] || '';
        if (!sku) {
            return null; // This row is invalid, mark for removal
        }

        const available = parseNumeric(row['available']);
        const shippedT30 = parseNumeric(row['units-shipped-t30']);

        const invAge0to90 = parseNumeric(row['inv-age-0-to-90-days']);
        const invAge91to180 = parseNumeric(row['inv-age-91-to-180-days']);
        const invAge181to270 = parseNumeric(row['inv-age-181-to-270-days']);
        const invAge271to365 = parseNumeric(row['inv-age-271-to-365-days']);
        const invAge365plus = parseNumeric(row['inv-age-365-plus-days']);

        const totalInv = invAge0to90 + invAge91to180 + invAge181to270 + invAge271to365 + invAge365plus;
        const avgAge = totalInv > 0 ? (
            (invAge0to90 * 45) +
            (invAge91to180 * 135) +
            (invAge181to270 * 225) +
            (invAge271to365 * 318) +
            (invAge365plus * 400) 
        ) / totalInv : 0;
        
        const partialData: Omit<ProductData, 'riskScore'> = {
            sku: sku,
            asin: row['asin'] || '',
            name: row['product-name'] || '',
            condition: row['condition'] || '',
            available: available,
            pendingRemoval: parseNumeric(row['pending-removal-quantity']),
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

    return mappedData.filter((item): item is ProductData => item !== null);
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