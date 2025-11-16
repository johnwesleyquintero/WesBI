import type { ProductData } from '../types';

// The original parsing logic (parseAndProcessData) has been moved into `worker.js`
// to offload heavy computation from the main thread and prevent UI freezing.

/**
 * Parses a CSV file using a Web Worker to avoid blocking the main UI thread.
 * It delegates the file to the worker and returns a promise that resolves with
 * the processed data or rejects if an error occurs.
 * @param {File} file - The CSV file to be parsed.
 * @returns {Promise<ProductData[]>} A promise that resolves to an array of processed product data.
 */
export const parseCSV = (file: File): Promise<ProductData[]> => {
    return new Promise((resolve, reject) => {
        // Create a new worker. The worker script is expected to be served from the public root directory.
        const worker = new Worker('/worker.js');

        // Handle messages received from the worker.
        worker.onmessage = (event: MessageEvent) => {
            // The worker will send an object with either a 'data' key on success
            // or an 'error' key on failure.
            if (event.data.error) {
                console.error('Error from CSV Worker:', event.data.error, event.data.details || '');
                reject(new Error(event.data.error));
            } else {
                // Resolve the promise with the successfully parsed and processed data.
                resolve(event.data.data as ProductData[]);
            }
            // Terminate the worker to free up system resources once the job is complete.
            worker.terminate();
        };

        // Handle any critical errors that occur during worker initialization or execution.
        worker.onerror = (error: ErrorEvent) => {
            console.error('An unrecoverable error occurred in the CSV Worker:', error);
            reject(new Error(`Worker error: ${error.message}`));
            // Ensure the worker is terminated in case of an unhandled error.
            worker.terminate();
        };
        
        // Send the file to the worker to initiate the parsing process.
        worker.postMessage(file);
    });
};
