
import React, { useMemo } from 'react';
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
import { useAppContext } from './state/appContext';
import { useFilteredData } from './hooks/useFilteredData';

const ITEMS_PER_PAGE = 30;

const App: React.FC = () => {
    const { state } = useAppContext();
    const { snapshots, activeSnapshotKey, loadingState, isComparisonMode, insights, currentPage } = state;

    const filteredAndSortedData = useFilteredData();
    
    const activeSnapshot = activeSnapshotKey ? snapshots[activeSnapshotKey] : null;

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
    
    return (
        <div className="p-4 md:p-8">
            <div className="max-w-screen-2xl mx-auto bg-white rounded-2xl shadow-2xl shadow-gray-300/30 overflow-hidden relative">
                <Loader loadingState={loadingState} />
                <Header />
                {isComparisonMode && (
                    <ComparisonView 
                        info={`Comparing latest two snapshots.`}
                    />
                )}
                <Controls />
                
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
                        <DataTable data={paginatedData} />
                        <Pagination totalPages={totalPages} />
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
