
import * as React from 'react';
import type { LoadingState } from '../types';
import { BarChartIcon } from './Icons';

// --- Reusable Skeleton Placeholder ---
const SkeletonPlaceholder: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <div className={`bg-gray-200 rounded animate-pulse ${className}`}></div>
    );
};

// --- Stat Card Skeleton ---
export const StatCardSkeleton: React.FC = () => {
    return (
        <div className="bg-white rounded-xl p-5 shadow-md border-l-4 border-gray-200 flex flex-col justify-between min-h-[140px]">
            <div>
                <SkeletonPlaceholder className="h-4 w-3/4 mb-2" />
                <SkeletonPlaceholder className="h-8 w-1/2" />
            </div>
            <div className="mt-2">
                <SkeletonPlaceholder className="h-6 w-1/4" />
            </div>
        </div>
    );
};

// --- Charts Skeletons ---
const ChartSkeleton: React.FC = () => (
    <div className="bg-white rounded-xl p-4 shadow-md">
        <SkeletonPlaceholder className="h-5 w-1/3 mb-4" />
        <div className="h-[220px]">
             <SkeletonPlaceholder className="h-full w-full" />
        </div>
    </div>
);

export const ChartsSkeleton: React.FC = () => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 md:p-6 bg-gray-50 border-b border-gray-200">
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
        </div>
    );
};

// --- Data Table Skeleton ---
export const DataTableSkeleton: React.FC<{ isInitialState: boolean }> = ({ isInitialState }) => {
    const headers = ['SKU', 'ASIN', 'Product Name', 'Condition', 'Available', 'Pending Removal', 'Avg Inv Age', 'Shipped T30', 'Sell-Through', 'Action', 'Risk Score', 'Restock Units'];
    const numericIndexes = [4, 5, 6, 7, 8, 10, 11];
    const rowCount = 10;

    const renderSkeletonRow = (key: number) => (
        <tr key={key}>
            <td className="p-3"><SkeletonPlaceholder className="h-5 w-20" /></td>
            <td className="p-3"><SkeletonPlaceholder className="h-5 w-16" /></td>
            <td className="p-3"><SkeletonPlaceholder className="h-5 w-48" /></td>
            <td className="p-3"><SkeletonPlaceholder className="h-5 w-12" /></td>
            <td className="p-3 text-right"><SkeletonPlaceholder className="h-5 w-10 ml-auto" /></td>
            <td className="p-3 text-right"><SkeletonPlaceholder className="h-5 w-10 ml-auto" /></td>
            <td className="p-3 text-right"><SkeletonPlaceholder className="h-5 w-10 ml-auto" /></td>
            <td className="p-3 text-right"><SkeletonPlaceholder className="h-5 w-10 ml-auto" /></td>
            <td className="p-3 text-right"><SkeletonPlaceholder className="h-5 w-10 ml-auto" /></td>
            <td className="p-3"><SkeletonPlaceholder className="h-5 w-24" /></td>
            <td className="p-3 text-right"><SkeletonPlaceholder className="h-5 w-10 ml-auto" /></td>
            <td className="p-3 text-right"><SkeletonPlaceholder className="h-5 w-12 ml-auto" /></td>
        </tr>
    );

    return (
        <div className="p-4 md:p-6 overflow-x-auto relative">
             {isInitialState && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/80 backdrop-blur-sm z-20">
                    <BarChartIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h2 className="text-xl font-semibold text-gray-600">Welcome to WesBI</h2>
                    <p className="mt-2 text-gray-500">Upload one or more FBA Snapshot CSV files to get started.</p>
                 </div>
             )}
            <table className="w-full min-w-[1200px] border-collapse">
                <thead className="bg-gray-100">
                    <tr>
                        {headers.map((h, i) => (
                           <th key={h} className={`p-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider ${numericIndexes.includes(i) ? 'text-right' : ''}`}>
                               {h}
                           </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {Array.from({ length: rowCount }).map((_, i) => renderSkeletonRow(i))}
                </tbody>
            </table>
        </div>
    );
};


// --- Main Loader for Progress Indication ---
interface LoaderProps {
    loadingState: LoadingState;
}

const Loader: React.FC<LoaderProps> = ({ loadingState }) => {
    // Only show this modal during the file processing stage, identified by a message being present.
    if (!loadingState.isLoading || !loadingState.message) return null;

    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 shadow-2xl rounded-xl p-8 z-50 backdrop-blur-md w-full max-w-sm">
            <div className="text-center">
                <div className="text-lg font-semibold text-[#9c4dff] mb-4">{loadingState.message}</div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                        className="bg-[#9c4dff] h-2.5 rounded-full transition-all duration-300" 
                        style={{ width: `${loadingState.progress}%` }}
                    ></div>
                </div>
                <div className="mt-2 text-base font-bold text-[#7a33ff]">{loadingState.progress}%</div>
            </div>
        </div>
    );
};

export default Loader;