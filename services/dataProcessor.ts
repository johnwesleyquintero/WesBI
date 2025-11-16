
import type { ProductData, Stats, Snapshot } from '../types';

/**
 * Safely parses a value into a number. Returns 0 if the value is not a valid number.
 * @param val The value to parse.
 * @returns A valid number.
 */
const parseNumeric = (val: any): number => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
};

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

/**
 * Transforms raw data objects from a CSV into structured ProductData, calculating derived fields
 * and enriching with financial data from a lookup map.
 * @param {any[]} rawData - Array of row objects from PapaParse.
 * @param {Map<string, { cogs: number; price: number }>} financialDataMap - A map of SKU to its cost and price.
 * @returns {ProductData[]} Array of processed ProductData objects.
 */
export const processRawData = (rawData: any[], financialDataMap: Map<string, { cogs: number; price: number }>): ProductData[] => {
    const mappedData = rawData.map((row): ProductData | null => {
        const sku = (row['sku'] || '').trim();
        if (!sku) {
            return null; // This row is invalid, mark for removal
        }

        const financialLookup = financialDataMap.get(sku);

        const available = parseNumeric(row['available']);
        const shippedT30 = parseNumeric(row['units-shipped-t30']);
        // Precedence: 1. Financial file, 2. FBA file, 3. Default to 0
        const cogs = financialLookup?.cogs ?? parseNumeric(row['cogs']);
        const price = financialLookup?.price ?? parseNumeric(row['price']);

        const invAge0to90 = parseNumeric(row['inv-age-0-to-90-days']);
        const invAge91to180 = parseNumeric(row['inv-age-91-to-180-days']);
        const invAge181to270 = parseNumeric(row['inv-age-181-to-270-days']);
        const invAge271to365 = parseNumeric(row['inv-age-271-to-365-days']);
        const invAge365plus = parseNumeric(row['inv-age-365-plus-days']);

        const totalInv = invAge0to90 + invAge91to180 + invAge181to270 + invAge271to365 + invAge365plus;
        const avgAge = totalInv > 0 ? (
            (invAge0to90 * 45) +
            (invAge91to180 * 135) +
            (invAge181to270 * 225) +
            (invAge271to365 * 318) +
            (invAge365plus * 400) 
        ) / totalInv : 0;
        
        const partialData: Omit<ProductData, 'riskScore'> = {
            sku: sku,
            asin: row['asin'] || '',
            name: row['product-name'] || '',
            condition: row['condition'] || '',
            available: available,
            pendingRemoval: parseNumeric(row['pending-removal-quantity']),
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
            cogs: cogs,
            price: price,
            inventoryValue: available * cogs,
            potentialRevenue: available * price,
            grossProfitPerUnit: price - cogs,
        };

        const riskScore = calculateRiskScore(partialData);
        return { ...partialData, riskScore };
    });

    return mappedData.filter((item): item is ProductData => item !== null);
};


export const calculateStats = (data: ProductData[]): Stats => {
    if (data.length === 0) {
        return {
            totalProducts: 0, totalAvailable: 0, totalPending: 0, totalShipped: 0,
            avgDaysInventory: 0, sellThroughRate: 0, atRiskSKUs: 0,
            totalInventoryValue: 0, capitalAtRisk: 0, totalPotentialRevenue: 0
        };
    }

    let totalAvailable = 0;
    let totalPending = 0;
    let totalShipped = 0;
    let totalDaysWeighted = 0;
    let atRiskSKUs = 0;
    let totalInventoryValue = 0;
    let capitalAtRisk = 0;
    let totalPotentialRevenue = 0;

    for (const item of data) {
        totalAvailable += item.available;
        totalPending += item.pendingRemoval;
        totalShipped += item.shippedT30;
        totalDaysWeighted += item.totalInvAgeDays * item.available;
        totalInventoryValue += item.inventoryValue || 0;
        totalPotentialRevenue += item.potentialRevenue || 0;
        if (item.riskScore > 70) {
            atRiskSKUs++;
            capitalAtRisk += item.inventoryValue || 0;
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
      atRiskSKUs,
      totalInventoryValue,
      capitalAtRisk,
      totalPotentialRevenue
    };
};

export const compareSnapshots = (newSnapshot: Snapshot, oldSnapshot: Snapshot): ProductData[] => {
    const oldDataMap = new Map(oldSnapshot.data.map(item => [item.sku, item]));

    return newSnapshot.data.map(newItem => {
        const oldItem = oldDataMap.get(newItem.sku);
        if (oldItem) {
            const oldShipped = oldItem.shippedT30;
            const newShipped = newItem.shippedT30;
            let velocityTrend: number;

            if (oldShipped > 0) {
                velocityTrend = ((newShipped - oldShipped) / oldShipped) * 100;
            } else if (newShipped > 0) {
                // Represents a new item that started selling; assign a high positive value.
                velocityTrend = 999;
            } else {
                // No sales in either period.
                velocityTrend = 0;
            }

            return {
                ...newItem,
                inventoryChange: newItem.available - oldItem.available,
                shippedChange: newShipped - oldShipped,
                ageChange: newItem.totalInvAgeDays - oldItem.totalInvAgeDays,
                riskScoreChange: newItem.riskScore - oldItem.riskScore,
                inventoryValueChange: (newItem.inventoryValue || 0) - (oldItem.inventoryValue || 0),
                velocityTrend: velocityTrend,
            };
        }
        // Item exists in new snapshot but not old one
        return {
            ...newItem,
            inventoryChange: newItem.available,
            shippedChange: newItem.shippedT30,
            ageChange: newItem.totalInvAgeDays,
            riskScoreChange: newItem.riskScore,
            inventoryValueChange: newItem.inventoryValue,
            velocityTrend: newItem.shippedT30 > 0 ? 999 : 0, // Treat as a new selling item
        };
    });
};
