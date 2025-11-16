
import type { ProductData, Snapshot, LoadingState, Filters, SortConfig, ForecastSettings, Toast } from '../types';

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
    toasts: Toast[];
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
    sortConfig: [{ key: 'riskScore', direction: 'desc' }],
    currentPage: 1,
    itemsPerPage: 30,
    toasts: [],
};

export type Action =
    | { type: 'PROCESS_FILES_START' }
    | { type: 'PROCESS_FILES_PROGRESS', payload: { message: string, progress: number } }
    | { type: 'PROCESS_FILES_SUCCESS', payload: { snapshots: Record<string, Snapshot>, latestSnapshotKey: string | null, insights: string[], filesProcessedCount: number } }
    | { type: 'PROCESS_FILES_ERROR', payload: { message: string } }
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
    | { type: 'UPDATE_SORT', payload: { key: keyof ProductData, shiftKey: boolean } }
    | { type: 'SET_CURRENT_PAGE', payload: number }
    | { type: 'SET_ITEMS_PER_PAGE', payload: number }
    | { type: 'ADD_TOAST', payload: Omit<Toast, 'id'> }
    | { type: 'REMOVE_TOAST', payload: string };

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
        case 'PROCESS_FILES_SUCCESS': {
            const successToast: Omit<Toast, 'id'> = {
                type: 'success',
                title: 'Processing Complete',
                message: `${action.payload.filesProcessedCount} snapshot(s) processed successfully.`
            };
            return {
                ...state,
                snapshots: action.payload.snapshots,
                activeSnapshotKey: action.payload.latestSnapshotKey,
                insights: action.payload.insights,
                loadingState: { isLoading: false, message: '', progress: 0 },
                currentPage: 1,
                toasts: [...state.toasts, { ...successToast, id: Date.now().toString() }],
            };
        }
        case 'PROCESS_FILES_ERROR': {
             const errorToast: Omit<Toast, 'id'> = {
                type: 'error',
                title: 'Processing Failed',
                message: action.payload.message
            };
            return {
                ...state,
                loadingState: { isLoading: false, message: '', progress: 0 },
                toasts: [...state.toasts, { ...errorToast, id: Date.now().toString() }],
            };
        }
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
            const { key, shiftKey } = action.payload;
            const currentConfig = state.sortConfig;

            // --- Multi-column sorting logic (Shift key is pressed) ---
            if (shiftKey) {
                const newConfig = [...currentConfig];
                const existingSortIndex = newConfig.findIndex(s => s.key === key);
                if (existingSortIndex > -1) {
                    // Case 1: Clicked an existing column in a multi-sort. Toggle its direction.
                    newConfig[existingSortIndex].direction = newConfig[existingSortIndex].direction === 'asc' ? 'desc' : 'asc';
                } else {
                    // Case 2: Clicked a new column to add to the multi-sort.
                    newConfig.push({ key, direction: 'asc' });
                }
                return { ...state, sortConfig: newConfig };
            }
            
            // --- Single-column sorting logic (no Shift key) ---
            // Check if the clicked column is already the ONLY sorted column.
            const isToggling = currentConfig.length === 1 && currentConfig[0].key === key;
            
            if (isToggling) {
                // Case 3: Toggle the direction.
                const newDirection = currentConfig[0].direction === 'asc' ? 'desc' : 'asc';
                return { ...state, sortConfig: [{ key, direction: newDirection }] };
            } else {
                // Case 4: Any other scenario (new column, or switching from multi-sort).
                // Reset to a single sort on the clicked column, defaulting to ascending.
                return { ...state, sortConfig: [{ key, direction: 'asc' }] };
            }
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
        case 'ADD_TOAST':
            return {
                ...state,
                toasts: [...state.toasts, { ...action.payload, id: Date.now().toString() }],
            };
        case 'REMOVE_TOAST':
            return {
                ...state,
                toasts: state.toasts.filter(toast => toast.id !== action.payload),
            };
        default:
            return state;
    }
};
