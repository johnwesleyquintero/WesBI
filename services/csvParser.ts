
import type { ProductData } from '../types';

/**
 * Parses a CSV file using a dedicated Web Worker (`/worker.js`).
 * This offloads both the heavy CSV parsing and the subsequent data transformation
 * from the main UI thread to prevent the application from freezing.
 * @param {File} file - The CSV file to be parsed and processed.
 * @returns {Promise<ProductData[]>} A promise that resolves to an array of processed product data.
 */
export const parseCSV = (file: File): Promise<ProductData[]> => {
    return new Promise((resolve, reject) => {
        // Check if Worker support is available in the browser.
        if (typeof Worker === 'undefined') {
            return reject(new Error('Web Workers are not supported in this browser.'));
        }

        const worker = new Worker('/worker.js');

        // Set up listener for messages from the worker
        worker.onmessage = (event) => {
            if (event.data.error) {
                // Handle errors sent from the worker
                console.error('Error from CSV worker:', event.data.details || event.data.error);
                reject(new Error(event.data.error));
            } else {
                // On success, resolve the promise with the processed data
                resolve(event.data.data);
            }
            // Clean up the worker once the job is done
            worker.terminate();
        };

        // Set up listener for critical errors in the worker itself
        worker.onerror = (error) => {
            console.error('A critical error occurred in the CSV worker:', error);
            reject(new Error(`Worker error: ${error.message}`));
            // Clean up the worker on error
            worker.terminate();
        };

        // Send the file to the worker to start processing
        worker.postMessage(file);
    });
};