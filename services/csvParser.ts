import type { ProductData } from '../types';
import { calculateRiskScore } from './dataProcessor';

type FinancialDataMap = Map<string, { cogs: number; price: number }>;

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
 * Transforms raw CSV row objects into structured ProductData, calculating derived fields
 * and enriching with financial data from the lookup map.
 * @param {any[]} results - Array of row objects from PapaParse.
 * @param {FinancialDataMap} financialDataMap - A map of SKU to its cost and price.
 * @returns {ProductData[]} Array of processed ProductData objects.
 */
const parseAndProcessData = (results: any[], financialDataMap: FinancialDataMap): ProductData[] => {
    const mappedData = results.map((row): ProductData | null => {
        const sku = (row['sku'] || '').trim();
        if (!sku) {
            return null; // This row is invalid, mark for removal
        }

        const financialLookup = financialDataMap.get(sku);

        const available = parseNumeric(row['available']);
        const shippedT30 = parseNumeric(row['units-shipped-t30']);
        // Precedence: 1. Financial file, 2. FBA file, 3. Default to 0
        const cogs = financialLookup?.cogs ?? parseNumeric(row['cogs']);
        const price = financialLookup?.price ?? parseNumeric(row['price']);

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
            cogs: cogs,
            price: price,
            inventoryValue: available * cogs,
            potentialRevenue: available * price,
            grossProfitPerUnit: price - cogs,
        };

        const riskScore = calculateRiskScore(partialData);
        return { ...partialData, riskScore };
    });

    return mappedData.filter((item): item is ProductData => item !== null);
};


/**
 * Parses the primary FBA snapshot CSV file using PapaParse on the main thread.
 * @param {File} file - The FBA snapshot CSV file.
 * @param {FinancialDataMap} financialDataMap - The pre-parsed map of financial data.
 * @returns {Promise<ProductData[]>} A promise that resolves to an array of processed product data.
 */
export const parseCSV = (file: File, financialDataMap: FinancialDataMap): Promise<ProductData[]> => {
    return new Promise((resolve, reject) => {
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
                    const processedData = parseAndProcessData(results.data, financialDataMap);
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

/**
 * Parses a financial lookup CSV file into a Map for efficient data joining.
 * Expected columns: 'sku', 'cogs', 'price'.
 * @param {File} file - The financial data CSV file.
 * @returns {Promise<FinancialDataMap>} A promise that resolves to the financial data map.
 */
export const parseFinancialCSV = (file: File): Promise<FinancialDataMap> => {
    return new Promise((resolve, reject) => {
        if (!window.Papa) {
            return reject(new Error('PapaParse library is not available.'));
        }
        
        const financialMap: FinancialDataMap = new Map();

        window.Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results: any) => {
                if (results.errors.length > 0) {
                     reject(new Error(`Error parsing financial file: ${results.errors[0].message}`));
                     return;
                }
                for (const row of results.data) {
                    const sku = (row.sku || '').trim();
                    if (sku) {
                        financialMap.set(sku, {
                            cogs: parseNumeric(row.cogs),
                            price: parseNumeric(row.price),
                        });
                    }
                }
                resolve(financialMap);
            },
            error: (err: Error) => reject(err),
        });
    });
};