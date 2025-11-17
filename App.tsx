



import * as React from 'react';
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
import AlertCenter from './components/AlertCenter';
import ErrorBoundary from './components/ErrorBoundary';
import ToastContainer from './components/ToastContainer';
import Chatbot from './components/Chatbot';
import { ChatbotIcon } from './components/Icons';
import { useAppContext } from './state/appContext';
import { useFilteredData } from './hooks/useFilteredData';

const App: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { snapshots, activeSnapshotKey, loadingState, isComparisonMode, insights, currentPage, isComparisonModalOpen, isHelpModalOpen, isSettingsModalOpen, isStrategyModalOpen, isChatbotOpen, comparisonSnapshotKeys, itemsPerPage, aiFeaturesEnabled, activeMissionId } = state;

    // State to track if the Recharts script has been loaded.
    const [rechartsReady, setRechartsReady] = React.useState(!!window.Recharts);

    React.useEffect(() => {
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

    const paginatedData = React.useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredAndSortedData.slice(start, start + itemsPerPage);
    }, [filteredAndSortedData, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);

    const comparisonInfo = React.useMemo(() => {
        if (isComparisonMode && comparisonSnapshotKeys.base && comparisonSnapshotKeys.compare) {
            const baseName = snapshots[comparisonSnapshotKeys.base]?.name ?? '...';
            const compareName = snapshots[comparisonSnapshotKeys.compare]?.name ?? '...';
            return `Comparing "${baseName}" with "${compareName}"`;
        }
        return 'Comparing snapshots.'; // Fallback
    }, [isComparisonMode, comparisonSnapshotKeys, snapshots]);

    const displayedStats = React.useMemo(() => {
        const defaultChange = { totalProducts: 0, totalAvailable: 0, atRiskSKUs: 0, avgDaysInventory: 0, sellThroughRate: 0, totalPending: 0, totalShipped: 0 };
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
                        totalShipped: newSnap.stats.totalShipped - oldSnap.stats.totalShipped,
                    }
                 };
             }
        }
        return activeSnapshot ? { current: activeSnapshot.stats, change: defaultChange } : null;
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
                                    <StatCard label="Total SKUs" value={displayedStats.current.totalProducts.toLocaleString()} change={displayedStats.change.totalProducts} />
                                    <StatCard label="Available Inventory" value={displayedStats.current.totalAvailable.toLocaleString()} change={displayedStats.change.totalAvailable} />
                                    <StatCard label="Pending Removal" value={displayedStats.current.totalPending.toLocaleString()} change={displayedStats.change.totalPending} />
                                    <StatCard label="Sell-Through" value={`${displayedStats.current.sellThroughRate}%`} change={displayedStats.change.sellThroughRate} isPercentage={true} />
                                    <StatCard label="Avg. Inv. Age" value={`${displayedStats.current.avgDaysInventory}d`} change={displayedStats.change.avgDaysInventory} />
                                    <StatCard label="At-Risk SKUs" value={displayedStats.current.atRiskSKUs.toLocaleString()} change={displayedStats.change.atRiskSKUs} />
                                </div>
                            </ErrorBoundary>
                        )}

                        {/* NEW: Proactive Alert Center */}
                        <ErrorBoundary>
                            <AlertCenter data={filteredAndSortedData} isComparisonMode={isComparisonMode} />
                        </ErrorBoundary>
                        
                        {/* AI Insights Panel */}
                        {aiFeaturesEnabled && (
                            <ErrorBoundary>
                                <InsightsPanel insights={insights} />
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
                                {rechartsReady ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 md:p-6 bg-gray-50 border-b border-gray-200">
                                        <AgeDistributionChart data={activeSnapshot.data} />
                                        <RiskChart data={activeSnapshot.data} />
                                        <PerformanceChart data={activeSnapshot.data} />
                                    </div>
                                ) : (
                                    <ChartsSkeleton />
                                )}
                            </ErrorBoundary>
                        )}

                        {/* Real Data Table and Pagination */}
                        <ErrorBoundary>
                            <DataTable data={paginatedData} />
                            {totalPages > 1 && <Pagination totalPages={totalPages} />}
                        </ErrorBoundary>
                    </>
                )}

                <footer className="text-center p-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
                    Crafted by Wes. Explore more mini-apps at{' '}
                    <a 
                        href="https://wescode.vercel.app/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-semibold text-[#6c34ff] hover:underline"
                    >
                        wescode.vercel.app
                    </a>.
                </footer>
            </div>
            {/* Chatbot and FAB */}
            {aiFeaturesEnabled && (
                <>
                    <button
                        onClick={() => dispatch({ type: 'TOGGLE_CHATBOT' })}
                        className="fixed bottom-8 right-8 bg-gradient-to-br from-[#9c4dff] to-[#6c34ff] text-white p-4 rounded-full shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9c4dff] transition-all duration-300 z-40 transform hover:scale-110"
                        aria-label="Toggle chatbot"
                        title="Open WesBI Chat"
                    >
                        <ChatbotIcon className="w-8 h-8" />
                    </button>
                    {isChatbotOpen && <Chatbot />}
                </>
            )}
        </div>
    );
};

export default App;