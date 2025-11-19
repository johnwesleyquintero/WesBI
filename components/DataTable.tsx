

import * as React from 'react';
import type { ProductData, SortConfig } from '../types';
import { FileIcon, ChevronUpIcon, ChevronDownIcon, ClockIcon, AlertTriangleIcon, CheckCircleIcon } from './Icons';
import { useAppContext } from '../state/appContext';
import { RISK_SCORE_THRESHOLDS, SELL_THROUGH_THRESHOLDS } from '../constants';

interface DataTableProps {
    data: ProductData[];
}

const SortableHeader: React.FC<{
    columnKey: keyof ProductData;
    title: string;
    sortConfig: SortConfig;
    onSort: (key: keyof ProductData, shiftKey: boolean) => void;
    className?: string;
    tooltip?: string;
}> = ({ columnKey, title, sortConfig, onSort, className = '', tooltip }) => {
    
    const sortInfo = React.useMemo(() => {
        const index = sortConfig.findIndex(s => s.key === columnKey);
        if (index === -1) return null;
        return {
            direction: sortConfig[index].direction,
            priority: index + 1
        };
    }, [sortConfig, columnKey]);
    
    const isSorted = !!sortInfo;
    
    return (
        <th 
            scope="col" 
            className={`cursor-pointer select-none group relative ${className}`} 
            onClick={(e) => onSort(columnKey, e.shiftKey)}
            title={tooltip}
        >
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

// Use React.memo to prevent unnecessary re-renders of rows when sorting changes but data remains the same.
const DataTableRow = React.memo(({ item, isComparisonMode }: { item: ProductData; isComparisonMode: boolean }) => {
    const getRowClass = () => {
        if (item.urgencyStatus === 'Critical') return 'bg-red-50 border-l-4 border-red-500';
        if (isComparisonMode) {
            if ((item.inventoryChange ?? 0) > 0) return 'bg-green-100/50';
            if ((item.inventoryChange ?? 0) < 0) return 'bg-red-100/50';
            return 'bg-gray-100/50';
        }
        if (item.riskScore > RISK_SCORE_THRESHOLDS.HIGH_RISK) return 'bg-red-100 border-l-4 border-red-500';
        if (item.riskScore > RISK_SCORE_THRESHOLDS.MEDIUM_RISK) return 'bg-amber-100 border-l-4 border-amber-500';
        if (item.recommendedAction.toLowerCase().includes('removal')) return 'bg-yellow-100';
        if (item.sellThroughRate > SELL_THROUGH_THRESHOLDS.HOT_ITEM) return 'bg-green-100';
        return '';
    };

    const getStatusBadgeClass = (action: string) => {
        if (action.toLowerCase().includes('removal')) return 'bg-red-100 text-red-800';
        if (item.riskScore > RISK_SCORE_THRESHOLDS.MEDIUM_RISK) return 'bg-amber-100 text-amber-800';
        return 'bg-green-100 text-green-800';
    };
    
    const getRestockCellClass = (recommendation: number | undefined) => {
        if (recommendation && recommendation > 0) {
            return 'bg-blue-100/50 font-bold text-blue-800';
        }
        return '';
    }

    const renderChange = (change: number | undefined) => {
        if (change === undefined) return null;

        if (change === 0) {
            return <div className="text-xs text-gray-500">(0)</div>;
        }

        const isPositive = change > 0;
        const color = isPositive ? 'text-green-600' : 'text-red-600';
        const formattedChange = (isPositive ? '+' : '') + change.toLocaleString();
        return <div className={`text-xs ${color}`}>({formattedChange})</div>;
    };
    
    const renderVelocityTrend = (trend: number | undefined) => {
        if (trend === undefined) return null;
        if (trend === 999) return <div className="text-xs text-green-600 font-semibold">(New)</div>;
        if (trend === 0) return <div className="text-xs text-gray-500">(0%)</div>;
        
        const isPositive = trend > 0;
        const color = trend > 10 ? 'text-green-600' : trend < -10 ? 'text-red-600' : 'text-gray-500';
        return <div className={`text-xs ${color}`}>({isPositive ? '+' : ''}{trend.toFixed(0)}%)</div>;
    };

    // --- New Logistics Renderers ---
    const renderInbound = () => {
        if (item.inboundWorking === undefined && item.inboundShipped === undefined) return <span className="text-gray-400">-</span>;
        const totalInbound = (item.inboundWorking || 0) + (item.inboundShipped || 0) + (item.inboundReceiving || 0);
        return (
            <div className="group relative cursor-help">
                <span className="font-mono">{totalInbound.toLocaleString()}</span>
                {totalInbound > 0 && (
                     <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none z-50">
                        <div>Working: {item.inboundWorking || 0}</div>
                        <div>Shipped: {item.inboundShipped || 0}</div>
                        <div>Receiving: {item.inboundReceiving || 0}</div>
                    </div>
                )}
            </div>
        );
    };

    const renderUrgency = () => {
        if (!item.urgencyStatus) return <span className="text-gray-400">-</span>;
        if (item.urgencyStatus === 'Critical') {
            return <AlertTriangleIcon className="w-5 h-5 text-red-500 mx-auto" />;
        }
        if (item.urgencyStatus === 'Warning') {
            return <ClockIcon className="w-5 h-5 text-amber-500 mx-auto" />;
        }
        return <CheckCircleIcon className="w-5 h-5 text-green-500/30 mx-auto" />;
    };

    const renderCoverage = () => {
        if (item.daysOfCover === undefined) return <span className="text-gray-400">-</span>;
        let colorClass = 'text-green-600';
        if (item.daysOfCover < 3) colorClass = 'text-red-600 font-bold';
        else if (item.daysOfCover < 7) colorClass = 'text-amber-600 font-medium';
        
        return <span className={`font-mono ${colorClass}`}>{item.daysOfCover > 180 ? '180+' : item.daysOfCover.toFixed(1)}d</span>;
    };


    return (
        <tr className={`hover:bg-purple-50 transition-colors duration-200 ${getRowClass()}`}>
            <td className="font-mono font-semibold text-[#6c34ff] min-w-[120px]">{item.sku}</td>
            <td className="font-mono text-gray-600 min-w-[100px]">{item.asin}</td>
            <td className="min-w-[200px] max-w-[300px] truncate" title={item.name}>{item.name}</td>
            <td>{item.condition}</td>
            
            {/* Standard Inventory */}
            <td className="text-right font-mono">
                {item.available.toLocaleString()}
                {isComparisonMode && renderChange(item.inventoryChange)}
            </td>

            {/* MFI Logistics Data */}
            <td className="text-right bg-gray-50/50 border-l border-gray-100">{renderInbound()}</td>
            <td className="text-right font-mono bg-gray-50/50 font-semibold text-gray-700">
                {item.netAvailableStock !== undefined ? item.netAvailableStock.toLocaleString() : '-'}
            </td>
            <td className="text-center bg-gray-50/50 border-r border-gray-100">{renderCoverage()}</td>
            <td className="text-center">{renderUrgency()}</td>

            <td className="text-right font-mono">
                {item.shippedT30.toLocaleString()}
                 {isComparisonMode && renderChange(item.shippedChange)}
            </td>
            {isComparisonMode && (
                <td className="text-right font-mono">
                    {renderVelocityTrend(item.velocityTrend)}
                </td>
            )}
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
});
// Display name for debugging
DataTableRow.displayName = 'DataTableRow';


const DataTable: React.FC<DataTableProps> = ({ data }) => {
    const { state, dispatch } = useAppContext();
    const { sortConfig, isComparisonMode } = state;

    const onSort = (key: keyof ProductData, shiftKey: boolean) => {
        dispatch({ type: 'UPDATE_SORT', payload: { key, shiftKey } });
    };

    const headers = React.useMemo(() => {
        const baseHeaders: { key: keyof ProductData; title: string; isNumeric?: boolean; tooltip?: string }[] = [
            { key: 'sku', title: 'SKU' },
            { key: 'asin', title: 'ASIN' },
            { key: 'name', title: 'Product Name' },
            { key: 'condition', title: 'Condition' },
            { key: 'available', title: 'Whse', isNumeric: true, tooltip: "Available in Warehouse (Snapshot)" },
            // New Logistics Columns
            { key: 'inboundWorking', title: 'Inbound', isNumeric: true, tooltip: "Working + Shipped + Receiving (MFI)" },
            { key: 'netAvailableStock', title: 'Net Stock', isNumeric: true, tooltip: "(Fulfillable + Inbound) - Reserved" },
            { key: 'daysOfCover', title: 'Cover', isNumeric: false, tooltip: "Stock Coverage Days" },
            { key: 'urgencyScore', title: 'Urg.', isNumeric: false, tooltip: "Restock Urgency Status" },
            
            { key: 'shippedT30', title: 'Shipped T30', isNumeric: true },
            { key: 'sellThroughRate', title: 'Sell-Through', isNumeric: true },
            { key: 'recommendedAction', title: 'Action' },
            { key: 'riskScore', title: 'Risk', isNumeric: true },
        ];

        if (isComparisonMode) {
            const shippedIndex = baseHeaders.findIndex(h => h.key === 'shippedT30');
            if (shippedIndex > -1) {
                baseHeaders.splice(shippedIndex + 1, 0, {
                    key: 'velocityTrend',
                    title: 'Trend',
                    isNumeric: true
                });
            }
        }
        return baseHeaders;
    }, [isComparisonMode]);


    return (
        <div className="p-4 md:p-6 overflow-x-auto">
            <table className="w-full min-w-[1200px] border-collapse">
                <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
                    <tr>
                        {headers.map(h => (
                            <SortableHeader
                                key={h.key}
                                columnKey={h.key}
                                title={h.title}
                                sortConfig={sortConfig}
                                onSort={onSort}
                                tooltip={h.tooltip}
                                className={`p-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider ${h.isNumeric ? 'text-right' : 'text-center'}`}
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