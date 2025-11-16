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

    // --- Component 1: Inventory Age (Max 40 points) ---
    // Older inventory carries higher risk of storage fees and obsolescence.
    if (totalInvAgeDays > 365) {
        score += 40;
    } else if (totalInvAgeDays > 180) {
        score += 25;
    } else if (totalInvAgeDays > 90) {
        score += 15;
    }

    // --- Component 2: Days of Cover (Supply Days) (Max 40 points) ---
    // This metric indicates how long the current inventory will last based on recent sales.
    // It's a powerful indicator of overstocking risk.
    const dailySales = shippedT30 / 30;
    if (dailySales <= 0 && available > 0) {
        // Stranded inventory: stock with no recent sales is a major risk.
        score += 40;
    } else if (dailySales > 0) {
        const daysOfCover = available / dailySales;
        if (daysOfCover > 180) { // Over 6 months of supply
            score += 35;
        } else if (daysOfCover > 90) { // 3-6 months of supply
            score += 20;
        } else if (daysOfCover > 60) { // 2-3 months of supply
            score += 10;
        }
    }

    // --- Component 3: Pending Removals (Max 20 points) ---
    // A high proportion of units pending removal is a strong signal of problematic inventory.
    const totalStock = available + pendingRemoval;
    if (totalStock > 0) {
        const removalRatio = pendingRemoval / totalStock;
        if (removalRatio > 0.5) { // Over 50% of stock is pending removal
            score += 20;
        } else if (removalRatio > 0.2) { // Over 20%
            score += 10;
        } else if (removalRatio > 0.1) { // Over 10%
            score += 5;
        }
    }
    
    // The stockout risk factor has been removed to keep this score focused on
    // overstocking and inventory stagnation. Stockout risk is handled by the
    // restock recommendation and stock status filters.

    return Math.min(Math.round(score), 100);
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