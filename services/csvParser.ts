
import type { ProductData } from '../types';
import { parseNumeric } from './utils';

type FinancialDataMap = Map<string, { cogs: number; price: number }>;

/**
 * Parses the primary FBA snapshot CSV file using PapaParse on the main thread.
 * @param {File} file - The FBA snapshot CSV file.
 * @returns {Promise<any[]>} A promise that resolves to an array of raw row objects.
 */
export const parseCSV = (file: File): Promise<any[]> => {
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
                resolve(results.data);
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