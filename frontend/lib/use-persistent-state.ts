"use client";

import { useEffect, useState } from "react";

export function usePersistentState<T>(storage_key: string, initial_value: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initial_value;
    }

    try {
      const stored = window.localStorage.getItem(storage_key);
      if (stored !== null) {
        return JSON.parse(stored) as T;
      }
    } catch {
      return initial_value;
    }

    return initial_value;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(storage_key, JSON.stringify(value));
    } catch {
      // Best-effort persistence only.
    }
  }, [storage_key, value]);

  function clear() {
    setValue(initial_value);
    try {
      window.localStorage.removeItem(storage_key);
    } catch {
      // Best-effort persistence only.
    }
  }

  return {
    value,
    setValue,
    clear,
  };
}
