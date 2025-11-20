
import type { ProductData } from '../types';
import { parseNumeric } from './utils';

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
            // Fix: Strip Byte Order Mark (BOM), trim whitespace, AND enforce lowercase.
            // This ensures that 'SKU', 'Sku', and 'sku' in the CSV all map to 'sku' 
            // in our data processor, preventing empty dashboards from capitalized exports.
            transformHeader: (header: string) => {
                return header.trim().replace(/^\ufeff/, '').toLowerCase();
            },
            complete: (results: any) => {
                if (results.errors.length > 0) {
                    console.error('CSV parsing errors:', results.errors);
                    // We don't reject immediately on minor CSV errors (like trailing newlines), 
                    // but we log them. If no data was parsed, then we reject.
                    if (!results.data || results.data.length === 0) {
                         reject(new Error(`Failed to parse CSV file: ${results.errors.map((e: any) => e.message).join(', ')}`));
                         return;
                    }
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
