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
import { parseCSV } from './services/csvParser';
import { calculateStats, compareSnapshots } from './services/dataProcessor';
import { getInsightsFromGemini } from './services/geminiService';
import { ITEMS_PER_PAGE } from './constants';

import type { ProductData, Stats, Snapshot, LoadingState, Filters, SortConfig } from './types';

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
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'riskScore', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState<number>(1);

    const activeSnapshot = activeSnapshotKey ? snapshots[activeSnapshotKey] : null;

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
        
        let filtered = data.filter(item => {
            const searchLower = filters.search.toLowerCase();
            const matchesSearch = !filters.search || 
                item.sku.toLowerCase().includes(searchLower) ||
                item.asin.toLowerCase().includes(searchLower) ||
                item.name.toLowerCase().includes(searchLower);

            const matchesAction = !filters.action || 
                (filters.action === 'removal' && item.recommendedAction.toLowerCase().includes('removal')) ||
                (filters.action === 'normal' && !item.recommendedAction.toLowerCase().includes('removal'));
            
            let matchesAge = true;
            if (filters.age) {
                switch(filters.age) {
                    case '0-90': matchesAge = item.totalInvAgeDays <= 90; break;
                    case '91-180': matchesAge = item.totalInvAgeDays > 90 && item.totalInvAgeDays <= 180; break;
                    case '181-365': matchesAge = item.totalInvAgeDays > 180 && item.totalInvAgeDays <= 365; break;
                    case '365+': matchesAge = item.totalInvAgeDays > 365; break;
                }
            }

            let matchesStockStatus = true;
            if (filters.stockStatus) {
                switch(filters.stockStatus) {
                case 'low': matchesStockStatus = item.available < 10 && item.shippedT30 > 0; break;
                case 'high': matchesStockStatus = item.available > 100 && item.shippedT30 < 5; break;
                case 'stranded': matchesStockStatus = item.available > 10 && item.shippedT30 === 0; break;
                }
            }

            const matchesMinStock = !filters.minStock || item.available >= parseInt(filters.minStock);
            
            return matchesSearch && matchesAction && matchesAge && matchesStockStatus && matchesMinStock;
        });

        if (sortConfig.key) {
            filtered.sort((a, b) => {
                const aVal = a[sortConfig.key!];
                const bVal = b[sortConfig.key!];
                if (aVal === undefined || bVal === undefined) return 0;
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        
        return filtered;

    }, [activeSnapshot, isComparisonMode, snapshots, filters, sortConfig]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filters, activeSnapshotKey, isComparisonMode]);

    const handleFilterChange = useCallback(<K extends keyof Filters,>(key: K, value: Filters[K]) => {
        setFilters(prev => ({...prev, [key]: value}));
    }, []);

    const handleResetFilters = useCallback(() => {
        setFilters({ search: '', condition: '', action: '', age: '', category: '', minStock: '', maxStock: '', stockStatus: '' });
    }, []);

    const handleSort = useCallback((key: keyof ProductData) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    }, []);
    
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
                    onExport={() => alert('Export functionality to be implemented.')}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onResetFilters={handleResetFilters}
                    snapshotCount={snapshotKeys.length}
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

                <DataTable data={paginatedData} sortConfig={sortConfig} onSort={handleSort} isComparisonMode={isComparisonMode} />
                
                {filteredAndSortedData.length === 0 && !activeSnapshot && (
                     <div className="text-center py-20 text-gray-500 bg-gray-50">
                        <div className="text-4xl mb-4">📊</div>
                        <h2 className="text-xl font-semibold">Welcome to WesBI</h2>
                        <p className="mt-2">Upload one or more FBA Snapshot CSV files to get started.</p>
                    </div>
                )}
                
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
        </div>
    );
};

export default App;