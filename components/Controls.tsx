import React, { useRef } from 'react';
import type { Filters } from '../types';
import { RocketIcon, CompareIcon, ExportIcon, SearchIcon } from './Icons';

interface ControlsProps {
    onProcessFiles: (files: FileList) => void;
    onCompare: () => void;
    onShowAlerts: () => void;
    onExport: () => void;
    filters: Filters;
    onFilterChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
    onResetFilters: () => void;
    snapshotCount: number;
    exportDataCount: number;
}

const ControlButton: React.FC<{
    onClick: () => void;
    children: React.ReactNode;
    className: string;
    disabled?: boolean;
}> = ({ onClick, children, className, disabled = false }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`px-4 py-2.5 rounded-lg font-semibold transition-all duration-300 inline-flex items-center justify-center gap-2 whitespace-nowrap shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
        {children}
    </button>
);

const Controls: React.FC<ControlsProps> = ({ 
    onProcessFiles, onCompare, onShowAlerts, onExport, 
    filters, onFilterChange, onResetFilters, snapshotCount,
    exportDataCount
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onProcessFiles(e.target.files);
        }
    };
    
    return (
        <div className="bg-gray-50 border-b border-gray-200 p-4 md:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <ControlButton onClick={onCompare} disabled={snapshotCount < 2} className="bg-blue-500 text-white hover:bg-blue-600">
                    <CompareIcon /> Compare
                </ControlButton>
                <ControlButton onClick={onExport} disabled={exportDataCount === 0} className="bg-green-500 text-white hover:bg-green-600">
                    <ExportIcon /> Export
                </ControlButton>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-gray-200">
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><SearchIcon /></span>
                    <input 
                        type="text" 
                        value={filters.search}
                        onChange={(e) => onFilterChange('search', e.target.value)}
                        placeholder="Search by SKU, ASIN, or Product Name..."
                        aria-label="Search by SKU, ASIN, or Product Name"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c4dff] text-sm"
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    <select aria-label="Filter by inventory age bracket" value={filters.age} onChange={(e) => onFilterChange('age', e.target.value)} className="filter-select">
                        <option value="">All Age Brackets</option>
                        <option value="0-90">0-90 days</option>
                        <option value="91-180">91-180 days</option>
                        <option value="181-365">181-365 days</option>
                        <option value="365+">365+ days</option>
                    </select>
                    <select aria-label="Filter by recommended action" value={filters.action} onChange={(e) => onFilterChange('action', e.target.value)} className="filter-select">
                        <option value="">All Actions</option>
                        <option value="removal">Recommended Removal</option>
                        <option value="normal">No Action</option>
                    </select>
                     <select aria-label="Filter by stock status" value={filters.stockStatus} onChange={(e) => onFilterChange('stockStatus', e.target.value)} className="filter-select">
                        <option value="">Stock Status</option>
                        <option value="low">Low Stock</option>
                        <option value="high">High Stock</option>
                        <option value="stranded">Stranded</option>
                    </select>
                    <input aria-label="Minimum stock level" type="number" value={filters.minStock} onChange={(e) => onFilterChange('minStock', e.target.value)} placeholder="Min Stock" className="filter-select" />
                    <button onClick={onResetFilters} className="px-4 py-2 bg-gray-600 text-white hover:bg-gray-700 rounded-lg font-semibold text-sm">Reset</button>
                </div>
            </div>
            <style>{`
                .filter-select {
                    width: 100%;
                    padding: 0.625rem 0.75rem;
                    border: 1px solid #d1d5db;
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
            `}</style>
        </div>
    );
};

export default Controls;
