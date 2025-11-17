import type { AppState } from '../state/appReducer';

const LOCAL_STORAGE_KEY = 'wesbi_app_state';

// Define which parts of the AppState should be persisted across sessions.
// We only save user preferences, not transient data like the loaded snapshots.
type PersistedState = Pick<AppState, 'filters' | 'forecastSettings' | 'sortConfig' | 'itemsPerPage' | 'apiKey' | 'aiFeaturesEnabled'>;

/**
 * Saves user-configurable state to localStorage. This function is designed to be
 * resilient, wrapping the localStorage operation in a try...catch block to
 * prevent app crashes in environments where localStorage is unavailable (e.g., private browsing).
 *
 * @param {AppState} state - The complete current application state.
 */
export const saveState = (state: AppState): void => {
  try {
    // Extract only the fields we want to persist to keep the stored data minimal.
    const stateToSave: PersistedState = {
      filters: state.filters,
      forecastSettings: state.forecastSettings,
      sortConfig: state.sortConfig,
      itemsPerPage: state.itemsPerPage,
      apiKey: state.apiKey,
      aiFeaturesEnabled: state.aiFeaturesEnabled,
    };
    const serializedState = JSON.stringify(stateToSave);
    localStorage.setItem(LOCAL_STORAGE_KEY, serializedState);
  } catch (error) {
    // It's better to log a warning than to crash the app if saving fails.
    console.warn("WesBI: Could not save application state to localStorage.", error);
  }
};

/**
 * Loads and validates the persisted application state from localStorage.
 * This function includes robust error handling to gracefully manage cases where
 * no state is found, the data is corrupted, or the data structure is from an
 * older version of the application.
 *
 * @returns {Partial<AppState> | undefined} The persisted state, ready to be merged
 * with the initial default state, or undefined if no valid state is found.
 */
export const loadState = (): Partial<AppState> | undefined => {
  try {
    const serializedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    // If no state exists in localStorage, there's nothing to load.
    if (serializedState === null) {
      return undefined;
    }
    
    const parsedState: Partial<PersistedState> = JSON.parse(serializedState);

    // --- Data Validation & Migration ---
    // This block ensures backward compatibility and prevents crashes from legacy data formats.
    if (parsedState.sortConfig) {
      const sortConfig = parsedState.sortConfig as any;

      // Legacy check: An older app version saved sortConfig as an object.
      // We transparently migrate it to the current array-based format.
      if (sortConfig && typeof sortConfig === 'object' && !Array.isArray(sortConfig) && sortConfig.key && sortConfig.direction) {
        console.log("WesBI: Migrating legacy sort configuration to new format.");
        parsedState.sortConfig = [sortConfig];
      }
      // Integrity check: ensure sortConfig is a valid array of SortCriterion objects.
      else if (Array.isArray(sortConfig)) {
        const isValidArray = sortConfig.every(item =>
            item && typeof item === 'object' &&
            'key' in item && typeof item.key === 'string' &&
            'direction' in item && (item.direction === 'asc' || item.direction === 'desc')
        );
        if (!isValidArray) {
            console.warn("WesBI: Discarding invalid 'sortConfig' from localStorage as it contains malformed elements.");
            delete parsedState.sortConfig;
        }
      }
      // If it's neither the legacy object nor a valid array, it's invalid.
      else {
        console.warn("WesBI: Discarding invalid 'sortConfig' from localStorage due to unexpected format.");
        delete parsedState.sortConfig;
      }
    }

    return parsedState;
  } catch (error) {
    console.warn("WesBI: Could not load or parse state from localStorage. Resetting to defaults.", error);
    // If parsing fails, the stored data is likely corrupted. It's safer to clear it.
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (removeError) {
      console.error("WesBI: Failed to remove corrupted state from localStorage.", removeError);
    }
    return undefined;
  }
};
