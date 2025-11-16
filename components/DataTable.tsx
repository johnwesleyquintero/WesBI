
import React from 'react';
import type { ProductData, SortConfig } from '../types';

interface DataTableProps {
    data: ProductData[];
    sortConfig: SortConfig;
    onSort: (key: keyof ProductData) => void;
    isComparisonMode: boolean;
}

const SortableHeader: React.FC<{
    columnKey: keyof ProductData;
    title: string;
    sortConfig: SortConfig;
    onSort: (key: keyof ProductData) => void;
    className?: string;
}> = ({ columnKey, title, sortConfig, onSort, className = '' }) => {
    const isSorted = sortConfig.key === columnKey;
    const directionIcon = sortConfig.direction === 'asc' ? '▲' : '▼';

    return (
        <th className={`cursor-pointer select-none ${className}`} onClick={() => onSort(columnKey)}>
            {title} {isSorted && <span className="text-[#9c4dff]">{directionIcon}</span>}
        </th>
    );
};

const DataTableRow: React.FC<{ item: ProductData; isComparisonMode: boolean }> = ({ item, isComparisonMode }) => {
    const getRowClass = () => {
        if (isComparisonMode) {
            if ((item.inventoryChange ?? 0) > 0) return 'bg-green-100/50';
            if ((item.inventoryChange ?? 0) < 0) return 'bg-red-100/50';
            return 'bg-gray-100/50';
        }
        if (item.riskScore > 85) return 'bg-red-100 border-l-4 border-red-500';
        if (item.riskScore > 70) return 'bg-amber-100 border-l-4 border-amber-500';
        if (item.recommendedAction.toLowerCase().includes('removal')) return 'bg-yellow-100';
        if (item.sellThroughRate > 70) return 'bg-green-100';
        return '';
    };

    const getStatusBadgeClass = (action: string) => {
        if (action.toLowerCase().includes('removal')) return 'bg-red-100 text-red-800';
        if (item.riskScore > 70) return 'bg-amber-100 text-amber-800';
        return 'bg-green-100 text-green-800';
    };

    const renderChange = (change: number | undefined) => {
        if (change === undefined) return null;
        const isPositive = change > 0;
        const color = isPositive ? 'text-green-600' : 'text-red-600';
        return <div className={`text-xs ${color}`}>({isPositive ? '+' : ''}{change})</div>;
    };

    return (
        <tr className={`hover:bg-purple-50 transition-colors duration-200 ${getRowClass()}`}>
            <td className="font-mono font-semibold text-[#6c34ff] min-w-[120px]">{item.sku}</td>
            <td className="font-mono text-gray-600 min-w-[100px]">{item.asin}</td>
            <td className="min-w-[200px] max-w-[300px]">{item.name}</td>
            <td>{item.condition}</td>
            <td className="text-right font-mono">
                {item.available.toLocaleString()}
                {isComparisonMode && renderChange(item.inventoryChange)}
            </td>
            <td className="text-right font-mono">{item.pendingRemoval.toLocaleString()}</td>
            <td className="text-right font-mono">
                {item.totalInvAgeDays}
                {isComparisonMode && renderChange(item.ageChange)}
            </td>
            <td className="text-right font-mono">
                {item.shippedT30.toLocaleString()}
                 {isComparisonMode && renderChange(item.shippedChange)}
            </td>
            <td className="text-right font-mono">{item.sellThroughRate}%</td>
            <td>
                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(item.recommendedAction)}`}>
                    {item.recommendedAction}
                </span>
            </td>
            <td className="text-right font-mono">
                {item.riskScore}
                {isComparisonMode && renderChange(item.riskScoreChange)}
            </td>
        </tr>
    );
};


const DataTable: React.FC<DataTableProps> = ({ data, sortConfig, onSort, isComparisonMode }) => {
    const headers: { key: keyof ProductData; title: string; isNumeric?: boolean }[] = [
        { key: 'sku', title: 'SKU' },
        { key: 'asin', title: 'ASIN' },
        { key: 'name', title: 'Product Name' },
        { key: 'condition', title: 'Condition' },
        { key: 'available', title: 'Available', isNumeric: true },
        { key: 'pendingRemoval', title: 'Pending Removal', isNumeric: true },
        { key: 'totalInvAgeDays', title: 'Avg Inv Age', isNumeric: true },
        { key: 'shippedT30', title: 'Shipped T30', isNumeric: true },
        { key: 'sellThroughRate', title: 'Sell-Through', isNumeric: true },
        { key: 'recommendedAction', title: 'Action' },
        { key: 'riskScore', title: 'Risk Score', isNumeric: true },
    ];

    return (
        <div className="p-4 md:p-6 overflow-x-auto">
            <table className="w-full min-w-[1200px] border-collapse">
                <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                        {headers.map(h => (
                            <SortableHeader
                                key={h.key}
                                columnKey={h.key}
                                title={h.title}
                                sortConfig={sortConfig}
                                onSort={onSort}
                                className={`p-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider ${h.isNumeric ? 'text-right' : ''}`}
                            />
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 text-sm text-gray-700">
                    {data.length > 0 ? (
                        data.map(item => <DataTableRow key={item.sku} item={item} isComparisonMode={isComparisonMode} />)
                    ) : (
                        <tr>
                            <td colSpan={headers.length} className="text-center py-16 text-gray-500">
                                <div className="text-xl">📁</div>
                                <div>No products match your filters.</div>
                                <div className="text-xs mt-1">Try adjusting your search or filters.</div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default DataTable;
