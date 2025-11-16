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