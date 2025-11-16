import type { ProductData, Stats, Snapshot } from '../types';

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