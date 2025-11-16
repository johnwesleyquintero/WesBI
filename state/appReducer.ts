
import type { ProductData, Snapshot, LoadingState, Filters, SortConfig } from '../types';

export interface AppState {
    snapshots: Record<string, Snapshot>;
    activeSnapshotKey: string | null;
    loadingState: LoadingState;
    isComparisonMode: boolean;
    insights: string[];
    filters: Filters;
    sortConfig: SortConfig;
    currentPage: number;
}

export const initialState: AppState = {
    snapshots: {},
    activeSnapshotKey: null,
    loadingState: { isLoading: false, message: '', progress: 0 },
    isComparisonMode: false,
    insights: [],
    filters: {
        search: '', condition: '', action: '', age: '', category: '',
        minStock: '', maxStock: '', stockStatus: ''
    },
    sortConfig: { key: 'riskScore', direction: 'desc' },
    currentPage: 1,
};

export type Action =
    | { type: 'PROCESS_FILES_START' }
    | { type: 'PROCESS_FILES_PROGRESS', payload: { message: string, progress: number } }
    | { type: 'PROCESS_FILES_SUCCESS', payload: { snapshots: Record<string, Snapshot>, latestSnapshotKey: string | null, insights: string[] } }
    | { type: 'PROCESS_FILES_ERROR' }
    | { type: 'SET_COMPARISON_MODE', payload: boolean }
    | { type: 'UPDATE_FILTER', payload: { key: keyof Filters, value: any } }
    | { type: 'RESET_FILTERS' }
    | { type: 'UPDATE_SORT', payload: keyof ProductData }
    | { type: 'SET_CURRENT_PAGE', payload: number };

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
        case 'SET_COMPARISON_MODE':
            return {
                ...state,
                isComparisonMode: action.payload,
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
        default:
            return state;
    }
};
