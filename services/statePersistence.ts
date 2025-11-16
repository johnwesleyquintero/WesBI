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
    const parsedState = JSON.parse(serializedState) as Partial<PersistedState>;

    // Production Fix: Validate the shape of the loaded state.
    // An older version of the app may have stored `sortConfig` as an object instead of an array.
    // This check ensures that an invalid `sortConfig` is discarded, allowing the application
    // to fall back to the default array, preventing a crash from `...findIndex is not a function`.
    if (parsedState.sortConfig && !Array.isArray(parsedState.sortConfig)) {
      console.warn('Persisted `sortConfig` was not an array. Discarding invalid value.', parsedState.sortConfig);
      delete parsedState.sortConfig;
    }

    return parsedState;
  } catch (error) {
    console.warn("Could not load or parse WesBI state from localStorage:", error);
    // If parsing fails, the stored data is likely corrupted. Clear it to prevent future errors.
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (removeError) {
      console.error("Failed to remove corrupted state from localStorage:", removeError);
    }
    return undefined;
  }
};