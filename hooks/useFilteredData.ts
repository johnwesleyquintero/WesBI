import { useMemo } from 'react';
import { useAppContext } from '../state/appContext';
import { compareSnapshots } from '../services/dataProcessor';
import { 
    applySearchFilter, 
    applyActionFilter, 
    applyAgeFilter, 
    applyStockStatusFilter, 
    applyMinStockFilter,
    applyMaxStockFilter
} from '../services/filterUtils';
import type { ProductData, ForecastSettings } from '../types';

const calculateRestockRecommendation = (item: ProductData, settings: ForecastSettings): number => {
    if (item.shippedT30 <= 0) return 0;

    const dailySales = item.shippedT30 / 30;
    const forecastedDailySales = dailySales * (1 + (settings.demandForecast / 100));
    
    const demandDuringLeadTime = forecastedDailySales * settings.leadTime;
    const requiredSafetyStock = forecastedDailySales * settings.safetyStock;

    const idealInventoryLevel = demandDuringLeadTime + requiredSafetyStock;
    const recommendation = idealInventoryLevel - item.available;

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
        filtered = applyStockStatusFilter(filtered, filters.stockStatus);
        filtered = applyMinStockFilter(filtered, filters.minStock);
        filtered = applyMaxStockFilter(filtered, filters.maxStock);

        if (sortConfig.key) {
            const sorted = [...filtered].sort((a, b) => {
                const aVal = a[sortConfig.key!];
                const bVal = b[sortConfig.key!];
                if (aVal === undefined || bVal === undefined) return 0;
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
            return sorted;
        }
        
        return filtered;

    }, [activeSnapshot, isComparisonMode, snapshots, filters, sortConfig, comparisonSnapshotKeys, forecastSettings]);
};
