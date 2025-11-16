
import type { ProductData } from '../types';
import { transformRawData } from './dataProcessor';

/**
 * Parses a CSV file using PapaParse's built-in Web Worker.
 * This offloads the heavy parsing from the main UI thread to prevent freezing.
 * The transformation of the data happens on the main thread after parsing is complete.
 * @param {File} file - The CSV file to be parsed.
 * @returns {Promise<ProductData[]>} A promise that resolves to an array of processed product data.
 */
export const parseCSV = (file: File): Promise<ProductData[]> => {
    return new Promise((resolve, reject) => {
        if (!window.Papa) {
            // A guard in case PapaParse fails to load on the main page.
            return reject(new Error('PapaParse library is not loaded.'));
        }

        window.Papa.parse(file, {
            worker: true, // Use PapaParse's built-in worker for parsing
            header: true,
            skipEmptyLines: true,
            complete: (results: { data: any[]; errors: any[] }) => {
                // The 'results' object comes back from the worker to the main thread.
                // Now, we process/transform the raw data on the main thread.
                if (results.errors.length) {
                    console.error('CSV parsing errors:', results.errors);
                    // Provide a more specific error message if possible
                    const errorMsg = results.errors.map(e => e.message).join(', ');
                    reject(new Error(`Failed to parse CSV file: ${errorMsg}`));
                    return;
                }
                
                try {
                    const processedData = transformRawData(results.data);
                    resolve(processedData);
                } catch (e) {
                    console.error('Error processing parsed data:', e);
                    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
                    reject(new Error(`Failed to process data after parsing: ${errorMessage}`));
                }
            },
            error: (error: Error) => {
                console.error('A critical error occurred in the PapaParse worker:', error);
                reject(error);
            }
        });
    });
};
