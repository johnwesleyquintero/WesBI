import React, { createContext, useReducer, useContext, Dispatch, useEffect } from 'react';
import { appReducer, initialState, AppState, Action } from './appReducer';
import { saveState, loadState } from '../services/statePersistence';

interface AppContextType {
    state: AppState;
    dispatch: Dispatch<Action>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Load persisted state from localStorage and merge it with the default initial state.
// This allows user settings to be preserved across sessions.
const persistedState = loadState();
const effectiveInitialState = { ...initialState, ...persistedState };


export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, effectiveInitialState);

    // This effect runs after every state update and saves the relevant parts of the state to localStorage.
    useEffect(() => {
        saveState(state);
    }, [state]);

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};