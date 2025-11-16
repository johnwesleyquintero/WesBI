import type { AppState } from '../state/appReducer';

const LOCAL_STORAGE_KEY = 'wesbi_app_state';

// Define which parts of the state we want to persist. These are user settings.
type PersistedState = Pick<AppState, 'filters' | 'forecastSettings' | 'sortConfig' | 'itemsPerPage'>;

/**
 * Saves the relevant parts of the application state to localStorage.
 * @param {AppState} state - The current application state.
 */
export const saveState = (state: AppState): void => {
  try {
    const stateToSave: PersistedState = {
      filters: state.filters,
      forecastSettings: state.forecastSettings,
      sortConfig: state.sortConfig,
      itemsPerPage: state.itemsPerPage,
    };
    const serializedState = JSON.stringify(stateToSave);
    localStorage.setItem(LOCAL_STORAGE_KEY, serializedState);
  } catch (error) {
    console.warn("Could not save WesBI state to localStorage:", error);
  }
};

/**
 * Loads the application state from localStorage.
 * @returns {Partial<AppState> | undefined} The persisted state, or undefined if not found/invalid.
 */
export const loadState = (): Partial<AppState> | undefined => {
  try {
    const serializedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (serializedState === null) {
      return undefined;
    }
    // Only return the parts of the state that are meant to be persisted.
    return JSON.parse(serializedState) as PersistedState;
  } catch (error) {
    console.warn("Could not load WesBI state from localStorage:", error);
    return undefined;
  }
};
