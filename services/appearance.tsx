import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type AppearanceMode = "light" | "dark";

const appearanceStorageKey = "bingebook.appearanceMode.v2";

type AppAppearanceContextValue = {
  colors: AppAppearanceColors;
  isDark: boolean;
  isReady: boolean;
  mode: AppearanceMode;
  setAppearanceMode: (mode: AppearanceMode) => Promise<void>;
  toggleAppearanceMode: () => Promise<void>;
};

export type AppAppearanceColors = {
  accent: string;
  accentText: string;
  background: string;
  border: string;
  brand: string;
  card: string;
  chip: string;
  iconMuted: string;
  mutedText: string;
  navBackground: string;
  navInactive: string;
  primary: string;
  shadow: string;
  surface: string;
  text: string;
};

const darkColors: AppAppearanceColors = {
  accent: "#F1D99D",
  accentText: "#071323",
  background: "#071323",
  border: "rgba(255,250,240,0.13)",
  brand: "#FFFAF0",
  card: "#FFFAF0",
  chip: "rgba(255,250,240,0.1)",
  iconMuted: "#9AA3B3",
  mutedText: "rgba(255,250,240,0.64)",
  navBackground: "#FFFFFF",
  navInactive: "#6D7280",
  primary: "#071323",
  shadow: "#000000",
  surface: "rgba(255,250,240,0.09)",
  text: "#FFFAF0",
};

const lightColors: AppAppearanceColors = {
  accent: "#F1D99D",
  accentText: "#071323",
  background: "#FFFAF0",
  border: "rgba(7,19,35,0.08)",
  brand: "#071323",
  card: "#FFFFFF",
  chip: "rgba(7,19,35,0.07)",
  iconMuted: "#6D7280",
  mutedText: "rgba(7,19,35,0.58)",
  navBackground: "#FFFFFF",
  navInactive: "#6D7280",
  primary: "#071323",
  shadow: "#071323",
  surface: "#FFFFFF",
  text: "#071323",
};

const AppAppearanceContext = createContext<AppAppearanceContextValue | undefined>(undefined);

export function AppAppearanceProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppearanceMode>("light");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadAppearanceMode() {
      const savedMode = await AsyncStorage.getItem(appearanceStorageKey);

      if (!isMounted) {
        return;
      }

      if (savedMode === "light" || savedMode === "dark") {
        setMode(savedMode);
      }

      setIsReady(true);
    }

    loadAppearanceMode();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<AppAppearanceContextValue>(() => {
    const setAppearanceMode = async (nextMode: AppearanceMode) => {
      setMode(nextMode);
      await AsyncStorage.setItem(appearanceStorageKey, nextMode);
    };

    const toggleAppearanceMode = async () => {
      await setAppearanceMode(mode === "dark" ? "light" : "dark");
    };

    return {
      colors: mode === "dark" ? darkColors : lightColors,
      isDark: mode === "dark",
      isReady,
      mode,
      setAppearanceMode,
      toggleAppearanceMode,
    };
  }, [isReady, mode]);

  return <AppAppearanceContext.Provider value={value}>{children}</AppAppearanceContext.Provider>;
}

export function useAppAppearance() {
  const context = useContext(AppAppearanceContext);

  if (!context) {
    throw new Error("useAppAppearance must be used inside AppAppearanceProvider");
  }

  return context;
}
