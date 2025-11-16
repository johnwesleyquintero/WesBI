
import { useMemo } from 'react';
import { useAppContext } from '../state/appContext';
import { compareSnapshots } from '../services/dataProcessor';
import { 
    applySearchFilter, 
    applyActionFilter, 
    applyAgeFilter, 
    applyStockStatusFilter, 
    applyMinStockFilter 
} from '../services/filterUtils';
import type { ProductData } from '../types';

export const useFilteredData = (): ProductData[] => {
    const { state } = useAppContext();
    const { snapshots, isComparisonMode, activeSnapshotKey, filters, sortConfig } = state;
    
    const activeSnapshot = activeSnapshotKey ? snapshots[activeSnapshotKey] : null;

    return useMemo(() => {
        let data: ProductData[] = [];
        if (isComparisonMode) {
             const keys = Object.keys(snapshots).sort();
             if (keys.length >= 2) {
                 const newSnap = snapshots[keys[keys.length - 1]];
                 const oldSnap = snapshots[keys[keys.length - 2]];
                 data = compareSnapshots(newSnap, oldSnap);
             }
        } else if (activeSnapshot) {
            data = activeSnapshot.data;
        }

        if (!data) return [];
        
        let filtered = data;
        filtered = applySearchFilter(filtered, filters.search);
        filtered = applyActionFilter(filtered, filters.action);
        filtered = applyAgeFilter(filtered, filters.age);
        filtered = applyStockStatusFilter(filtered, filters.stockStatus);
        filtered = applyMinStockFilter(filtered, filters.minStock);

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

    }, [activeSnapshot, isComparisonMode, snapshots, filters, sortConfig]);
};
