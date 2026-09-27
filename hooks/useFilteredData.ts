




import { useMemo } from 'react';
import { useAppContext } from '../state/appContext';
import { compareSnapshots } from '../services/dataProcessor';
import { 
    applySearchFilter, 
    applyActionFilter, 
    applyAgeFilter, 
    applyStockStatusFilter, 
    applyMinStockFilter,
    applyMaxStockFilter,
    applyCategoryFilter,
    applyReorderStatusFilter
} from '../services/filterUtils';
import type { ProductData, ForecastSettings, ReorderStatus } from '../types';
import { FORECAST_CONFIG, VELOCITY_TREND_INDICATOR } from '../constants';

/**
 * Rounds a number up to the nearest standard FBA shipment quantity.
 * This reflects common case-pack or shipping plan quantities.
 * @param recommendation The raw calculated restock number.
 * @returns The rounded-up shipment quantity.
 */
const roundToShipmentQuantity = (recommendation: number): number => {
    if (recommendation <= 0) {
        return 0;
    }

    const tiers = FORECAST_CONFIG.SHIPMENT_QUANTITY_TIERS;
    
    // Find the first tier that is greater than or equal to the recommendation
    for (const tier of tiers) {
        if (recommendation <= tier) {
            return tier;
        }
    }

    // If the recommendation is larger than the highest predefined tier,
    // round up to the nearest configured unit.
    const roundingUnit = FORECAST_CONFIG.LARGE_SHIPMENT_ROUNDING_UNIT;
    return Math.ceil(recommendation / roundingUnit) * roundingUnit;
};

const calculateRestockRecommendation = (item: ProductData, settings: ForecastSettings): number => {
    // No restock needed for items with no recent sales or that are being removed.
    if (item.shippedT30 <= 0 || item.recommendedAction.toLowerCase().includes('removal')) {
        return 0;
    }

    const dailySales = item.shippedT30 / 30;
    const { VELOCITY_TREND, SELL_THROUGH_SAFETY_STOCK } = FORECAST_CONFIG;
    
    // --- Trend-Aware Forecasting ---
    // Adjust forecast based on recent sales velocity trends.
    let trendAdjustment = 1.0;
    if (item.velocityTrend !== undefined && item.velocityTrend !== VELOCITY_TREND_INDICATOR.NEW_ITEM) {
        if (item.velocityTrend > VELOCITY_TREND.GROWTH_STRONG_THRESHOLD) {
            trendAdjustment = VELOCITY_TREND.ADJUSTMENT_STRONG_GROWTH;
        } else if (item.velocityTrend > VELOCITY_TREND.GROWTH_MODERATE_THRESHOLD) {
            trendAdjustment = VELOCITY_TREND.ADJUSTMENT_MODERATE_GROWTH;
        } else if (item.velocityTrend < VELOCITY_TREND.DECLINE_STRONG_THRESHOLD) {
            trendAdjustment = VELOCITY_TREND.ADJUSTMENT_STRONG_DECLINE;
        } else if (item.velocityTrend < VELOCITY_TREND.DECLINE_MODERATE_THRESHOLD) {
            trendAdjustment = VELOCITY_TREND.ADJUSTMENT_MODERATE_DECLINE;
        }
    }
    
    const forecastedDailySales = dailySales * (1 + (settings.demandForecast / 100)) * trendAdjustment;

    // Dynamically adjust safety stock based on sell-through rate.
    // This provides a buffer for high-demand items and reduces overstocking on slow movers.
    let dynamicSafetyStockDays = settings.safetyStock;
    if (item.sellThroughRate > SELL_THROUGH_SAFETY_STOCK.HIGH_RATE_THRESHOLD) {
        dynamicSafetyStockDays *= SELL_THROUGH_SAFETY_STOCK.HIGH_RATE_MULTIPLIER;
    // Fix: Corrected typo from `SELL_THROUGH_SAFETY_stock` to `SELL_THROUGH_SAFETY_STOCK`.
    } else if (item.sellThroughRate < SELL_THROUGH_SAFETY_STOCK.LOW_RATE_THRESHOLD) {
        dynamicSafetyStockDays *= SELL_THROUGH_SAFETY_STOCK.LOW_RATE_MULTIPLIER;
    }

    const demandDuringLeadTime = forecastedDailySales * settings.leadTime;
    const requiredSafetyStock = forecastedDailySales * dynamicSafetyStockDays;

    const idealInventoryLevel = demandDuringLeadTime + requiredSafetyStock;
    
    // The recommendation should cover the gap to reach the ideal inventory level.
    let recommendation = idealInventoryLevel - item.available;

    // Only recommend restocking if there's a need, and round to standard shipment quantities.
    return roundToShipmentQuantity(recommendation);
};

