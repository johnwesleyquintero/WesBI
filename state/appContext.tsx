import * as React from 'react';
import { appReducer, initialState, AppState, Action } from './appReducer';
import { saveState, loadState } from '../services/statePersistence';

interface AppContextType {
    state: AppState;
    dispatch: React.Dispatch<Action>;
}

const AppContext = React.createContext<AppContextType | undefined>(undefined);

// --- State Initialization with Persistence ---
// 1. Attempt to load the user's saved settings from localStorage.
const persistedState = loadState();
// 2. Merge the loaded settings over the default initial state. If a user has saved settings,
//    they will override the defaults. If not, the app starts with fresh defaults.
const effectiveInitialState = { ...initialState, ...persistedState };


export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initialize the app's state using the reducer and the effective initial state.
    const [state, dispatch] = React.useReducer(appReducer, effectiveInitialState);

    // --- State Persistence Effect ---
    // This `useEffect` hook is the core of the persistence mechanism.
    // It automatically triggers the `saveState` function whenever the `state` object changes.
    // This ensures that any user setting modification (filters, sorting, etc.) is immediately
    // saved to localStorage for the next session.
    React.useEffect(() => {
        saveState(state);
    }, [state]);

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
};

/**
 * Custom hook to provide easy access to the AppContext (state and dispatch).
 * Includes a check to ensure it's used within an AppProvider.
 */
export const useAppContext = () => {
    const context = React.useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};