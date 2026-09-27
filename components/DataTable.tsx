
import * as React from 'react';
import type { ProductData, SortConfig, ReorderStatus } from '../types';
import { FileIcon, ChevronUpIcon, ChevronDownIcon, ClockIcon, AlertTriangleIcon, CheckCircleIcon, SparklesIcon, ExportIcon } from './Icons';
import { useAppContext } from '../state/appContext';
import { RISK_SCORE_THRESHOLDS, SELL_THROUGH_THRESHOLDS } from '../constants';
import { exportReplenishmentMatrixCSV, exportInventoryHealthCSV } from '../services/exportUtils';

interface DataTableProps {
    data: ProductData[];
    fullData?: ProductData[];
}

// FIX: Memoize the SortableHeader to prevent re-rendering all headers when the data body changes.
const SortableHeader = React.memo(({ 
    columnKey, 
    title, 
    sortConfig, 
    onSort, 
    className = '', 
    tooltip 
}: {
    columnKey: keyof ProductData;
    title: string;
    sortConfig: SortConfig;
    onSort: (key: keyof ProductData, shiftKey: boolean) => void;
    className?: string;
    tooltip?: string;
}) => {
    
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
});
SortableHeader.displayName = 'SortableHeader';

// --- Replenishment Status Badge Helper ---
const getReorderBadge = (status?: ReorderStatus) => {
    switch (status) {
        case 'REORDER NOW':
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-600 text-white shadow-sm ring-1 ring-red-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                    REORDER NOW
                </span>
            );
        case 'REORDER SOON':
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-sm">
                    REORDER SOON
                </span>
            );
        case 'HEALTHY':
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-sm">
                    HEALTHY
                </span>
            );
        case 'OVERSTOCK':
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-600 text-white shadow-sm">
                    OVERSTOCK
                </span>
            );
        case 'LIQUIDATE':
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-800 text-white shadow-sm">
                    LIQUIDATE
                </span>
            );
        case 'STRANDED':
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-500 text-white shadow-sm">
                    STRANDED
                </span>
            );
        default:
            return <span className="text-gray-400 text-xs">-</span>;
    }
};

