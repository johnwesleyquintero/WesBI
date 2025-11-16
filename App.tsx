import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Header from './components/Header';
import Controls from './components/Controls';
import StatCard from './components/StatCard';
import { AgeDistributionChart, RiskChart, PerformanceChart } from './components/Charts';
import DataTable from './components/DataTable';
import Pagination from './components/Pagination';
import Loader from './components/Loader';
import ComparisonView from './components/ComparisonView';
import InsightsPanel from './components/InsightsPanel';
import { BarChartIcon } from './components/Icons';
import { parseCSV } from './services/csvParser';
import { calculateStats, compareSnapshots } from './services/dataProcessor';
import { getInsightsFromGemini } from './services/geminiService';
import { exportToCSV } from './services/exportUtils';
import { 
    applySearchFilter, 
    applyActionFilter, 
    applyAgeFilter, 
    applyStockStatusFilter, 
    applyMinStockFilter 
} from './services/filterUtils';

import type { ProductData, Stats, Snapshot, LoadingState, Filters, SortConfig } from './types';

const ITEMS_PER_PAGE = 30;

const App: React.FC = () => {
    const [snapshots, setSnapshots] = useState<Record<string, Snapshot>>({});
    const [activeSnapshotKey, setActiveSnapshotKey] = useState<string | null>(null);
    const [loadingState, setLoadingState] = useState<LoadingState>({ isLoading: false, message: '', progress: 0 });
    const [isComparisonMode, setComparisonMode] = useState<boolean>(false);
    const [insights, setInsights] = useState<string[]>([]);

    const [filters, setFilters] = useState<Filters>({
        search: '', condition: '', action: '', age: '', category: '', 
        minStock: '', maxStock: '', stockStatus: ''
    });
    // State for immediate search input, to be debounced before applying to `filters`
    const [searchInput, setSearchInput] = useState<string>('');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'riskScore', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState<number>(1);

    const activeSnapshot = activeSnapshotKey ? snapshots[activeSnapshotKey] : null;

    // Debounce effect for search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setFilters(prev => ({
                ...prev,
                search: searchInput,
            }));
        }, 300); // 300ms delay

        return () => {
            clearTimeout(timer);
        };
    }, [searchInput]);

    const handleProcessFiles = useCallback(async (files: FileList) => {
        if (files.length === 0) return;
        setLoadingState({ isLoading: true, message: 'Processing your FBA snapshots...', progress: 0 });
        setInsights([]);
        
        const newSnapshots: Record<string, Snapshot> = {};
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileName = file.name.replace('.csv', '');
                setLoadingState(prev => ({ ...prev, message: `Processing ${file.name}...`, progress: Math.round(((i + 1) / files.length) * 90) }));
                
                const data = await parseCSV(file);
                const stats = calculateStats(data);
                newSnapshots[fileName] = { name: fileName, data, stats, timestamp: new Date().toISOString() };
            }

            const allSnapshots = { ...snapshots, ...newSnapshots };
            setSnapshots(allSnapshots);
            const latestSnapshotKey = Object.keys(newSnapshots).sort().pop() || activeSnapshotKey;
            setActiveSnapshotKey(latestSnapshotKey);

            if (latestSnapshotKey) {
                setLoadingState(prev => ({ ...prev, message: 'Generating AI Insights...', progress: 95 }));
                const newInsights = await getInsightsFromGemini(allSnapshots[latestSnapshotKey].data);
                setInsights(newInsights);
            }
        } catch (error) {
            console.error(error);
            alert(`Error processing files: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoadingState({ isLoading: false, message: '', progress: 0 });
        }
    }, [snapshots, activeSnapshotKey]);
    
    const filteredAndSortedData = useMemo(() => {
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
        
        // Refactored filtering pipeline
        let filtered = data;
        filtered = applySearchFilter(filtered, filters.search);
        filtered = applyActionFilter(filtered, filters.action);
        filtered = applyAgeFilter(filtered, filters.age);
        filtered = applyStockStatusFilter(filtered, filters.stockStatus);
        filtered = applyMinStockFilter(filtered, filters.minStock);

        if (sortConfig.key) {
            // Create a new sorted array to avoid mutation
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

    useEffect(() => {
        setCurrentPage(1);
    }, [filters, activeSnapshotKey, isComparisonMode]);

    const handleFilterChange = useCallback(<K extends keyof Filters,>(key: K, value: Filters[K]) => {
        if (key === 'search') {
            setSearchInput(value as string);
        } else {
            setFilters(prev => ({...prev, [key]: value}));
        }
    }, []);

    const handleResetFilters = useCallback(() => {
        setFilters({ search: '', condition: '', action: '', age: '', category: '', minStock: '', maxStock: '', stockStatus: '' });
        setSearchInput('');
    }, []);

    const handleSort = useCallback((key: keyof ProductData) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    }, []);

    const handleExport = useCallback(() => {
        if (filteredAndSortedData.length === 0) {
            alert("No data to export.");
            return;
        }
        const timestamp = new Date().toISOString().split('T')[0];
        const mode = isComparisonMode ? 'comparison' : 'snapshot';
        exportToCSV(filteredAndSortedData, `wesbi_export_${mode}_${timestamp}.csv`);
    }, [filteredAndSortedData, isComparisonMode]);
    
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredAndSortedData.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredAndSortedData, currentPage]);

    const totalPages = Math.ceil(filteredAndSortedData.length / ITEMS_PER_PAGE);

    const displayedStats = useMemo(() => {
        if (isComparisonMode) {
             const keys = Object.keys(snapshots).sort();
             if (keys.length >= 2) {
                 const newSnap = snapshots[keys[keys.length-1]];
                 const oldSnap = snapshots[keys[keys.length-2]];
                 return {
                    current: newSnap.stats,
                    change: {
                        totalProducts: newSnap.stats.totalProducts - oldSnap.stats.totalProducts,
                        totalAvailable: newSnap.stats.totalAvailable - oldSnap.stats.totalAvailable,
                        atRiskSKUs: newSnap.stats.atRiskSKUs - oldSnap.stats.atRiskSKUs,
                        avgDaysInventory: newSnap.stats.avgDaysInventory - oldSnap.stats.avgDaysInventory,
                        sellThroughRate: newSnap.stats.sellThroughRate - oldSnap.stats.sellThroughRate,
                        totalPending: newSnap.stats.totalPending - oldSnap.stats.totalPending,
                    }
                 };
             }
        }
        return activeSnapshot ? { current: activeSnapshot.stats, change: { totalProducts: 0, totalAvailable: 0, atRiskSKUs: 0, avgDaysInventory: 0, sellThroughRate: 0, totalPending: 0 } } : null;
    }, [activeSnapshot, isComparisonMode, snapshots]);
    
    const snapshotKeys = Object.keys(snapshots);

    return (
        <div className="p-4 md:p-8">
            <div className="max-w-screen-2xl mx-auto bg-white rounded-2xl shadow-2xl shadow-gray-300/30 overflow-hidden relative">
                <Loader loadingState={loadingState} />
                <Header />
                {isComparisonMode && (
                    <ComparisonView 
                        onExit={() => setComparisonMode(false)}
                        info={`Comparing latest two snapshots.`}
                    />
                )}
                <Controls 
                    onProcessFiles={handleProcessFiles} 
                    onCompare={() => setComparisonMode(true)}
                    onShowAlerts={() => alert('Alerts are shown in the Insights panel.')}
                    onExport={handleExport}
                    filters={{...filters, search: searchInput}}
                    onFilterChange={handleFilterChange}
                    onResetFilters={handleResetFilters}
                    snapshotCount={snapshotKeys.length}
                    exportDataCount={filteredAndSortedData.length}
                />
                
                <InsightsPanel insights={insights} />

                {displayedStats && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4 md:p-6 bg-gray-50 border-b border-gray-200">
                        <StatCard label="Total Products" value={displayedStats.current.totalProducts.toLocaleString()} change={displayedStats.change.totalProducts} />
                        <StatCard label="Available Inventory" value={displayedStats.current.totalAvailable.toLocaleString()} change={displayedStats.change.totalAvailable} />
                        <StatCard label="Pending Removals" value={displayedStats.current.totalPending.toLocaleString()} change={displayedStats.change.totalPending} />
                        <StatCard label="Sell-Through" value={`${displayedStats.current.sellThroughRate}%`} change={displayedStats.change.sellThroughRate} isPercentage={true} />
                        <StatCard label="Avg Days in Inv." value={displayedStats.current.avgDaysInventory.toString()} change={displayedStats.change.avgDaysInventory} />
                        <StatCard label="At-Risk SKUs" value={displayedStats.current.atRiskSKUs.toLocaleString()} change={displayedStats.change.atRiskSKUs} />
                    </div>
                )}
                
                {activeSnapshot && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 md:p-6 bg-gray-50 border-b border-gray-200">
                        <AgeDistributionChart data={activeSnapshot.data} />
                        <RiskChart data={activeSnapshot.data} />
                        <PerformanceChart data={activeSnapshot.data} />
                    </div>
                )}

                {activeSnapshot ? (
                    <>
                        <DataTable data={paginatedData} sortConfig={sortConfig} onSort={handleSort} isComparisonMode={isComparisonMode} />
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </>
                ) : (
                     <div className="text-center py-20 text-gray-500 bg-gray-50">
                        <BarChartIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <h2 className="text-xl font-semibold">Welcome to WesBI</h2>
                        <p className="mt-2">Upload one or more FBA Snapshot CSV files to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
