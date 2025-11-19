

import * as React from 'react';
import type { Filters, ForecastSettings } from '../types';
import { RocketIcon, CompareIcon, ExportIcon, SearchIcon, SparklesIcon, CloudUploadIcon, CheckCircleIcon, XIcon } from './Icons';
import { useAppContext } from '../state/appContext';
import { useFilteredData } from '../hooks/useFilteredData';
import { processFiles } from '../services/snapshotService';
import { exportToCSV } from '../services/exportUtils';
import { FILE_PROCESSING_THRESHOLDS } from '../constants';

interface ControlButtonProps {
    onClick: () => void;
    children: React.ReactNode;
    className: string;
    disabled?: boolean;
}

// --- New UploadZone Component ---
interface UploadZoneProps {
    title: string;
    description: string;
    onFileSelect: (files: FileList | File) => void;
    selectedFiles: FileList | File | null;
    onClear: () => void;
    multiple: boolean;
}

const UploadZone = React.forwardRef<HTMLInputElement, UploadZoneProps>(
    ({ title, description, onFileSelect, selectedFiles, onClear, multiple }, ref) => {
        const [isDragOver, setIsDragOver] = React.useState(false);
        const inputRef = ref as React.RefObject<HTMLInputElement>;

        const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragOver(true);
        };
        const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragOver(false);
        };
        const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragOver(false);
            const files = e.dataTransfer.files;
            
            // Validate files - filter only for CSVs
            if (files && files.length > 0) {
                const dataTransfer = new DataTransfer();
                let hasInvalidFile = false;
                
                // Fix: Explicitly cast to File[] to avoid 'unknown' type errors during iteration
                (Array.from(files) as File[]).forEach(file => {
                    if (file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.txt')) {
                        dataTransfer.items.add(file);
                    } else {
                        hasInvalidFile = true;
                    }
                });
                
                if (dataTransfer.files.length > 0) {
                    onFileSelect(multiple ? dataTransfer.files : dataTransfer.files[0]);
                    if (hasInvalidFile) {
                        // Optional: You could trigger a toast here if you passed dispatch down, 
                        // but for now we just silently accept the valid ones.
                        console.warn("Skipped non-CSV/TXT files.");
                    }
                }
            }
        };
        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                onFileSelect(multiple ? files : files[0]);
            }
        };
        
        const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                inputRef.current?.click();
            }
        };
        
        const fileNames = React.useMemo(() => {
            if (!selectedFiles) return null;
            if (selectedFiles instanceof File) return selectedFiles.name;
            if (selectedFiles.length > 0) {
                // Fix: Explicitly cast to File[] to ensure 'name' property access is valid
                const names = (Array.from(selectedFiles) as File[]).map(f => f.name);
                if (names.length > 2) {
                    return `${names.slice(0, 2).join(', ')}, and ${names.length - 2} more`;
                }
                return names.join(', ');
            }
            return null;
        }, [selectedFiles]);

        const baseClasses = "relative group flex flex-col items-center justify-center w-full h-full p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9c4dff]";
        const stateClasses = isDragOver 
            ? "border-purple-500 bg-purple-50" 
            : fileNames 
                ? "border-green-500 bg-green-50"
                : "border-gray-300 hover:border-gray-400 hover:bg-gray-50";

        return (
            <div 
                className={`${baseClasses} ${stateClasses}`}
                onClick={() => inputRef.current?.click()}
                onKeyDown={handleKeyDown}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                tabIndex={0}
                role="button"
                aria-label={`${title}: ${description}`}
            >
                <input 
                    ref={ref} 
                    type="file" 
                    accept=".csv,.txt" 
                    multiple={multiple}
                    onClick={(e) => { (e.target as HTMLInputElement).value = '' }}
                    onChange={handleFileChange} 
                    className="hidden"
                />
                {fileNames ? (
                    <>
                        <CheckCircleIcon className="w-8 h-8 text-green-500 mb-2" />
                        <h3 className="font-bold text-gray-800 text-center">{title}</h3>
                        <p className="text-xs text-gray-600 text-center truncate w-full px-2" title={fileNames}>{fileNames}</p>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onClear();
                            }}
                            className="absolute top-2 right-2 p-1 rounded-full bg-white/50 text-gray-500 hover:bg-white hover:text-red-500"
                            aria-label="Clear selection"
                        >
                            <XIcon className="w-4 h-4" />
                        </button>
                    </>
                ) : (
                    <>
                        <CloudUploadIcon className="w-8 h-8 text-gray-400 group-hover:text-gray-500 mb-2" />
                        <h3 className="font-bold text-gray-800 text-center">{title}</h3>
                        <p className="text-xs text-gray-500 text-center">{description}</p>
                    </>
                )}
            </div>
        );
    }
);
UploadZone.displayName = "UploadZone";


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
    const { filters, snapshots, activeSnapshotKey, isComparisonMode, forecastSettings, apiKey, aiFeaturesEnabled } = state;

    const [searchInput, setSearchInput] = React.useState(filters.search);
    const [snapshotFiles, setSnapshotFiles] = React.useState<FileList | null>(null);

    const snapshotInputRef = React.useRef<HTMLInputElement>(null);
    const filteredData = useFilteredData();

    // Debounce search input
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== filters.search) {
                dispatch({ type: 'UPDATE_FILTER', payload: { key: 'search', value: searchInput } });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput, filters.search, dispatch]);

    // Reset local search input when global filters are reset
    React.useEffect(() => {
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

    const handleProcessFiles = async () => {
        if (snapshotFiles && snapshotFiles.length > 0) {
            // --- Pre-flight Check for Large Files ---
            // Fix: Explicitly cast to File[] to ensure 'size' property access is valid and totalSize is a number
            const totalSize = (Array.from(snapshotFiles) as File[]).reduce((sum, file) => sum + file.size, 0);
            const maxSizeInBytes = FILE_PROCESSING_THRESHOLDS.MAX_FILE_SIZE_MB * 1024 * 1024;

            if (totalSize > maxSizeInBytes) {
                dispatch({
                    type: 'ADD_TOAST',
                    payload: {
                        type: 'info',
                        title: 'Processing Large Files',
                        message: `Your upload is larger than ${FILE_PROCESSING_THRESHOLDS.MAX_FILE_SIZE_MB}MB. Processing may take a moment and the app might be unresponsive.`,
                    },
                });
            }

            await processFiles(snapshotFiles, snapshots, activeSnapshotKey, { apiKey, aiFeaturesEnabled }, dispatch);
            // Reset file inputs after processing is complete
            setSnapshotFiles(null);
            if(snapshotInputRef.current) snapshotInputRef.current.value = '';
        }
    };
    
    const handleExport = React.useCallback(() => {
        if (filteredData.length === 0) {
            dispatch({ type: 'ADD_TOAST', payload: {
                type: 'info',
                title: 'No Data to Export',
                message: 'There are no products matching your current filters.'
            }});
            return;
        }
        const timestamp = new Date().toISOString().split('T')[0];
        const mode = isComparisonMode ? 'comparison' : 'snapshot';
        exportToCSV(filteredData, `wesbi_export_${mode}_${timestamp}.csv`);
        dispatch({ type: 'ADD_TOAST', payload: {
            type: 'success',
            title: 'Export Successful',
            message: `${filteredData.length} rows have been exported to CSV.`
        }});
    }, [filteredData, isComparisonMode, dispatch]);

    const handleSnapshotChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        dispatch({ type: 'SET_ACTIVE_SNAPSHOT', payload: e.target.value });
    };

    const handleCompareClick = () => {
        dispatch({ type: 'OPEN_COMPARISON_MODAL' });
    };
    
    const handleStrategyClick = () => {
        dispatch({ type: 'OPEN_STRATEGY_MODAL' });
    };

    const activeFilterCount = React.useMemo(() => {
        return Object.values(filters).filter(Boolean).length;
    }, [filters]);

    const activeSnapshot = activeSnapshotKey ? snapshots[activeSnapshotKey] : null;

    const uniqueCategories = React.useMemo(() => {
        if (!activeSnapshot) return [];
        const categories = new Set(activeSnapshot.data.map(item => item.category));
        return Array.from(categories).filter(Boolean).sort();
    }, [activeSnapshot]);

    const getFilterClass = (isActive: boolean) => {
        const baseClass = 'filter-select transition-colors duration-200';
        return isActive 
            ? `${baseClass} border-[#9c4dff] bg-purple-50/50 ring-1 ring-purple-300` 
            : `${baseClass} border-gray-300`;
    };
    
    return (
        <div className="bg-gray-50 border-b border-gray-200 p-4 md:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                 {/* File Upload Section */}
                 <div className="lg:col-span-1">
                     <UploadZone
                        ref={snapshotInputRef}
                        title="Data Upload"
                        description="Drop FBA Snapshots & Manage FBA Inventory files"
                        onFileSelect={(files) => setSnapshotFiles(files as FileList)}
                        selectedFiles={snapshotFiles}
                        onClear={() => { 
                            setSnapshotFiles(null);
                            if (snapshotInputRef.current) snapshotInputRef.current.value = '';
                         }}
                        multiple={true}
                     />
                 </div>
                 <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <ControlButton 
                        onClick={handleProcessFiles} 
                        disabled={!snapshotFiles || snapshotFiles.length === 0}
                        className="bg-[#9c4dff] text-white hover:bg-[#7a33ff] sm:col-span-2 lg:col-span-1"
                    >
                        <RocketIcon /> Process Files
                    </ControlButton>
                    <ControlButton onClick={handleStrategyClick} disabled={!activeSnapshotKey || !aiFeaturesEnabled} className="bg-teal-500 text-white hover:bg-teal-600">
                        <SparklesIcon /> AI Strategy
                    </ControlButton>
                    <ControlButton onClick={handleCompareClick} disabled={Object.keys(snapshots).length < 2} className="bg-blue-500 text-white hover:bg-blue-600">
                        <CompareIcon /> Compare...
                    </ControlButton>
                    <ControlButton onClick={handleExport} disabled={filteredData.length === 0} className="bg-green-500 text-white hover:bg-green-600">
                        <ExportIcon /> Export
                    </ControlButton>
                </div>
            </div>
            {Object.keys(snapshots).length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                    <label htmlFor="snapshot-select" className="text-sm font-semibold text-gray-700 mr-3">Active Snapshot:</label>
                    <select 
                        id="snapshot-select" 
                        value={activeSnapshotKey || ''} 
                        onChange={handleSnapshotChange}
                        disabled={isComparisonMode}
                        className="px-4 py-2 rounded-lg font-semibold transition-all duration-300 shadow-sm border border-gray-300 focus:ring-2 focus:ring-[#9c4dff] focus:outline-none disabled:bg-gray-200 disabled:cursor-not-allowed filter-select"
                    >
                        <option value="" disabled>Select a snapshot</option>
                        {Object.keys(snapshots).sort().map(key => (
                            <option key={key} value={key}>{snapshots[key].name}</option>
                        ))}
                    </select>
                </div>
            )}
            
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
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
                    <select aria-label="Filter by category" value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)} className={getFilterClass(!!filters.category)}>
                        <option value="">All Categories</option>
                        {uniqueCategories.map(cat => (
                           <option key={cat} value={cat}>{cat}</option>
                        ))}
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
        </div>
    );
};

export default Controls;