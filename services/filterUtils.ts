
import type { ProductData } from '../types';

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
            return data.filter(item => item.available < 10 && item.shippedT30 > 0);
        case 'high':
            return data.filter(item => item.available > 100 && item.shippedT30 < 5);
        case 'stranded':
            return data.filter(item => item.available > 10 && item.shippedT30 === 0);
        default:
            return data;
    }
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
