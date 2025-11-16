import type { ProductData } from '../types';

const escapeCSVField = (field: any): string => {
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
        { key: 'sellThroughRate', title: 'Sell-Through (%)' },
        { key: 'recommendedAction', title: 'Recommended Action' },
        { key: 'riskScore', title: 'Risk Score' },
        { key: 'category', title: 'Category' },
    ];
    
    // Add comparison headers if they exist in the data
    if (data[0] && data[0].inventoryChange !== undefined) {
        headers.push({ key: 'inventoryChange', title: 'Inventory Change' });
        headers.push({ key: 'shippedChange', title: 'Shipped Change' });
        headers.push({ key: 'ageChange', title: 'Age Change' });
        headers.push({ key: 'riskScoreChange', title: 'Risk Score Change' });
    }

    const headerRow = headers.map(h => h.title).join(',');
    
    const dataRows = data.map(row => {
        return headers.map(header => {
            return escapeCSVField(row[header.key]);
        }).join(',');
    }).join('\n');

    const csvString = `${headerRow}\n${dataRows}`;

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
