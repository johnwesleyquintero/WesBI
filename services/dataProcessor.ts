import type { ProductData, Stats, Snapshot } from '../types';

/**
 * Calculates a risk score for a product based on inventory age, sell-through,
 * and stock levels. This logic was formerly in the web worker and csvParser.
 * @param {Omit<ProductData, 'riskScore'>} item - The product data item.
 * @returns {number} A risk score from 0 to 100.
 */
export const calculateRiskScore = (item: Omit<ProductData, 'riskScore'>): number => {
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

export const calculateStats = (data: ProductData[]): Stats => {
    if (data.length === 0) {
        return {
            totalProducts: 0, totalAvailable: 0, totalPending: 0, totalShipped: 0,
            avgDaysInventory: 0, sellThroughRate: 0, atRiskSKUs: 0
        };
    }

    let totalAvailable = 0;
    let totalPending = 0;
    let totalShipped = 0;
    let totalDaysWeighted = 0;
    let atRiskSKUs = 0;

    for (const item of data) {
        totalAvailable += item.available;
        totalPending += item.pendingRemoval;
        totalShipped += item.shippedT30;
        totalDaysWeighted += item.totalInvAgeDays * item.available;
        if (item.riskScore > 70) {
            atRiskSKUs++;
        }
    }
    
    const totalProducts = data.length;
    const avgDaysInventory = totalAvailable > 0 ? Math.round(totalDaysWeighted / totalAvailable) : 0;
    const sellThroughRate = totalAvailable + totalShipped > 0 ? Math.round((totalShipped / (totalAvailable + totalShipped)) * 100) : 0;
    
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