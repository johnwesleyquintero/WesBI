import type { ProductData } from '../types';
import { calculateRiskScore } from './dataProcessor';

const parseAndProcessData = (results: any[]): ProductData[] => {
    return results.map((row: any) => {
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
        
        // FIX: Removed `timestamp` property from the object below as it does not exist on the ProductData type.
        // The timestamp is correctly associated with a Snapshot in App.tsx.
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
            sellThroughRate: available > 0 ? Math.round((shippedT30 / (available + shippedT30)) * 100) : 0,
            recommendedAction: row['recommended-action'] || 'No Action',
            category: row['category'] || 'Unknown',
        };

        const riskScore = calculateRiskScore(partialData as ProductData);

        return { ...partialData, riskScore };
    });
};

export const parseCSV = (file: File): Promise<ProductData[]> => {
    return new Promise((resolve, reject) => {
        if (!window.Papa) {
            return reject(new Error("PapaParse library is not loaded."));
        }
        window.Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results: any) => {
                if(results.errors.length > 0) {
                    console.error('CSV parsing errors:', results.errors);
                    return reject(new Error('Failed to parse CSV file.'));
                }
                const processedData = parseAndProcessData(results.data);
                resolve(processedData);
            },
            error: (error: Error) => {
                console.error('CSV parsing error:', error);
                reject(error);
            }
        });
    });
};