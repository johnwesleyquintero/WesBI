/**
 * WesBI FBA Intelligence Cockpit - CSV Parsing Web Worker
 *
 * This worker runs in a separate thread to handle heavy CSV parsing and data processing,
 * preventing the main UI thread from freezing when large files are uploaded.
 * It receives a file from the main thread, processes it using PapaParse, and
 * sends the structured JSON data back.
 */

// Load the PapaParse library. It's hosted on a CDN and available globally in the worker's scope.
importScripts('https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js');

/**
 * Calculates a risk score for a given product item based on inventory age,
 * sell-through rate, pending removals, and stock levels.
 *
 * LOGIC DUPLICATED FROM: services/dataProcessor.ts
 * @param {object} item - The product data item.
 * @returns {number} - A risk score from 0 to 100.
 */
const calculateRiskScore = (item) => {
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
 * Transforms the raw parsed CSV data into the structured ProductData format,
 * calculating derived fields like average inventory age and risk score.
 *
 * LOGIC DUPLICATED FROM: services/csvParser.ts
 * @param {Array<object>} results - Array of row objects from PapaParse.
 * @returns {Array<object>} - Array of processed ProductData objects.
 */
const parseAndProcessData = (results) => {
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
        
        const partialData = {
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
 * Main message handler for the worker.
 * Triggered when `worker.postMessage(file)` is called from the main thread.
 */
self.onmessage = (event) => {
    const file = event.data;

    if (!file || !(file instanceof File)) {
        self.postMessage({ error: 'Invalid file received by worker.' });
        return;
    }

    // Use PapaParse to stream and parse the CSV file.
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
            // Handle parsing completion.
            if (results.errors.length > 0) {
                console.error('CSV parsing errors in worker:', results.errors);
                // Post an error message back to the main thread.
                self.postMessage({ error: 'Failed to parse CSV file.', details: results.errors });
                return;
            }
            try {
                // Process the parsed data.
                const processedData = parseAndProcessData(results.data);
                // Post the successful result back to the main thread.
                self.postMessage({ data: processedData });
            } catch(e) {
                console.error('Error processing data in worker:', e);
                self.postMessage({ error: e.message || 'An unexpected error occurred during data processing.' });
            }
        },
        error: (error) => {
            // Handle parsing errors.
            console.error('CSV parsing error in worker:', error);
            self.postMessage({ error: error.message });
        }
    });
};