// --- Replenishment Row View (Justin's Requested Reorder Matrix) ---
const ReplenishmentRow = React.memo(({ item, leadTime, safetyStock }: { item: ProductData; leadTime: number; safetyStock: number }) => {
    const isCritical = item.reorderStatus === 'REORDER NOW';
    const isSoon = item.reorderStatus === 'REORDER SOON';

    const rowBg = isCritical ? 'bg-red-50/70 hover:bg-red-100/70 border-l-4 border-red-500' 
        : isSoon ? 'bg-amber-50/60 hover:bg-amber-100/60 border-l-4 border-amber-500'
        : 'hover:bg-purple-50/50';

    const totalInbound = (item.inboundWorking || 0) + (item.inboundShipped || 0) + (item.inboundReceiving || 0);

    return (
        <tr className={`transition-colors duration-150 ${rowBg}`}>
            <td className="font-mono font-bold text-[#6c34ff] min-w-[130px] p-3">{item.sku}</td>
            <td className="min-w-[220px] max-w-[320px] p-3">
                <div className="font-semibold text-gray-900 truncate" title={item.name}>{item.name}</div>
                {item.channelSales && (
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-0.5">
                        <span className="text-amber-700 bg-amber-50 px-1 py-0.2 rounded font-mono">AMZ: {item.channelSales.amazon}</span>
                        <span className="text-blue-700 bg-blue-50 px-1 py-0.2 rounded font-mono">WMT: {item.channelSales.walmart}</span>
                        <span className="text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded font-mono">SHO: {item.channelSales.shopify}</span>
                        <span className="text-rose-700 bg-rose-50 px-1 py-0.2 rounded font-mono">TT: {item.channelSales.tiktok}</span>
                    </div>
                )}
            </td>
            {/* Daily & Monthly Velocity */}
            <td className="text-right p-3 font-mono">
                <div className="font-bold text-gray-900">{item.dailyVelocity ?? (item.shippedT30 / 30).toFixed(1)}/d</div>
                <div className="text-[11px] text-gray-500">({item.shippedT30.toLocaleString()} /mo)</div>
            </td>
            {/* Physical Whse Available */}
            <td className="text-right p-3 font-mono">
                <span className={`inline-block px-1.5 py-0.5 rounded font-semibold ${item.whseDaysOfCover !== undefined && item.whseDaysOfCover <= 3 ? 'bg-red-100 text-red-700 font-bold' : 'text-gray-800'}`}>
                    {item.available.toLocaleString()}
                </span>
            </td>
            {/* Inbound Pipeline */}
            <td className="text-right p-3 font-mono text-gray-700">
                {totalInbound > 0 ? (
                    <span className="bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded font-semibold">
                        +{totalInbound.toLocaleString()}
                    </span>
                ) : (
                    <span className="text-gray-400">0</span>
                )}
            </td>
            {/* Whse Cover (Days) */}
            <td className="text-center p-3 font-mono">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                    item.whseDaysOfCover !== undefined && item.whseDaysOfCover <= 3
                        ? 'bg-red-600 text-white animate-pulse'
                        : item.whseDaysOfCover !== undefined && item.whseDaysOfCover <= 7
                        ? 'bg-amber-100 text-amber-800'
                        : 'text-gray-700'
                }`}>
                    {item.whseDaysOfCover !== undefined ? (item.whseDaysOfCover >= 180 ? '180+d' : `${item.whseDaysOfCover}d`) : '-'}
                </span>
            </td>
            {/* Pipeline Cover (Days) */}
            <td className="text-center p-3 font-mono font-semibold text-gray-800">
                {item.pipelineDaysOfCover !== undefined ? (item.pipelineDaysOfCover >= 180 ? '180+d' : `${item.pipelineDaysOfCover}d`) : '-'}
            </td>
            {/* Required Window (Lead Time + Safety) */}
            <td className="text-center p-3 text-xs text-gray-600 font-mono">
                <span className="font-bold text-gray-800">{leadTime + safetyStock}d</span>
                <span className="text-[11px] text-gray-400 block font-sans">({leadTime}d LT + {safetyStock}d SS)</span>
            </td>
            {/* Reorder Status Badge */}
            <td className="text-center p-3 whitespace-nowrap">
                {getReorderBadge(item.reorderStatus)}
            </td>
            {/* Suggested PO Qty */}
            <td className="text-right p-3 font-mono">
                {item.suggestedReorderQty && item.suggestedReorderQty > 0 ? (
                    <span className="inline-block bg-blue-100 text-blue-900 border border-blue-300 font-bold px-2 py-0.5 rounded text-xs">
                        +{item.suggestedReorderQty.toLocaleString()} units
                    </span>
                ) : (
                    <span className="text-gray-400 text-xs">-</span>
                )}
            </td>
            {/* Stockout Urgency / Timing */}
            <td className="text-center p-3 text-xs whitespace-nowrap">
                {item.daysUntilStockout !== undefined && item.daysUntilStockout <= 2 ? (
                    <span className="inline-flex items-center gap-1 font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                        <AlertTriangleIcon className="w-3.5 h-3.5 text-red-600" />
                        Stockout &lt; 48h
                    </span>
                ) : item.daysUntilStockout !== undefined && item.daysUntilStockout <= 7 ? (
                    <span className="font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                        In {item.daysUntilStockout} days
                    </span>
                ) : (
                    <span className="text-gray-500 font-mono">{item.stockoutDate || 'Healthy'}</span>
                )}
            </td>
        </tr>
    );
});
ReplenishmentRow.displayName = 'ReplenishmentRow';

// --- Classic Inventory Health Row View (Original WesBI View) ---
const HealthRow = React.memo(({ item, isComparisonMode }: { item: ProductData; isComparisonMode: boolean }) => {
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

    const renderChange = (change: number | undefined) => {
        if (change === undefined) return null;
        if (change === 0) return <div className="text-xs text-gray-500">(0)</div>;
        const isPositive = change > 0;
        const color = isPositive ? 'text-green-600' : 'text-red-600';
        const formattedChange = (isPositive ? '+' : '') + change.toLocaleString();
        return <div className={`text-xs ${color}`}>({formattedChange})</div>;
    };

    const totalInbound = (item.inboundWorking || 0) + (item.inboundShipped || 0) + (item.inboundReceiving || 0);

    return (
        <tr className={`hover:bg-purple-50 transition-colors duration-200 ${getRowClass()}`}>
            <td className="font-mono font-semibold text-[#6c34ff] min-w-[120px] p-3">{item.sku}</td>
            <td className="font-mono text-gray-600 min-w-[100px] p-3">{item.asin}</td>
            <td className="min-w-[200px] max-w-[300px] truncate p-3" title={item.name}>{item.name}</td>
            <td className="p-3">{item.condition}</td>
            
            <td className="text-right font-mono p-3">
                {item.available.toLocaleString()}
                {isComparisonMode && renderChange(item.inventoryChange)}
            </td>

            <td className="text-right bg-gray-50/50 border-l border-gray-100 p-3 font-mono">
                {totalInbound > 0 ? totalInbound.toLocaleString() : '-'}
            </td>
            <td className="text-right font-mono bg-gray-50/50 font-semibold text-gray-700 p-3">
                {item.netAvailableStock !== undefined ? item.netAvailableStock.toLocaleString() : item.available.toLocaleString()}
            </td>
            <td className="text-center bg-gray-50/50 border-r border-gray-100 p-3 font-mono">
                {item.daysOfCover !== undefined ? (item.daysOfCover > 180 ? '180+' : item.daysOfCover.toFixed(1)) : '-'}d
            </td>

            <td className="text-right font-mono p-3">
                {item.shippedT30.toLocaleString()}
                {isComparisonMode && renderChange(item.shippedChange)}
            </td>
            <td className="text-right font-mono p-3">{item.sellThroughRate}%</td>
            
            <td className="p-3">
                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(item.recommendedAction)}`}>
                    {item.recommendedAction}
                </span>
            </td>
            <td className="text-right font-mono p-3">
                {item.riskScore}
                {isComparisonMode && renderChange(item.riskScoreChange)}
            </td>
        </tr>
    );
});
HealthRow.displayName = 'HealthRow';

