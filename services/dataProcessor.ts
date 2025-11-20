

import type { ProductData, Stats, Snapshot } from '../types';
import { RISK_SCORE_CONFIG, INVENTORY_AGE_WEIGHTS, RISK_SCORE_THRESHOLDS, VELOCITY_TREND_INDICATOR, URGENCY_CONFIG } from '../constants';
import { parseNumeric } from './utils';

/**
 * Calculates a risk score for a product based on inventory age, sell-through,
 * and stock levels. This logic was formerly in the web worker and csvParser.
 * @param {Omit<ProductData, 'riskScore'>} item - The product data item.
 * @returns {number} A risk score from 0 to 100.
 */
export const calculateRiskScore = (item: Omit<ProductData, 'riskScore'>): number => {
    let score = 0;
    const { totalInvAgeDays, available, shippedT30, pendingRemoval } = item;
    const { AGE, DAYS_OF_COVER, REMOVAL_RATIO, MAX_SCORE } = RISK_SCORE_CONFIG;

    // --- Component 1: Inventory Age (Max 40 points) ---
    // Older inventory carries higher risk of storage fees and obsolescence.
    if (totalInvAgeDays > AGE.THRESHOLD_365_PLUS) {
        score += AGE.POINTS_365_PLUS;
    } else if (totalInvAgeDays > AGE.THRESHOLD_181_PLUS) {
        score += AGE.POINTS_181_TO_365;
    } else if (totalInvAgeDays > AGE.THRESHOLD_91_PLUS) {
        score += AGE.POINTS_91_TO_180;
    }

    // --- Component 2: Days of Cover (Supply Days) (Max 40 points) ---
    // This metric indicates how long the current inventory will last based on recent sales.
    // It's a powerful indicator of overstocking risk.
    const dailySales = shippedT30 / 30;
    if (dailySales <= 0 && available > 0) {
        // Stranded inventory: stock with no recent sales is a major risk.
        score += DAYS_OF_COVER.POINTS_STRANDED;
    } else if (dailySales > 0) {
        const daysOfCover = available / dailySales;
        if (daysOfCover > DAYS_OF_COVER.THRESHOLD_180_DAYS) {
            score += DAYS_OF_COVER.POINTS_OVER_180;
        } else if (daysOfCover > DAYS_OF_COVER.THRESHOLD_90_DAYS) {
            score += DAYS_OF_COVER.POINTS_90_TO_180;
        } else if (daysOfCover > DAYS_OF_COVER.THRESHOLD_60_DAYS) {
            score += DAYS_OF_COVER.POINTS_60_TO_90;
        }
    }

    // --- Component 3: Pending Removals (Max 20 points) ---
    // A high proportion of units pending removal is a strong signal of problematic inventory.
    const totalStock = available + pendingRemoval;
    if (totalStock > 0) {
        const removalRatio = pendingRemoval / totalStock;
        if (removalRatio > REMOVAL_RATIO.THRESHOLD_50_PERCENT) {
            score += REMOVAL_RATIO.POINTS_OVER_50_PERCENT;
        } else if (removalRatio > REMOVAL_RATIO.THRESHOLD_20_PERCENT) {
            score += REMOVAL_RATIO.POINTS_20_TO_50_PERCENT;
        } else if (removalRatio > REMOVAL_RATIO.THRESHOLD_10_PERCENT) {
            score += REMOVAL_RATIO.POINTS_10_TO_20_PERCENT;
        }
    }
    
    // The stockout risk factor has been removed to keep this score focused on
    // overstocking and inventory stagnation. Stockout risk is handled by the
    // restock recommendation and stock status filters.

    return Math.min(Math.round(score), MAX_SCORE);
};

export interface MfiData {
    sku: string;
    inboundWorking: number;
    inboundShipped: number;
    inboundReceiving: number;
    reservedQuantity: number;
    mfnFulfillable?: number;
}

/**
 * Processes the MFI (Manage FBA Inventory) report into a lookup map.
 */
export const processMfiData = (rawData: any[]): Map<string, MfiData> => {
    const map = new Map<string, MfiData>();
    
    rawData.forEach(row => {
        // Normalize SKU: Trim whitespace and convert to uppercase for consistent matching
        const sku = (row['sku'] || '').trim().toUpperCase();
        if (!sku) return;

        map.set(sku, {
            sku,
            inboundWorking: parseNumeric(row['afn-inbound-working-quantity']),
            inboundShipped: parseNumeric(row['afn-inbound-shipped-quantity']),
            inboundReceiving: parseNumeric(row['afn-inbound-receiving-quantity']),
            reservedQuantity: parseNumeric(row['afn-reserved-quantity']),
            mfnFulfillable: parseNumeric(row['mfn-fulfillable-quantity']),
        });
    });
    return map;
};

/**
 * Transforms raw data objects from a CSV into structured ProductData, calculating derived fields.
 * Enriched by optional MFI data if available.
 * @param {any[]} rawData - Array of row objects from PapaParse.
 * @param {Map<string, MfiData>} [mfiMap] - Optional map of MFI logistics data.
 * @returns {ProductData[]} Array of processed ProductData objects.
 */