export const useFilteredData = (): ProductData[] => {
    const { state } = useAppContext();
    const { snapshots, isComparisonMode, activeSnapshotKey, filters, sortConfig, comparisonSnapshotKeys, forecastSettings, selectedChannel } = state;
    
    const activeSnapshot = activeSnapshotKey ? snapshots[activeSnapshotKey] : null;

    // Stage 1: Get the base dataset (either a single snapshot or a comparison)
    const baseData = useMemo(() => {
        let data: ProductData[] = [];
        if (isComparisonMode && comparisonSnapshotKeys.base && comparisonSnapshotKeys.compare) {
             const oldSnap = snapshots[comparisonSnapshotKeys.base];
             const newSnap = snapshots[comparisonSnapshotKeys.compare];
             if (oldSnap && newSnap) {
                data = compareSnapshots(newSnap, oldSnap);
             }
        } else if (activeSnapshot) {
            data = activeSnapshot.data;
        }
        return data;
    }, [activeSnapshot, isComparisonMode, snapshots, comparisonSnapshotKeys]);

    // Stage 2: Apply dynamic channel velocity, lead time, and replenishment calculations
    const dataWithForecast = useMemo(() => {
        if (!baseData) return [];
        const channel = selectedChannel || 'all';
        const leadTime = forecastSettings.leadTime || 30;
        const safetyStock = forecastSettings.safetyStock || 7;
        const requiredCoverage = leadTime + safetyStock; // e.g. 37 days

        return baseData.map(item => {
            // Determine active units sold based on channel
            let channelUnits = item.shippedT30;
            if (channel === 'amazon' && item.channelSales) {
                channelUnits = item.channelSales.amazon;
            } else if (channel === 'walmart' && item.channelSales) {
                channelUnits = item.channelSales.walmart;
            } else if (channel === 'shopify' && item.channelSales) {
                channelUnits = item.channelSales.shopify;
            } else if (channel === 'tiktok' && item.channelSales) {
                channelUnits = item.channelSales.tiktok;
            }

            const activeVelocity = parseFloat((channelUnits / 30).toFixed(2));
            const netStock = item.netAvailableStock ?? item.available;

            const rawWhseCover = activeVelocity > 0 ? (item.available / activeVelocity) : (item.available > 0 ? 999 : 0);
            const whseDaysOfCover = rawWhseCover === 999 ? 999 : parseFloat(rawWhseCover.toFixed(1));

            const rawPipelineCover = activeVelocity > 0 ? (netStock / activeVelocity) : (netStock > 0 ? 999 : 0);
            const pipelineDaysOfCover = rawPipelineCover === 999 ? 999 : parseFloat(rawPipelineCover.toFixed(1));

            let reorderStatus: ReorderStatus = 'HEALTHY';
            let suggestedReorderQty = 0;

            if (activeVelocity <= 0 && item.available > 0) {
                if (item.totalInvAgeDays > 180) {
                    reorderStatus = 'LIQUIDATE';
                } else {
                    reorderStatus = 'STRANDED';
                }
            } else if (activeVelocity > 0) {
                if (pipelineDaysOfCover <= requiredCoverage) {
                    reorderStatus = 'REORDER NOW';
                    const targetUnits = Math.ceil(activeVelocity * (requiredCoverage + 30));
                    suggestedReorderQty = Math.max(0, targetUnits - netStock);
                } else if (pipelineDaysOfCover <= (leadTime * 1.5 + safetyStock)) {
                    reorderStatus = 'REORDER SOON';
                    const targetUnits = Math.ceil(activeVelocity * (requiredCoverage + 30));
                    suggestedReorderQty = Math.max(0, targetUnits - netStock);
                } else if (pipelineDaysOfCover > 120) {
                    reorderStatus = 'OVERSTOCK';
                    suggestedReorderQty = 0;
                } else {
                    reorderStatus = 'HEALTHY';
                    suggestedReorderQty = 0;
                }
            }

            const daysUntilStockout = Math.max(0, Math.floor(whseDaysOfCover === 999 ? 999 : whseDaysOfCover));
            const stockoutDate = daysUntilStockout === 0
                ? 'Stocked Out'
                : daysUntilStockout >= 999
                ? '> 180 days'
                : daysUntilStockout <= 2
                ? 'Critical (< 48h)'
                : `In ${daysUntilStockout} days`;

            const restockRecommendation = calculateRestockRecommendation(
                { ...item, available: netStock }, 
                forecastSettings
            );

            return {
                ...item,
                dailyVelocity: activeVelocity,
                whseDaysOfCover,
                pipelineDaysOfCover,
                daysOfCover: pipelineDaysOfCover,
                reorderStatus,
                suggestedReorderQty,
                daysUntilStockout,
                stockoutDate,
                restockRecommendation: suggestedReorderQty > 0 ? suggestedReorderQty : restockRecommendation
            };
        });
    }, [baseData, forecastSettings, selectedChannel]);
    
    // Stage 3: Apply filtering and sorting.
    return useMemo(() => {
        if (!dataWithForecast) return [];
        
        let filtered: ProductData[] = dataWithForecast;
        filtered = applySearchFilter(filtered, filters.search);
        filtered = applyActionFilter(filtered, filters.action);
        filtered = applyAgeFilter(filtered, filters.age);
        filtered = applyCategoryFilter(filtered, filters.category);
        filtered = applyStockStatusFilter(filtered, filters.stockStatus);
        filtered = applyMinStockFilter(filtered, filters.minStock);
        filtered = applyMaxStockFilter(filtered, filters.maxStock);
        filtered = applyReorderStatusFilter(filtered, filters.reorderStatus);

        if (sortConfig.length > 0) {
            const sorted = [...filtered].sort((a, b) => {
                for (const sort of sortConfig) {
                    const { key, direction } = sort;
                    const aVal = a[key];
                    const bVal = b[key];
        
                    if (aVal === undefined || aVal === null) return 1;
                    if (bVal === undefined || bVal === null) return -1;

                    let comparison = 0;
                    if (typeof aVal === 'number' && typeof bVal === 'number') {
                        if (aVal < bVal) comparison = -1;
                        if (aVal > bVal) comparison = 1;
                    } else if (typeof aVal === 'string' && typeof bVal === 'string') {
                        comparison = aVal.localeCompare(bVal);
                    } else {
                        // Fallback for mixed or other types
                        if (aVal < bVal) comparison = -1;
                        if (aVal > bVal) comparison = 1;
                    }

                    if (comparison !== 0) {
                        return direction === 'asc' ? comparison : -comparison;
                    }
                }
                
                // Technical Debt Fix: Deterministic Sorting
                // If values are equal, fall back to SKU to ensure row order stability across renders.
                if (a.sku < b.sku) return -1;
                if (a.sku > b.sku) return 1;
                
                return 0;
            });
            return sorted;
        }
        
        return filtered;

    }, [dataWithForecast, filters, sortConfig]);
};