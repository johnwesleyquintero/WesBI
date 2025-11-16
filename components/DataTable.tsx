
import React, { useMemo } from 'react';
import type { ProductData, SortConfig } from '../types';
import { FileIcon, ChevronUpIcon, ChevronDownIcon } from './Icons';
import { useAppContext } from '../state/appContext';

interface DataTableProps {
    data: ProductData[];
}

const formatCurrency = (value: number | undefined, digits = 2) => {
    if (value === undefined || isNaN(value)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    }).format(value);
};

const SortableHeader: React.FC<{
    columnKey: keyof ProductData;
    title: string;
    sortConfig: SortConfig;
    onSort: (key: keyof ProductData, shiftKey: boolean) => void;
    className?: string;
}> = ({ columnKey, title, sortConfig, onSort, className = '' }) => {
    
    const sortInfo = useMemo(() => {
        const index = sortConfig.findIndex(s => s.key === columnKey);
        if (index === -1) return null;
        return {
            direction: sortConfig[index].direction,
            priority: index + 1
        };
    }, [sortConfig, columnKey]);
    
    const isSorted = !!sortInfo;
    
    return (
        <th scope="col" className={`cursor-pointer select-none ${className}`} onClick={(e) => onSort(columnKey, e.shiftKey)}>
            <span className="inline-flex items-center">
                {title}
                {isSorted && (
                    <span className="text-[#9c4dff] ml-1.5 flex items-center gap-1">
                        {sortInfo.priority > 1 && (
                            <span className="text-xs font-bold bg-purple-200 text-purple-700 rounded-full w-4 h-4 flex items-center justify-center">
                                {sortInfo.priority}
                            </span>
                        )}
                        {sortInfo.direction === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />}
                    </span>
                )}
            </span>
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
    
    const getRestockCellClass = (recommendation: number | undefined) => {
        if (recommendation && recommendation > 0) {
            return 'bg-blue-100/50 font-bold text-blue-800';
        }
        return '';
    }

    const renderChange = (change: number | undefined, isCurrency = false) => {
        if (change === undefined) return null;
        const isPositive = change > 0;
        const color = isPositive ? 'text-green-600' : 'text-red-600';
        const formattedChange = isCurrency ? formatCurrency(change, 0) : (isPositive ? '+' : '') + change.toLocaleString();
        return <div className={`text-xs ${color}`}>({formattedChange})</div>;
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
            <td className="text-right font-mono">
                {formatCurrency(item.inventoryValue, 0)}
                {isComparisonMode && renderChange(item.inventoryValueChange, true)}
            </td>
            <td className="text-right font-mono">{formatCurrency(item.potentialRevenue, 0)}</td>
            <td className="text-right font-mono">{formatCurrency(item.grossProfitPerUnit)}</td>
            <td className={`text-right font-mono ${getRestockCellClass(item.restockRecommendation)}`}>
                {item.restockRecommendation?.toLocaleString() ?? 0}
            </td>
        </tr>
    );
};


const DataTable: React.FC<DataTableProps> = ({ data }) => {
    const { state, dispatch } = useAppContext();
    const { sortConfig, isComparisonMode } = state;

    const onSort = (key: keyof ProductData, shiftKey: boolean) => {
        dispatch({ type: 'UPDATE_SORT', payload: { key, shiftKey } });
    };

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
        { key: 'inventoryValue', title: 'Inv. Value', isNumeric: true },
        { key: 'potentialRevenue', title: 'Potential Rev.', isNumeric: true },
        { key: 'grossProfitPerUnit', title: 'Profit/Unit', isNumeric: true },
        { key: 'restockRecommendation', title: 'Restock Units', isNumeric: true },
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
                                <FileIcon className="w-12 h-12 mx-auto text-gray-400" />
                                <div className="mt-2">No products match your filters.</div>
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