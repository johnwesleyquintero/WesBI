

import type { ProductData } from '../types';

export const escapeCSVField = (field: any): string => {
    if (field === null || field === undefined) {
        return '';
    }
    const stringField = String(field);
    // If the field contains a comma, double quote, or newline, wrap it in double quotes.
    if (/[",\n]/.test(stringField)) {
        // Within a double-quoted field, any double quote must be escaped by another double quote.
        return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
};

const triggerDownload = (csvString: string, filename: string) => {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export interface ReplenishmentExportOptions {
    channel?: string;
    leadTime?: number;
    safetyStock?: number;
    snapshotName?: string;
}

export interface HealthExportOptions {
    snapshotName?: string;
    isComparison?: boolean;
}

/**
 * Exports data formatted specifically for the ⚡ Replenishment Matrix view,
 * containing multi-channel sales, velocity, warehouse & pipeline cover,
 * lead time buffers, reorder status, and suggested PO quantities.
 */
export const exportReplenishmentMatrixCSV = (
    data: ProductData[],
    options?: ReplenishmentExportOptions
) => {
    if (data.length === 0) return;
    const leadTime = options?.leadTime ?? 30;
    const safetyStock = options?.safetyStock ?? 7;
    const channel = (options?.channel || 'all').toUpperCase();
    const timestamp = new Date().toISOString().split('T')[0];
    const snapshotName = (options?.snapshotName || 'Snapshot').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `WesBI_Replenishment_Matrix_${channel}_${snapshotName}_${timestamp}.csv`;

    const headers = [
        'SKU',
        'ASIN',
        'Product Name',
        'Category',
        'Marketplace Channel',
        'Daily Velocity (Units/Day)',
        'Monthly Shipped (T30)',
        'Amazon Sales (30d)',
        'Walmart Sales (30d)',
        'Shopify Sales (30d)',
        'TikTok Sales (30d)',
        'Whse Available Stock',
        'Inbound Working',
        'Inbound Shipped',
        'Inbound Receiving',
        'Total Inbound En Route',
        'Net Available Stock',
        'Whse Days of Cover',
        'Pipeline Days of Cover',
        'Supplier Lead Time (Days)',
        'Safety Stock (Days)',
        'Reorder Buffer (Days)',
        'Reorder Status',
        'Suggested PO Qty',
        'Stockout Timing',
        'Days Until Stockout'
    ];

    const dataRows = data.map(item => {
        const totalInbound = (item.inboundWorking || 0) + (item.inboundShipped || 0) + (item.inboundReceiving || 0);
        const dailyVel = item.dailyVelocity !== undefined 
            ? item.dailyVelocity 
            : Number((item.shippedT30 / 30).toFixed(1));
        const whseCover = item.whseDaysOfCover !== undefined 
            ? (item.whseDaysOfCover > 990 ? '999+' : item.whseDaysOfCover.toFixed(1)) 
            : (item.daysOfCover !== undefined ? item.daysOfCover.toFixed(1) : '-');
        const pipeCover = item.pipelineDaysOfCover !== undefined 
            ? (item.pipelineDaysOfCover > 990 ? '999+' : item.pipelineDaysOfCover.toFixed(1)) 
            : '-';
        const stockoutTiming = item.stockoutDate || (item.daysUntilStockout ? `${item.daysUntilStockout} days` : 'No Stockout Risk');

        const row = [
            escapeCSVField(item.sku),
            escapeCSVField(item.asin),
            escapeCSVField(item.name),
            escapeCSVField(item.category),
            escapeCSVField(channel),
            escapeCSVField(dailyVel),
            escapeCSVField(item.shippedT30),
            escapeCSVField(item.channelSales?.amazon ?? Math.round(item.shippedT30 * 0.65)),
            escapeCSVField(item.channelSales?.walmart ?? Math.round(item.shippedT30 * 0.15)),
            escapeCSVField(item.channelSales?.shopify ?? Math.round(item.shippedT30 * 0.12)),
            escapeCSVField(item.channelSales?.tiktok ?? Math.round(item.shippedT30 * 0.08)),
            escapeCSVField(item.available),
            escapeCSVField(item.inboundWorking || 0),
            escapeCSVField(item.inboundShipped || 0),
            escapeCSVField(item.inboundReceiving || 0),
            escapeCSVField(totalInbound),
            escapeCSVField(item.netAvailableStock ?? (item.available + totalInbound)),
            escapeCSVField(whseCover),
            escapeCSVField(pipeCover),
            escapeCSVField(leadTime),
            escapeCSVField(safetyStock),
            escapeCSVField(leadTime + safetyStock),
            escapeCSVField(item.reorderStatus || 'HEALTHY'),
            escapeCSVField(item.suggestedReorderQty || 0),
            escapeCSVField(stockoutTiming),
            escapeCSVField(item.daysUntilStockout !== undefined ? item.daysUntilStockout : '')
        ];
        return row.join(',');
    });

    const csvString = `${headers.join(',')}\n${dataRows.join('\n')}`;
    triggerDownload(csvString, filename);
};

/**
 * Exports data formatted specifically for the 📊 Inventory Health & Risk view,
 * containing inventory aging brackets, sell-through percentage,
 * removal recommendations, and risk scores.
 */
export const exportInventoryHealthCSV = (
    data: ProductData[],
    options?: HealthExportOptions
) => {
    if (data.length === 0) return;
    const timestamp = new Date().toISOString().split('T')[0];
    const snapshotName = (options?.snapshotName || 'Snapshot').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `WesBI_Inventory_Health_Risk_${snapshotName}_${timestamp}.csv`;

    const headers = [
        'SKU',
        'ASIN',
        'Product Name',
        'Category',
        'Condition',
        'Whse Available',
        'Pending Removal',
        'Inbound Working',
        'Inbound Shipped',
        'Inbound Receiving',
        'Net Available Stock',
        'Days of Cover',
        'Shipped T30',
        'Inv Age 0-90 Days',
        'Inv Age 91-180 Days',
        'Inv Age 181-270 Days',
        'Inv Age 271-365 Days',
        'Inv Age 365+ Days',
        'Avg Inv Age (Days)',
        'Sell-Through Rate (%)',
        'Recommended Removal Action',
        'Risk Score',
        'Restock Recommendation'
    ];

    const isComparison = options?.isComparison || (data[0] && data[0].inventoryChange !== undefined);
    if (isComparison) {
        headers.push('Inventory Change', 'Shipped Change', 'Age Change', 'Risk Score Change', 'Velocity Trend (%)');
    }

    const dataRows = data.map(item => {
        const row = [
            escapeCSVField(item.sku),
            escapeCSVField(item.asin),
            escapeCSVField(item.name),
            escapeCSVField(item.category),
            escapeCSVField(item.condition),
            escapeCSVField(item.available),
            escapeCSVField(item.pendingRemoval),
            escapeCSVField(item.inboundWorking || 0),
            escapeCSVField(item.inboundShipped || 0),
            escapeCSVField(item.inboundReceiving || 0),
            escapeCSVField(item.netAvailableStock ?? item.available),
            escapeCSVField(item.daysOfCover !== undefined ? item.daysOfCover.toFixed(1) : '-'),
            escapeCSVField(item.shippedT30),
            escapeCSVField(item.invAge0to90),
            escapeCSVField(item.invAge91to180),
            escapeCSVField(item.invAge181to270),
            escapeCSVField(item.invAge271to365),
            escapeCSVField(item.invAge365plus),
            escapeCSVField(item.totalInvAgeDays),
            escapeCSVField(item.sellThroughRate),
            escapeCSVField(item.recommendedAction),
            escapeCSVField(item.riskScore),
            escapeCSVField(item.restockRecommendation || 0)
        ];

        if (isComparison) {
            row.push(
                escapeCSVField(item.inventoryChange ?? 0),
                escapeCSVField(item.shippedChange ?? 0),
                escapeCSVField(item.ageChange ?? 0),
                escapeCSVField(item.riskScoreChange ?? 0),
                escapeCSVField(item.velocityTrend === 999 ? 'New' : (item.velocityTrend ?? ''))
            );
        }

        return row.join(',');
    });

    const csvString = `${headers.join(',')}\n${dataRows.join('\n')}`;
    triggerDownload(csvString, filename);
};

/**
 * Universal current view exporter that automatically chooses the correct schema
 * based on whether the active tab is 'replenishment' or 'inventory_health'.
 */
export const exportCurrentViewCSV = (
    data: ProductData[],
    viewMode: 'replenishment' | 'inventory_health',
    options?: ReplenishmentExportOptions & HealthExportOptions
) => {
    if (viewMode === 'replenishment') {
        exportReplenishmentMatrixCSV(data, options);
    } else {
        exportInventoryHealthCSV(data, options);
    }
};

export const exportToCSV = (data: ProductData[], filename: string) => {
    if (data.length === 0) {
        return;
    }

    const headers: { key: keyof ProductData; title: string }[] = [
        { key: 'sku', title: 'SKU' },
        { key: 'asin', title: 'ASIN' },
        { key: 'name', title: 'Product Name' },
        { key: 'condition', title: 'Condition' },
        { key: 'available', title: 'Available' },
        { key: 'pendingRemoval', title: 'Pending Removal' },
        { key: 'invAge0to90', title: 'Inv Age 0-90' },
        { key: 'invAge91to180', title: 'Inv Age 91-180' },
        { key: 'invAge181to270', title: 'Inv Age 181-270' },
        { key: 'invAge271to365', title: 'Inv Age 271-365' },
        { key: 'invAge365plus', title: 'Inv Age 365+' },
        { key: 'totalInvAgeDays', title: 'Avg Inv Age (Days)' },
        { key: 'shippedT30', title: 'Shipped T30' },
        { key: 'dailyVelocity', title: 'Daily Velocity (Units/Day)' },
        { key: 'whseDaysOfCover', title: 'Whse Days of Cover' },
        { key: 'pipelineDaysOfCover', title: 'Pipeline Days of Cover' },
        { key: 'reorderStatus', title: 'Reorder Status' },
        { key: 'suggestedReorderQty', title: 'Suggested Reorder Qty' },
        { key: 'stockoutDate', title: 'Stockout Timing' },
        { key: 'sellThroughRate', title: 'Sell-Through (%)' },
        { key: 'recommendedAction', title: 'Recommended Action' },
        { key: 'riskScore', title: 'Risk Score' },
        { key: 'category', title: 'Category' },
        { key: 'restockRecommendation', title: 'Restock Recommendation' },
    ];
    
    // Add comparison headers if they exist in the data
    if (data[0] && data[0].inventoryChange !== undefined) {
        headers.push({ key: 'inventoryChange', title: 'Inventory Change' });
        headers.push({ key: 'shippedChange', title: 'Shipped Change' });
        headers.push({ key: 'ageChange', title: 'Age Change' });
        headers.push({ key: 'riskScoreChange', title: 'Risk Score Change' });
        
        if (data[0].velocityTrend !== undefined) {
            headers.push({ key: 'velocityTrend', title: 'Velocity Trend (%)' });
        }
    }

    const headerRow = headers.map(h => h.title).join(',');
    
    const dataRows = data.map(row => {
        return headers.map(header => {
            const value = row[header.key];
            if (header.key === 'velocityTrend' && value === 999) {
                return escapeCSVField('New');
            }
            return escapeCSVField(value);
        }).join(',');
    }).join('\n');

    const csvString = `${headerRow}\n${dataRows}`;
    triggerDownload(csvString, filename);
};
