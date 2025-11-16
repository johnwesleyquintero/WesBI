
import type { ProductData, Stats, Snapshot } from '../types';

export const calculateRiskScore = (item: ProductData): number => {
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

// This function transforms raw CSV row objects into structured ProductData,
// calculating derived fields. It was previously in the web worker.
export const transformRawData = (rawData: any[]): ProductData[] => {
    return rawData.map((row) => {
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

        const riskScore = calculateRiskScore(partialData as ProductData);
        return { ...partialData, riskScore };
    });
};

export const calculateStats = (data: ProductData[]): Stats => {
    const totalProducts = data.length;
    const totalAvailable = data.reduce((sum, i) => sum + i.available, 0);
    const totalPending = data.reduce((sum, i) => sum + i.pendingRemoval, 0);
    const totalShipped = data.reduce((sum, i) => sum + i.shippedT30, 0);
    const totalDays = data.reduce((sum, i) => sum + (i.totalInvAgeDays * i.available), 0)
    const avgDaysInventory = totalAvailable > 0 ? Math.round(totalDays / totalAvailable) : 0;
    const sellThroughRate = totalAvailable + totalShipped > 0 ? Math.round((totalShipped / (totalAvailable + totalShipped)) * 100) : 0;
    const atRiskSKUs = data.filter(i => i.riskScore > 70).length;
    
    return {
      totalProducts,
      totalAvailable,
      totalPending,
      totalShipped,
      avgDaysInventory,
      sellThroughRate,
      atRiskSKUs
    };
};

export const compareSnapshots = (newSnapshot: Snapshot, oldSnapshot: Snapshot): ProductData[] => {
    const oldDataMap = new Map(oldSnapshot.data.map(item => [item.sku, item]));

    return newSnapshot.data.map(newItem => {
        const oldItem = oldDataMap.get(newItem.sku);
        if (oldItem) {
            return {
                ...newItem,
                inventoryChange: newItem.available - oldItem.available,
                shippedChange: newItem.shippedT30 - oldItem.shippedT30,
                ageChange: newItem.totalInvAgeDays - oldItem.totalInvAgeDays,
                riskScoreChange: newItem.riskScore - oldItem.riskScore,
            };
        }
        return {
            ...newItem,
            inventoryChange: newItem.available,
            shippedChange: newItem.shippedT30,
            ageChange: newItem.totalInvAgeDays,
            riskScoreChange: newItem.riskScore,
        };
    });
};