export const processRawData = (rawData: any[], mfiMap?: Map<string, MfiData>): ProductData[] => {
    const mappedData = rawData.map((row): ProductData | null => {
        // Normalize SKU: Trim whitespace and convert to uppercase for consistent matching
        const sku = (row['sku'] || '').trim().toUpperCase();
        if (!sku) {
            return null; // This row is invalid, mark for removal
        }

        const available = parseNumeric(row['available']);
        const shippedT30 = parseNumeric(row['units-shipped-t30']);

        const invAge0to90 = parseNumeric(row['inv-age-0-to-90-days']);
        const invAge91to180 = parseNumeric(row['inv-age-91-to-180-days']);
        const invAge181to270 = parseNumeric(row['inv-age-181-to-270-days']);
        const invAge271to365 = parseNumeric(row['inv-age-271-to-365-days']);
        const invAge365plus = parseNumeric(row['inv-age-365-plus-days']);

        const totalInv = invAge0to90 + invAge91to180 + invAge181to270 + invAge271to365 + invAge365plus;
        const avgAge = totalInv > 0 ? (
            (invAge0to90 * INVENTORY_AGE_WEIGHTS.DAYS_0_TO_90) +
            (invAge91to180 * INVENTORY_AGE_WEIGHTS.DAYS_91_TO_180) +
            (invAge181to270 * INVENTORY_AGE_WEIGHTS.DAYS_181_TO_270) +
            (invAge271to365 * INVENTORY_AGE_WEIGHTS.DAYS_271_TO_365) +
            (invAge365plus * INVENTORY_AGE_WEIGHTS.DAYS_365_PLUS) 
        ) / totalInv : 0;
        
        const sellThroughRate = available + shippedT30 > 0 ? Math.round((shippedT30 / (available + shippedT30)) * 100) : 0;
        const dailySales = shippedT30 / 30;

        // --- MFI Enrichment & Logistics Calculation ---
        // Initialize with default undefined or 0
        let inboundWorking: number | undefined = undefined;
        let inboundShipped: number | undefined = undefined;
        let inboundReceiving: number | undefined = undefined;
        let reservedQuantity: number | undefined = undefined;
        
        let netAvailableStock: number | undefined = undefined;
        let daysOfCover: number | undefined = undefined;
        let urgencyScore: number | undefined = undefined;
        let urgencyStatus: 'Critical' | 'Warning' | 'Healthy' | undefined = undefined;

        if (mfiMap && mfiMap.has(sku)) {
            const mfi = mfiMap.get(sku)!;
            
            inboundWorking = mfi.inboundWorking;
            inboundShipped = mfi.inboundShipped;
            inboundReceiving = mfi.inboundReceiving;
            reservedQuantity = mfi.reservedQuantity;

            // 1. Calculate Net Available Stock
            // Formula: afn-fulfillable + afn-inbound-working + afn-inbound-shipped – afn-reserved-quantity
            netAvailableStock = (available + mfi.inboundWorking + mfi.inboundShipped) - mfi.reservedQuantity;
            
            // 2. Calculate Stock Coverage Days
            // Formula: (Net Available Stock / Avg Daily Sales)
            daysOfCover = dailySales > 0 ? netAvailableStock / dailySales : (netAvailableStock > 0 ? 999 : 0);
            // Round immediately for display logic consistency
            daysOfCover = daysOfCover === 999 ? 999 : Math.round(daysOfCover);

            // 3. Calculate Urgency Score
            // Formula: (Sell-Through % x Forecasted Daily Sales) – Net Available Stock
            const rawUrgencyScore = ((sellThroughRate / 100) * dailySales) - netAvailableStock;
            urgencyScore = parseFloat(rawUrgencyScore.toFixed(2));

            // 4. Determine Status
            urgencyStatus = 'Healthy';
            if (daysOfCover <= URGENCY_CONFIG.COVERAGE_CRITICAL_DAYS || rawUrgencyScore > URGENCY_CONFIG.URGENCY_SCORE_THRESHOLD) {
                urgencyStatus = 'Critical';
            } else if (daysOfCover <= URGENCY_CONFIG.COVERAGE_WARNING_DAYS) {
                urgencyStatus = 'Warning';
            }
        }


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
            sellThroughRate,
            recommendedAction: row['recommended-action'] || 'No Action',
            category: row['category'] || 'Unknown',
            // MFI Fields - explicitly assigned instead of spread for performance
            inboundWorking,
            inboundShipped,
            inboundReceiving,
            reservedQuantity,
            // Urgency Fields
            netAvailableStock,
            daysOfCover,
            urgencyScore,
            urgencyStatus
        };

        const riskScore = calculateRiskScore(partialData);
        // Return the full object directly.
        // We cast to ProductData because we know we've added the missing riskScore.
        return { ...partialData, riskScore } as ProductData;
    });

    return mappedData.filter((item): item is ProductData => item !== null);
};


export const calculateStats = (data: ProductData[]): Stats => {
    if (data.length === 0) {
        return {
            totalProducts: 0, totalAvailable: 0, totalPending: 0, totalShipped: 0,
            avgDaysInventory: 0, sellThroughRate: 0, atRiskSKUs: 0,
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
        if (item.riskScore > RISK_SCORE_THRESHOLDS.MEDIUM_RISK) {
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
      atRiskSKUs,
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
                velocityTrend = VELOCITY_TREND_INDICATOR.NEW_ITEM;
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
            velocityTrend: newItem.shippedT30 > 0 ? VELOCITY_TREND_INDICATOR.NEW_ITEM : 0, // Treat as a new selling item
        };
    });
};