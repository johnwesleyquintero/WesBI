
import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import type { Filters, ForecastSettings } from '../types';
import { RocketIcon, CompareIcon, ExportIcon, SearchIcon } from './Icons';
import { useAppContext } from '../state/appContext';
import { useFilteredData } from '../hooks/useFilteredData';
import { processFiles } from '../services/snapshotService';
import { exportToCSV } from '../services/exportUtils';

interface ControlButtonProps {
    onClick: () => void;
    children: React.ReactNode;
    className: string;
    disabled?: boolean;
}

const ControlButton: React.FC<ControlButtonProps> = ({ onClick, children, className, disabled = false }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`px-4 py-2.5 rounded-lg font-semibold transition-all duration-300 inline-flex items-center justify-center gap-2 whitespace-nowrap shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
        {children}
    </button>
);

const Controls: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { filters, snapshots, activeSnapshotKey, isComparisonMode, forecastSettings } = state;

    const [searchInput, setSearchInput] = useState(filters.search);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const filteredData = useFilteredData();

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== filters.search) {
                dispatch({ type: 'UPDATE_FILTER', payload: { key: 'search', value: searchInput } });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput, filters.search, dispatch]);

    // Reset local search input when global filters are reset
    useEffect(() => {
        if (filters.search === '') {
            setSearchInput('');
        }
    }, [filters.search]);

    const handleFilterChange = <K extends keyof Filters>(key: K, value: Filters[K]) => {
        if (key === 'search') {
            setSearchInput(value as string);
        } else {
            dispatch({ type: 'UPDATE_FILTER', payload: { key, value } });
        }
    };
    
    const handleForecastSettingChange = <K extends keyof ForecastSettings>(key: K, value: string) => {
        const numValue = parseInt(value) || 0;
        dispatch({ type: 'UPDATE_FORECAST_SETTINGS', payload: { key, value: numValue } });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(e.target.files, snapshots, activeSnapshotKey, dispatch);
        }
    };
    
    const handleExport = useCallback(() => {
        if (filteredData.length === 0) {
            alert("No data to export.");
            return;
        }
        const timestamp = new Date().toISOString().split('T')[0];
        const mode = isComparisonMode ? 'comparison' : 'snapshot';
        exportToCSV(filteredData, `wesbi_export_${mode}_${timestamp}.csv`);
    }, [filteredData, isComparisonMode]);

    const handleSnapshotChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        dispatch({ type: 'SET_ACTIVE_SNAPSHOT', payload: e.target.value });
    };

    const handleCompareClick = () => {
        dispatch({ type: 'OPEN_COMPARISON_MODAL' });
    };

    const activeFilterCount = useMemo(() => {
        return Object.values(filters).filter(Boolean).length;
    }, [filters]);

    const getFilterClass = (isActive: boolean) => {
        const baseClass = 'filter-select transition-colors duration-200';
        return isActive 
            ? `${baseClass} border-[#9c4dff] bg-purple-50/50 ring-1 ring-purple-300` 
            : `${baseClass} border-gray-300`;
    };
    
    return (
        <div className="bg-gray-50 border-b border-gray-200 p-4 md:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <ControlButton 
                    onClick={() => fileInputRef.current?.click()} 
                    className="bg-[#9c4dff] text-white hover:bg-[#7a33ff]"
                >
                    <RocketIcon /> Upload &amp; Process
                </ControlButton>
                 <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    onClick={(e) => { (e.target as HTMLInputElement).value = '' }} // Allow re-selecting same file
                    aria-label="Upload FBA Snapshot CSV files"
                />
                <ControlButton onClick={handleCompareClick} disabled={Object.keys(snapshots).length < 2} className="bg-blue-500 text-white hover:bg-blue-600">
                    <CompareIcon /> Compare...
                </ControlButton>
                <ControlButton onClick={handleExport} disabled={filteredData.length === 0} className="bg-green-500 text-white hover:bg-green-600">
                    <ExportIcon /> Export
                </ControlButton>
                 {Object.keys(snapshots).length > 0 && (
                    <div className="lg:col-span-1">
                        <label htmlFor="snapshot-select" className="sr-only">Active Snapshot</label>
                        <select 
                            id="snapshot-select" 
                            value={activeSnapshotKey || ''} 
                            onChange={handleSnapshotChange}
                            disabled={isComparisonMode}
                            className="w-full h-full px-4 py-2.5 rounded-lg font-semibold transition-all duration-300 shadow-sm border border-gray-300 focus:ring-2 focus:ring-[#9c4dff] focus:outline-none disabled:bg-gray-200 disabled:cursor-not-allowed filter-select"
                        >
                            <option value="" disabled>Select a snapshot</option>
                            {Object.keys(snapshots).sort().map(key => (
                                <option key={key} value={key}>{snapshots[key].name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
            
            <div className="space-y-4 pt-4 border-t border-gray-200">
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><SearchIcon /></span>
                    <input 
                        type="text" 
                        value={searchInput}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        placeholder="Search by SKU, ASIN, or Product Name..."
                        aria-label="Search by SKU, ASIN, or Product Name"
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c4dff] text-sm transition-colors duration-200 ${
                            filters.search ? 'border-[#9c4dff] bg-purple-50/50' : 'border-gray-300'
                        }`}
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                    <select aria-label="Filter by inventory age bracket" value={filters.age} onChange={(e) => handleFilterChange('age', e.target.value)} className={getFilterClass(!!filters.age)}>
                        <option value="">All Age Brackets</option>
                        <option value="0-90">0-90 days</option>
                        <option value="91-180">91-180 days</option>
                        <option value="181-365">181-365 days</option>
                        <option value="365+">365+ days</option>
                    </select>
                    <select aria-label="Filter by recommended action" value={filters.action} onChange={(e) => handleFilterChange('action', e.target.value)} className={getFilterClass(!!filters.action)}>
                        <option value="">All Actions</option>
                        <option value="removal">Recommended Removal</option>
                        <option value="normal">No Action</option>
                    </select>
                     <select aria-label="Filter by stock status" value={filters.stockStatus} onChange={(e) => handleFilterChange('stockStatus', e.target.value)} className={getFilterClass(!!filters.stockStatus)}>
                        <option value="">Stock Status</option>
                        <option value="low">Low Stock</option>
                        <option value="high">High Stock</option>
                        <option value="stranded">Stranded</option>
                    </select>
                    <input aria-label="Minimum stock level" type="number" value={filters.minStock} onChange={(e) => handleFilterChange('minStock', e.target.value)} placeholder="Min Stock" className={getFilterClass(!!filters.minStock)} />
                    <input aria-label="Maximum stock level" type="number" value={filters.maxStock} onChange={(e) => handleFilterChange('maxStock', e.target.value)} placeholder="Max Stock" className={getFilterClass(!!filters.maxStock)} />
                    <button 
                        onClick={() => dispatch({ type: 'RESET_FILTERS' })}
                        disabled={activeFilterCount === 0}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors duration-200 ${
                            activeFilterCount > 0
                                ? 'bg-[#6c34ff] text-white hover:bg-purple-700'
                                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        Reset {activeFilterCount > 0 && `(${activeFilterCount})`}
                    </button>
                </div>
            </div>
            <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-bold text-gray-700 mb-2">Restock Forecast Settings</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="leadTime" className="block text-xs font-medium text-gray-600 mb-1">Supplier Lead Time</label>
                        <div className="relative">
                            <input id="leadTime" aria-label="Supplier Lead Time in days" type="number" value={forecastSettings.leadTime} onChange={(e) => handleForecastSettingChange('leadTime', e.target.value)} placeholder="e.g., 30" className="w-full p-2.5 pl-3 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#9c4dff] text-sm" />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">days</span>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="safetyStock" className="block text-xs font-medium text-gray-600 mb-1">Safety Stock</label>
                        <div className="relative">
                            <input id="safetyStock" aria-label="Safety Stock in days" type="number" value={forecastSettings.safetyStock} onChange={(e) => handleForecastSettingChange('safetyStock', e.target.value)} placeholder="e.g., 14" className="w-full p-2.5 pl-3 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#9c4dff] text-sm" />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">days</span>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="demandForecast" className="block text-xs font-medium text-gray-600 mb-1">Demand Forecast %</label>
                        <div className="relative">
                            <input id="demandForecast" aria-label="Demand Forecast percentage change" type="number" value={forecastSettings.demandForecast} onChange={(e) => handleForecastSettingChange('demandForecast', e.target.value)} placeholder="e.g., 10" className="w-full p-2.5 pl-3 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#9c4dff] text-sm" />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                .filter-select {
                    width: 100%;
                    padding: 0.625rem 0.75rem;
                    border-radius: 0.5rem;
                    background-color: white;
                    font-size: 0.875rem;
                    line-height: 1.25rem;
                    -webkit-appearance: none;
                    -moz-appearance: none;
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
                    background-position: right 0.5rem center;
                    background-repeat: no-repeat;
                    background-size: 1.5em 1.5em;
                }
                .filter-select:focus {
                    outline: none;
                    --tw-ring-color: #9c4dff;
                    --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
                    --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
                    box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
                }
            `}</style>
        </div>
    );
};

export default Controls;
