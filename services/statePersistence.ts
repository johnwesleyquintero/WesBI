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

    // Production Fix & Enhancement: Validate and migrate the shape of the loaded `sortConfig`.
    // An older version of the app may have stored `sortConfig` as an object instead of an array.
    // This logic attempts to migrate the old format, and if it fails or the format is unknown,
    // it discards the invalid value to prevent crashes.
    if (parsedState.sortConfig) {
      const sortConfig = parsedState.sortConfig as any;
      if (!Array.isArray(sortConfig) && typeof sortConfig === 'object' && sortConfig.key && sortConfig.direction) {
        // Silently migrate the old object format to the new array format.
        parsedState.sortConfig = [sortConfig];
      } else if (!Array.isArray(sortConfig)) {
        // If it's not an array and not a migratable object, it's invalid. Discard it.
        delete parsedState.sortConfig;
      }
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