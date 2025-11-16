import type { ProductData, Snapshot, LoadingState, Filters, SortConfig, ForecastSettings } from '../types';

export interface AppState {
    snapshots: Record<string, Snapshot>;
    activeSnapshotKey: string | null;
    loadingState: LoadingState;
    isComparisonMode: boolean;
    isComparisonModalOpen: boolean;
    isHelpModalOpen: boolean;
    comparisonSnapshotKeys: { base: string | null; compare: string | null };
    insights: string[];
    filters: Filters;
    forecastSettings: ForecastSettings;
    sortConfig: SortConfig;
    currentPage: number;
    itemsPerPage: number;
}

export const initialState: AppState = {
    snapshots: {},
    activeSnapshotKey: null,
    loadingState: { isLoading: false, message: '', progress: 0 },
    isComparisonMode: false,
    isComparisonModalOpen: false,
    isHelpModalOpen: false,
    comparisonSnapshotKeys: { base: null, compare: null },
    insights: [],
    filters: {
        search: '', condition: '', action: '', age: '', category: '',
        minStock: '', maxStock: '', stockStatus: ''
    },
    forecastSettings: {
        leadTime: 30,
        safetyStock: 14,
        demandForecast: 0,
    },
    sortConfig: { key: 'riskScore', direction: 'desc' },
    currentPage: 1,
    itemsPerPage: 30,
};

export type Action =
    | { type: 'PROCESS_FILES_START' }
    | { type: 'PROCESS_FILES_PROGRESS', payload: { message: string, progress: number } }
    | { type: 'PROCESS_FILES_SUCCESS', payload: { snapshots: Record<string, Snapshot>, latestSnapshotKey: string | null, insights: string[] } }
    | { type: 'PROCESS_FILES_ERROR' }
    | { type: 'SET_ACTIVE_SNAPSHOT', payload: string }
    | { type: 'SET_COMPARISON_MODE', payload: boolean }
    | { type: 'OPEN_COMPARISON_MODAL' }
    | { type: 'CLOSE_COMPARISON_MODAL' }
    | { type: 'OPEN_HELP_MODAL' }
    | { type: 'CLOSE_HELP_MODAL' }
    | { type: 'START_COMPARISON', payload: { base: string, compare: string } }
    | { type: 'UPDATE_FILTER', payload: { key: keyof Filters, value: any } }
    | { type: 'RESET_FILTERS' }
    | { type: 'UPDATE_FORECAST_SETTINGS', payload: { key: keyof ForecastSettings, value: number } }
    | { type: 'UPDATE_SORT', payload: keyof ProductData }
    | { type: 'SET_CURRENT_PAGE', payload: number }
    | { type: 'SET_ITEMS_PER_PAGE', payload: number };

export const appReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'PROCESS_FILES_START':
            return {
                ...state,
                loadingState: { isLoading: true, message: 'Processing your FBA snapshots...', progress: 0 },
                insights: [],
            };
        case 'PROCESS_FILES_PROGRESS':
            return {
                ...state,
                loadingState: { isLoading: true, ...action.payload },
            };
        case 'PROCESS_FILES_SUCCESS':
            return {
                ...state,
                snapshots: action.payload.snapshots,
                activeSnapshotKey: action.payload.latestSnapshotKey,
                insights: action.payload.insights,
                loadingState: { isLoading: false, message: '', progress: 0 },
                currentPage: 1,
            };
        case 'PROCESS_FILES_ERROR':
            return {
                ...state,
                loadingState: { isLoading: false, message: '', progress: 0 },
            };
        case 'SET_ACTIVE_SNAPSHOT':
            return {
                ...state,
                activeSnapshotKey: action.payload,
                isComparisonMode: false,
                comparisonSnapshotKeys: { base: null, compare: null },
            };
        case 'SET_COMPARISON_MODE':
            if (action.payload === false) {
                return {
                    ...state,
                    isComparisonMode: false,
                    comparisonSnapshotKeys: { base: null, compare: null },
                };
            }
            return { ...state, isComparisonMode: true };
        case 'OPEN_COMPARISON_MODAL':
            return { ...state, isComparisonModalOpen: true };
        case 'CLOSE_COMPARISON_MODAL':
            return { ...state, isComparisonModalOpen: false };
        case 'OPEN_HELP_MODAL':
            return { ...state, isHelpModalOpen: true };
        case 'CLOSE_HELP_MODAL':
            return { ...state, isHelpModalOpen: false };
        case 'START_COMPARISON':
            return {
                ...state,
                isComparisonMode: true,
                isComparisonModalOpen: false,
                comparisonSnapshotKeys: action.payload,
                currentPage: 1,
            };
        case 'UPDATE_FILTER':
            return {
                ...state,
                filters: { ...state.filters, [action.payload.key]: action.payload.value },
                currentPage: 1,
            };
        case 'RESET_FILTERS':
            return {
                ...state,
                filters: initialState.filters,
                currentPage: 1,
            };
        case 'UPDATE_FORECAST_SETTINGS':
            return {
                ...state,
                forecastSettings: { ...state.forecastSettings, [action.payload.key]: action.payload.value }
            };
        case 'UPDATE_SORT': {
            const newDirection = state.sortConfig.key === action.payload && state.sortConfig.direction === 'asc' ? 'desc' : 'asc';
            return {
                ...state,
                sortConfig: { key: action.payload, direction: newDirection },
            };
        }
        case 'SET_CURRENT_PAGE':
            return {
                ...state,
                currentPage: action.payload,
            };
        case 'SET_ITEMS_PER_PAGE':
            return {
                ...state,
                itemsPerPage: action.payload,
                currentPage: 1, // Reset to first page when changing items per page
            };
        default:
            return state;
    }
};