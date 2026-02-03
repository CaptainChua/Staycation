// Staycation/hooks/useDebouncedValue.ts
import { useEffect, useState } from "react";

/**
 * Returns a debounced version of `value` that only updates after `delay` ms
 * have elapsed since the last time `value` changed.
 *
 * Example:
 * const debounced = useDebouncedValue(searchTerm, 300);
 */
export default function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handle);
  }, [value, delay]);

  return debounced;
}
