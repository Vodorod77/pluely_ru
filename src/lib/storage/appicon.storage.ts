import { STORAGE_KEYS } from "@/config";

export interface AppIconToggleState {
  isVisible: boolean;
}

export const DEFAULT_APP_ICON_STATE: AppIconToggleState = {
  isVisible: true, // Default is show
};

/**
 * Get the app icon toggle state from localStorage
 */
export const getAppIconToggleState = (): AppIconToggleState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.APP_ICON_TOGGLE);
    if (!stored) {
      return DEFAULT_APP_ICON_STATE;
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error("Failed to get app icon toggle state:", error);
    return DEFAULT_APP_ICON_STATE;
  }
};

/**
 * Save the app icon toggle state to localStorage
 */
export const setAppIconToggleState = (state: AppIconToggleState): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.APP_ICON_TOGGLE, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save app icon toggle state:", error);
  }
};

/**
 * Toggle the app icon visibility state
 */
export const toggleAppIconVisibility = (): AppIconToggleState => {
  const currentState = getAppIconToggleState();
  const newState: AppIconToggleState = {
    isVisible: !currentState.isVisible,
  };
  setAppIconToggleState(newState);
  return newState;
};

/**
 * Set app icon visibility state
 */
export const setAppIconVisibility = (isVisible: boolean): AppIconToggleState => {
  const newState: AppIconToggleState = {
    isVisible,
  };
  setAppIconToggleState(newState);
  return newState;
};