const DataTable: React.FC<DataTableProps> = ({ data, fullData }) => {
    const { state, dispatch } = useAppContext();
    const { sortConfig, isComparisonMode, viewMode, forecastSettings, filters, selectedChannel, activeSnapshotKey, snapshots } = state;
    const activeSnapshot = activeSnapshotKey ? snapshots[activeSnapshotKey] : null;

    const exportData = fullData && fullData.length > 0 ? fullData : data;

    const onSort = React.useCallback((key: keyof ProductData, shiftKey: boolean) => {
        dispatch({ type: 'UPDATE_SORT', payload: { key, shiftKey } });
    }, [dispatch]);

    const handleExportReplenishment = React.useCallback(() => {
        if (exportData.length === 0) {
            dispatch({ type: 'ADD_TOAST', payload: {
                type: 'info',
                title: 'No Data to Export',
                message: 'There are no products matching your current filters in Replenishment Matrix.'
            }});
            return;
        }
        exportReplenishmentMatrixCSV(exportData, {
            channel: selectedChannel,
            leadTime: forecastSettings.leadTime,
            safetyStock: forecastSettings.safetyStock,
            snapshotName: activeSnapshot?.name,
        });
        dispatch({ type: 'ADD_TOAST', payload: {
            type: 'success',
            title: 'Replenishment Matrix Exported',
            message: `Exported ${exportData.length} SKUs with lead time (${forecastSettings.leadTime}d) and reorder calculations.`
        }});
    }, [exportData, selectedChannel, forecastSettings, activeSnapshot, dispatch]);

    const handleExportHealth = React.useCallback(() => {
        if (exportData.length === 0) {
            dispatch({ type: 'ADD_TOAST', payload: {
                type: 'info',
                title: 'No Data to Export',
                message: 'There are no products matching your current filters in Inventory Health & Risk.'
            }});
            return;
        }
        exportInventoryHealthCSV(exportData, {
            snapshotName: activeSnapshot?.name,
            isComparison: isComparisonMode,
        });
        dispatch({ type: 'ADD_TOAST', payload: {
            type: 'success',
            title: 'Inventory Health & Risk Exported',
            message: `Exported ${exportData.length} SKUs with aging brackets, sell-through, risk scores, and removal actions.`
        }});
    }, [exportData, activeSnapshot, isComparisonMode, dispatch]);

    const handleExportCurrentView = React.useCallback(() => {
        if (viewMode === 'replenishment') {
            handleExportReplenishment();
        } else {
            handleExportHealth();
        }
    }, [viewMode, handleExportReplenishment, handleExportHealth]);

    // Summary KPI Counts for Replenishment
    const counts = React.useMemo(() => {
        let reorderNow = 0;
        let reorderSoon = 0;
        let healthy = 0;
        let overstock = 0;
        let liquidate = 0;

        exportData.forEach(item => {
            if (item.reorderStatus === 'REORDER NOW') reorderNow++;
            else if (item.reorderStatus === 'REORDER SOON') reorderSoon++;
            else if (item.reorderStatus === 'HEALTHY') healthy++;
            else if (item.reorderStatus === 'OVERSTOCK') overstock++;
            else if (item.reorderStatus === 'LIQUIDATE') liquidate++;
        });

        return { reorderNow, reorderSoon, healthy, overstock, liquidate };
    }, [exportData]);

    const replenishmentHeaders: { key: keyof ProductData; title: string; isNumeric?: boolean; tooltip?: string }[] = [
        { key: 'sku', title: 'SKU' },
        { key: 'name', title: 'Product Name & Channels' },
        { key: 'dailyVelocity', title: 'Velocity', isNumeric: true, tooltip: 'Units Sold / Day (Across Selected Channel)' },
        { key: 'available', title: 'Whse Stock', isNumeric: true, tooltip: 'Physical Inventory in Fulfillment Center' },
        { key: 'inboundShipped', title: 'Inbound En Route', isNumeric: true, tooltip: 'Working + Shipped + Receiving Inbound' },
        { key: 'whseDaysOfCover', title: 'Whse Cover', tooltip: 'Days of Physical Stock Remaining Before Warehouse Stocks Out' },
        { key: 'pipelineDaysOfCover', title: 'Pipeline Cover', tooltip: 'Days of Total Coverage Including En Route Inbound' },
        { key: 'reorderPoint', title: 'Reorder Window', tooltip: 'Required Buffer: Supplier Lead Time + Safety Stock' },
        { key: 'reorderStatus', title: 'Reorder Status', tooltip: 'Operational Decision: Reorder Now, Soon, Healthy, or Overstocked' },
        { key: 'suggestedReorderQty', title: 'Suggested PO Qty', isNumeric: true, tooltip: 'Recommended Restock Quantity to Cover 60-Day Target Cycle' },
        { key: 'stockoutDate', title: 'Stockout Timing', tooltip: 'Estimated Time Until Stockout at Current Velocity' },
    ];

    const healthHeaders: { key: keyof ProductData; title: string; isNumeric?: boolean; tooltip?: string }[] = [
        { key: 'sku', title: 'SKU' },
        { key: 'asin', title: 'ASIN' },
        { key: 'name', title: 'Product Name' },
        { key: 'condition', title: 'Condition' },
        { key: 'available', title: 'Whse', isNumeric: true, tooltip: 'Available in Warehouse' },
        { key: 'inboundWorking', title: 'Inbound', isNumeric: true, tooltip: 'Working + Shipped + Receiving' },
        { key: 'netAvailableStock', title: 'Net Stock', isNumeric: true, tooltip: 'Fulfillable + Inbound - Reserved' },
        { key: 'daysOfCover', title: 'Cover', tooltip: 'Coverage Days' },
        { key: 'shippedT30', title: 'Shipped T30', isNumeric: true },
        { key: 'sellThroughRate', title: 'Sell-Through', isNumeric: true },
        { key: 'recommendedAction', title: 'Removal Action' },
        { key: 'riskScore', title: 'Risk Score', isNumeric: true },
    ];

    const activeHeaders = viewMode === 'replenishment' ? replenishmentHeaders : healthHeaders;

    return (
        <div className="p-4 md:p-6 space-y-3">
            {/* View Tabs & Export Toolbar: Dedicated export button on each tab */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tab:</span>
                    <div className="inline-flex rounded-lg p-0.5 bg-gray-100 border border-gray-200">
                        {/* Tab 1: Replenishment Matrix */}
                        <div className={`flex items-center rounded-md transition-all ${
                            viewMode === 'replenishment'
                                ? 'bg-white text-[#6c34ff] shadow-sm font-bold'
                                : 'text-gray-600 hover:text-gray-900 font-medium'
                        }`}>
                            <button
                                type="button"
                                onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'replenishment' })}
                                className="px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer"
                            >
                                <span>⚡</span>
                                <span>Replenishment Matrix</span>
                                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 text-purple-800 font-mono">
                                    {exportData.length}
                                </span>
                            </button>
                            <button
                                id="datatable-export-replenishment-btn"
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleExportReplenishment();
                                }}
                                disabled={exportData.length === 0}
                                title="Export Replenishment Matrix CSV (Current View)"
                                className="px-2 py-1.5 text-[11px] font-semibold flex items-center gap-1 border-l border-gray-200 text-purple-700 hover:bg-purple-50 rounded-r-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ExportIcon className="w-3 h-3" />
                                <span className="hidden sm:inline">Export</span>
                            </button>
                        </div>

                        {/* Tab 2: Inventory Health & Risk */}
                        <div className={`flex items-center rounded-md transition-all ${
                            viewMode === 'inventory_health'
                                ? 'bg-white text-[#6c34ff] shadow-sm font-bold'
                                : 'text-gray-600 hover:text-gray-900 font-medium'
                        }`}>
                            <button
                                type="button"
                                onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'inventory_health' })}
                                className="px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer"
                            >
                                <span>📊</span>
                                <span>Inventory Health & Risk</span>
                                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 text-purple-800 font-mono">
                                    {exportData.length}
                                </span>
                            </button>
                            <button
                                id="datatable-export-health-btn"
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleExportHealth();
                                }}
                                disabled={exportData.length === 0}
                                title="Export Inventory Health & Risk CSV (Current View)"
                                className="px-2 py-1.5 text-[11px] font-semibold flex items-center gap-1 border-l border-gray-200 text-purple-700 hover:bg-purple-50 rounded-r-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ExportIcon className="w-3 h-3" />
                                <span className="hidden sm:inline">Export</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Primary Export Current View Button */}
                <div className="flex items-center gap-2">
                    <button
                        id="datatable-export-current-btn"
                        type="button"
                        onClick={handleExportCurrentView}
                        disabled={exportData.length === 0}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed ml-auto"
                        title={`Export ${viewMode === 'replenishment' ? '⚡ Replenishment Matrix' : '📊 Inventory Health & Risk'} (${exportData.length} filtered SKUs)`}
                    >
                        <ExportIcon className="w-3.5 h-3.5" />
                        <span>Export Current View ({exportData.length} SKUs)</span>
                    </button>
                </div>
            </div>
            {/* Quick Status KPI Ribbon (Replenishment Mode) */}
            {viewMode === 'replenishment' && (
                <div className="flex flex-wrap items-center gap-2 pb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-1">Reorder Filter:</span>
                    <button
                        onClick={() => dispatch({ type: 'UPDATE_FILTER', payload: { key: 'reorderStatus', value: 'all' } })}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            !filters.reorderStatus || filters.reorderStatus === 'all'
                                ? 'bg-gray-800 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        All ({data.length})
                    </button>
                    <button
                        onClick={() => dispatch({ type: 'UPDATE_FILTER', payload: { key: 'reorderStatus', value: 'REORDER NOW' } })}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            filters.reorderStatus === 'REORDER NOW'
                                ? 'bg-red-600 text-white shadow-sm ring-2 ring-red-400'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                    >
                        🚨 Reorder Now ({counts.reorderNow})
                    </button>
                    <button
                        onClick={() => dispatch({ type: 'UPDATE_FILTER', payload: { key: 'reorderStatus', value: 'REORDER SOON' } })}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            filters.reorderStatus === 'REORDER SOON'
                                ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-300'
                                : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        }`}
                    >
                        ⚠️ Reorder Soon ({counts.reorderSoon})
                    </button>
                    <button
                        onClick={() => dispatch({ type: 'UPDATE_FILTER', payload: { key: 'reorderStatus', value: 'HEALTHY' } })}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            filters.reorderStatus === 'HEALTHY'
                                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                                : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        }`}
                    >
                        ✅ Healthy ({counts.healthy})
                    </button>
                    <button
                        onClick={() => dispatch({ type: 'UPDATE_FILTER', payload: { key: 'reorderStatus', value: 'OVERSTOCK' } })}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            filters.reorderStatus === 'OVERSTOCK'
                                ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-300'
                                : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                        }`}
                    >
                        📦 Overstocked ({counts.overstock})
                    </button>
                    <button
                        onClick={() => dispatch({ type: 'UPDATE_FILTER', payload: { key: 'reorderStatus', value: 'LIQUIDATE' } })}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            filters.reorderStatus === 'LIQUIDATE'
                                ? 'bg-rose-800 text-white shadow-sm ring-2 ring-rose-300'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        }`}
                    >
                        🏷️ Liquidate ({counts.liquidate})
                    </button>
                </div>
            )}

            <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
                <table className="w-full min-w-[1200px] border-collapse bg-white">
                    <thead className="bg-gray-100 sticky top-0 z-10 border-b border-gray-200">
                        <tr>
                            {activeHeaders.map(h => (
                                <SortableHeader
                                    key={h.key}
                                    columnKey={h.key}
                                    title={h.title}
                                    sortConfig={sortConfig}
                                    onSort={onSort}
                                    tooltip={h.tooltip}
                                    className={`p-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider ${h.isNumeric ? 'text-right' : 'text-center'}`}
                                />
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
                        {data.length > 0 ? (
                            data.map(item => viewMode === 'replenishment' ? (
                                <ReplenishmentRow 
                                    key={item.sku} 
                                    item={item} 
                                    leadTime={forecastSettings.leadTime || 30} 
                                    safetyStock={forecastSettings.safetyStock || 7} 
                                />
                            ) : (
                                <HealthRow key={item.sku} item={item} isComparisonMode={isComparisonMode} />
                            ))
                        ) : (
                            <tr>
                                <td colSpan={activeHeaders.length} className="text-center py-16 text-gray-500">
                                    <FileIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                                    <div className="font-semibold">No products match your current filters.</div>
                                    <div className="text-xs text-gray-400 mt-1">Try resetting or switching marketplace channel tabs.</div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DataTable;