
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
    applyCategoryFilter
} from '../services/filterUtils';
import type { ProductData, ForecastSettings } from '../types';

const calculateRestockRecommendation = (item: ProductData, settings: ForecastSettings): number => {
    // No restock needed for items with no recent sales or that are being removed.
    if (item.shippedT30 <= 0 || item.recommendedAction.toLowerCase().includes('removal')) {
        return 0;
    }

    const dailySales = item.shippedT30 / 30;
    const forecastedDailySales = dailySales * (1 + (settings.demandForecast / 100));

    // Dynamically adjust safety stock based on sell-through rate.
    // This provides a buffer for high-demand items and reduces overstocking on slow movers.
    let dynamicSafetyStockDays = settings.safetyStock;
    if (item.sellThroughRate > 75) { // High velocity
        dynamicSafetyStockDays *= 1.5;
    } else if (item.sellThroughRate < 25) { // Slow movers
        dynamicSafetyStockDays *= 0.5;
    }

    const demandDuringLeadTime = forecastedDailySales * settings.leadTime;
    const requiredSafetyStock = forecastedDailySales * dynamicSafetyStockDays;

    const idealInventoryLevel = demandDuringLeadTime + requiredSafetyStock;
    
    // The recommendation should cover the gap to reach the ideal inventory level.
    const recommendation = idealInventoryLevel - item.available;

    // Only recommend restocking if there's a need.
    return recommendation > 0 ? Math.ceil(recommendation) : 0;
};

export const useFilteredData = (): ProductData[] => {
    const { state } = useAppContext();
    const { snapshots, isComparisonMode, activeSnapshotKey, filters, sortConfig, comparisonSnapshotKeys, forecastSettings } = state;
    
    const activeSnapshot = activeSnapshotKey ? snapshots[activeSnapshotKey] : null;

    return useMemo(() => {
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

        if (!data) return [];
        
        // Calculate restock recommendation for each item
        const dataWithForecast = data.map(item => ({
            ...item,
            restockRecommendation: calculateRestockRecommendation(item, forecastSettings)
        }));

        // FIX: Explicitly type `filtered` as ProductData[] to match the return type of the filter functions.
        // This resolves assignment errors where the inferred type of `dataWithForecast` was more specific
        // (with a required `restockRecommendation`) than the `ProductData[]` returned by the filters.
        let filtered: ProductData[] = dataWithForecast;
        filtered = applySearchFilter(filtered, filters.search);
        filtered = applyActionFilter(filtered, filters.action);
        filtered = applyAgeFilter(filtered, filters.age);
        filtered = applyCategoryFilter(filtered, filters.category);
        filtered = applyStockStatusFilter(filtered, filters.stockStatus);
        filtered = applyMinStockFilter(filtered, filters.minStock);
        filtered = applyMaxStockFilter(filtered, filters.maxStock);

        if (sortConfig.length > 0) {
            const sorted = [...filtered].sort((a, b) => {
                for (const sort of sortConfig) {
                    const { key, direction } = sort;
                    const aVal = a[key];
                    const bVal = b[key];
        
                    if (aVal === undefined || aVal === null) return 1;
                    if (bVal === undefined || bVal === null) return -1;

                    let comparison = 0;
                    if (typeof aVal === 'string' && typeof bVal === 'string') {
                        comparison = aVal.localeCompare(bVal);
                    } else {
                        if (aVal < bVal) comparison = -1;
                        if (aVal > bVal) comparison = 1;
                    }

                    if (comparison !== 0) {
                        return direction === 'asc' ? comparison : -comparison;
                    }
                }
                return 0;
            });
            return sorted;
        }
        
        return filtered;

    }, [activeSnapshot, isComparisonMode, snapshots, filters, sortConfig, comparisonSnapshotKeys, forecastSettings]);
};