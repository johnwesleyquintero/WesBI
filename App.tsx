import React, { useMemo, useState, useEffect } from 'react';
import Header from './components/Header';
import Controls from './components/Controls';
import StatCard from './components/StatCard';
import { AgeDistributionChart, RiskChart, PerformanceChart } from './components/Charts';
import DataTable from './components/DataTable';
import Pagination from './components/Pagination';
import Loader, { StatCardSkeleton, ChartsSkeleton, DataTableSkeleton } from './components/Loader';
import ComparisonView from './components/ComparisonView';
import ComparisonModal from './components/ComparisonModal';
import HelpModal from './components/HelpModal';
import SettingsModal from './components/SettingsModal';
import StrategyModal from './components/StrategyModal';
import MissionControl from './components/MissionControl';
import InsightsPanel from './components/InsightsPanel';
import ErrorBoundary from './components/ErrorBoundary';
import ToastContainer from './components/ToastContainer';
import { useAppContext } from './state/appContext';
import { useFilteredData } from './hooks/useFilteredData';

const App: React.FC = () => {
    const { state } = useAppContext();
    const { snapshots, activeSnapshotKey, loadingState, isComparisonMode, insights, currentPage, isComparisonModalOpen, isHelpModalOpen, isSettingsModalOpen, isStrategyModalOpen, comparisonSnapshotKeys, itemsPerPage, aiFeaturesEnabled, activeMissionId } = state;

    // State to track if the Recharts script has been loaded.
    const [rechartsReady, setRechartsReady] = useState(!!window.Recharts);

    useEffect(() => {
        // If Recharts is not on the window object, load it dynamically.
        // This prevents race conditions between React (ESM) and Recharts (UMD).
        if (!window.Recharts) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/recharts@2.12.7/umd/Recharts.min.js';
            script.async = true;
            script.onload = () => {
                setRechartsReady(true);
            };
            script.onerror = () => {
                console.error('Failed to load the Recharts library. Charts will not be available.');
            };
            document.body.appendChild(script);

            // Clean up the script tag if the component unmounts.
            return () => {
                // Check if the script is still in the body before trying to remove
                if (script.parentNode) {
                    document.body.removeChild(script);
                }
            };
        }
    }, []); // Empty dependency array ensures this runs only once.

    const filteredAndSortedData = useFilteredData();
    
    const activeSnapshot = activeSnapshotKey ? snapshots[activeSnapshotKey] : null;

    const showSkeleton = loadingState.isLoading || !activeSnapshot;

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredAndSortedData.slice(start, start + itemsPerPage);
    }, [filteredAndSortedData, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);

    const comparisonInfo = useMemo(() => {
        if (isComparisonMode && comparisonSnapshotKeys.base && comparisonSnapshotKeys.compare) {
            const baseName = snapshots[comparisonSnapshotKeys.base]?.name ?? '...';
            const compareName = snapshots[comparisonSnapshotKeys.compare]?.name ?? '...';
            return `Comparing "${baseName}" with "${compareName}"`;
        }
        return 'Comparing snapshots.'; // Fallback
    }, [isComparisonMode, comparisonSnapshotKeys, snapshots]);

    const displayedStats = useMemo(() => {
        if (isComparisonMode && comparisonSnapshotKeys.base && comparisonSnapshotKeys.compare) {
             const oldSnap = snapshots[comparisonSnapshotKeys.base];
             const newSnap = snapshots[comparisonSnapshotKeys.compare];
             if (oldSnap && newSnap) {
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
    }, [activeSnapshot, isComparisonMode, snapshots, comparisonSnapshotKeys]);
    
    return (
        <div className="p-4 md:p-8">
            <div className="max-w-screen-2xl mx-auto bg-white rounded-2xl shadow-2xl shadow-gray-300/30 overflow-hidden relative">
                <ToastContainer />
                <Loader loadingState={loadingState} />
                {isComparisonModalOpen && <ComparisonModal />}
                {isHelpModalOpen && <HelpModal />}
                {isSettingsModalOpen && <SettingsModal />}
                {isStrategyModalOpen && <StrategyModal />}
                <Header />
                {isComparisonMode && (
                    <ComparisonView info={comparisonInfo} />
                )}
                <ErrorBoundary>
                    <Controls />
                </ErrorBoundary>
                
                {/* Don't show insights panel during skeleton load, and only if enabled */}
                {!showSkeleton && aiFeaturesEnabled && (
                    <ErrorBoundary>
                        <InsightsPanel insights={insights} />
                    </ErrorBoundary>
                )}

                {showSkeleton ? (
                    <>
                        {/* Stat Cards Skeleton */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4 md:p-6 bg-gray-50 border-b border-gray-200">
                           {Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)}
                        </div>
                        {/* Charts Skeleton */}
                        <ChartsSkeleton />
                        {/* Data Table Skeleton with conditional welcome message */}
                        <DataTableSkeleton isInitialState={!loadingState.isLoading && !activeSnapshot} />
                    </>
                ) : (
                    <>
                        {/* Real Stat Cards */}
                        {displayedStats && (
                            <ErrorBoundary>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4 md:p-6 bg-gray-50 border-b border-gray-200">
                                    <StatCard label="Total Products" value={displayedStats.current.totalProducts.toLocaleString()} change={displayedStats.change.totalProducts} />
                                    <StatCard label="Available Inventory" value={displayedStats.current.totalAvailable.toLocaleString()} change={displayedStats.change.totalAvailable} />
                                    <StatCard label="Pending Removals" value={displayedStats.current.totalPending.toLocaleString()} change={displayedStats.change.totalPending} />
                                    <StatCard label="Sell-Through" value={`${displayedStats.current.sellThroughRate}%`} change={displayedStats.change.sellThroughRate} isPercentage={true} />
                                    <StatCard label="Avg Days in Inv." value={displayedStats.current.avgDaysInventory.toString()} change={displayedStats.change.avgDaysInventory} />
                                    <StatCard label="At-Risk SKUs" value={displayedStats.current.atRiskSKUs.toLocaleString()} change={displayedStats.change.atRiskSKUs} />
                                </div>
                            </ErrorBoundary>
                        )}
                        
                        {/* Mission Control Panel */}
                        {activeMissionId && (
                            <ErrorBoundary>
                                <MissionControl />
                            </ErrorBoundary>
                        )}

                        {/* Real Charts */}
                        {activeSnapshot && !isComparisonMode && (
                            <ErrorBoundary>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 md:p-6 bg-gray-50 border-b border-gray-200">
                                    <AgeDistributionChart data={activeSnapshot.data} />
                                    <RiskChart data={activeSnapshot.data} />
                                    <PerformanceChart data={activeSnapshot.data} />
                                </div>
                            </ErrorBoundary>
                        )}

                        {/* Real Data Table and Pagination */}
                        <ErrorBoundary>
                            <DataTable data={paginatedData} />
                            {totalPages > 1 && <Pagination totalPages={totalPages} />}
                        </ErrorBoundary>
                    </>
                )}
            </div>
        </div>
    );
};

export default App;