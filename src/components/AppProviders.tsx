"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type AppSecretContextValue = {
  apiKey: string | null;
  setApiKey: (k: string | null) => void;
};

const AppSecretContext = createContext<AppSecretContextValue | null>(null);

export function useAppSecret() {
  const ctx = useContext(AppSecretContext);
  if (!ctx) throw new Error("useAppSecret must be used within AppProviders");
  return ctx;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const q = searchParams.get("k");
  const [override, setOverride] = useState<string | null>(null);
  const apiKey = override ?? q;

  const setApiKey = useCallback((k: string | null) => {
    setOverride(k);
  }, []);

  const value = useMemo<AppSecretContextValue>(
    () => ({ apiKey, setApiKey }),
    [apiKey, setApiKey]
  );

  return (
    <AppSecretContext.Provider value={value}>
      {children}
    </AppSecretContext.Provider>
  );
}
