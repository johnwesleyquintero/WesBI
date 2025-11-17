
import type { ProductData } from '../types';
import { STOCK_STATUS_THRESHOLDS } from '../constants';

export const applySearchFilter = (data: ProductData[], search: string): ProductData[] => {
    if (!search) return data;
    const searchLower = search.toLowerCase();
    return data.filter(item =>
        item.sku.toLowerCase().includes(searchLower) ||
        item.asin.toLowerCase().includes(searchLower) ||
        item.name.toLowerCase().includes(searchLower)
    );
};

export const applyActionFilter = (data: ProductData[], action: string): ProductData[] => {
    if (!action) return data;
    if (action === 'removal') {
        return data.filter(item => item.recommendedAction.toLowerCase().includes('removal'));
    }
    if (action === 'normal') {
        return data.filter(item => !item.recommendedAction.toLowerCase().includes('removal'));
    }
    return data;
};

export const applyAgeFilter = (data: ProductData[], age: string): ProductData[] => {
    if (!age) return data;
    switch (age) {
        case '0-90':
            return data.filter(item => item.totalInvAgeDays <= 90);
        case '91-180':
            return data.filter(item => item.totalInvAgeDays > 90 && item.totalInvAgeDays <= 180);
        case '181-365':
            return data.filter(item => item.totalInvAgeDays > 180 && item.totalInvAgeDays <= 365);
        case '365+':
            return data.filter(item => item.totalInvAgeDays > 365);
        default:
            return data;
    }
};

export const applyStockStatusFilter = (data: ProductData[], stockStatus: string): ProductData[] => {
    if (!stockStatus) return data;
    switch (stockStatus) {
        case 'low':
            // Low stock: less than 30 days of cover, and has had sales in the last 30 days.
            return data.filter(item => {
                if (item.shippedT30 <= 0) return false;
                const daysOfCover = item.available / (item.shippedT30 / 30);
                return daysOfCover < STOCK_STATUS_THRESHOLDS.LOW_STOCK_DAYS;
            });
        case 'high':
             // High stock: more than 180 days of cover, or over 100 units with no sales.
            return data.filter(item => {
                if (item.shippedT30 > 0) {
                    const daysOfCover = item.available / (item.shippedT30 / 30);
                    return daysOfCover > STOCK_STATUS_THRESHOLDS.HIGH_STOCK_DAYS;
                }
                // If no sales, consider it high stock if there are many units sitting.
                return item.available > STOCK_STATUS_THRESHOLDS.STRANDED_HIGH_UNITS;
            });
        case 'stranded':
            // Stranded: has inventory but no sales in the last 30 days.
            return data.filter(item => item.available > 0 && item.shippedT30 === 0);
        default:
            return data;
    }
};

export const applyCategoryFilter = (data: ProductData[], category: string): ProductData[] => {
    if (!category) return data;
    return data.filter(item => item.category === category);
};

export const applyMinStockFilter = (data: ProductData[], minStock: string): ProductData[] => {
    if (!minStock) return data;
    const min = parseInt(minStock);
    if (isNaN(min)) return data;
    return data.filter(item => item.available >= min);
};

export const applyMaxStockFilter = (data: ProductData[], maxStock: string): ProductData[] => {
    if (!maxStock) return data;
    const max = parseInt(maxStock);
    if (isNaN(max)) return data;
    return data.filter(item => item.available <= max);
};