"use client";
import { useState, useCallback } from "react";
interface History<T> {
  past: T[];
  present: T;
  future: T[];
  gestureStart: T | undefined;
}
function resolve<T>(next: T | ((current: T) => T), current: T): T {
  return typeof next === "function"
    ? (next as (current: T) => T)(current)
    : next;
}
export function useHistory<T>(initial: () => T) {
  const [history, setHistory] = useState<History<T>>(() => ({
    past: [],
    present: initial(),
    future: [],
    gestureStart: undefined,
  }));
  const update = useCallback(
    (next: T | ((current: T) => T)) =>
      setHistory((h) => ({
        past: [...h.past.slice(-59), h.present],
        present: resolve(next, h.present),
        future: [],
        gestureStart: undefined,
      })),
    [],
  );
  const replace = useCallback(
    (value: T) =>
      setHistory({
        past: [],
        present: value,
        future: [],
        gestureStart: undefined,
      }),
    [],
  );
  const beginGesture = useCallback(
    () => setHistory((h) => ({ ...h, gestureStart: h.present })),
    [],
  );
  const preview = useCallback(
    (next: T | ((current: T) => T)) =>
      setHistory((h) => ({ ...h, present: resolve(next, h.present) })),
    [],
  );
  const endGesture = useCallback(
    () =>
      setHistory((h) =>
        h.gestureStart &&
        JSON.stringify(h.gestureStart) !== JSON.stringify(h.present)
          ? {
              past: [...h.past.slice(-59), h.gestureStart],
              present: h.present,
              future: [],
              gestureStart: undefined,
            }
          : { ...h, gestureStart: undefined },
      ),
    [],
  );
  const undo = useCallback(
    () =>
      setHistory((h) =>
        h.past.length
          ? {
              past: h.past.slice(0, -1),
              present: h.past.at(-1)!,
              future: [h.present, ...h.future],
              gestureStart: undefined,
            }
          : h,
      ),
    [],
  );
  const redo = useCallback(
    () =>
      setHistory((h) =>
        h.future.length
          ? {
              past: [...h.past, h.present],
              present: h.future[0],
              future: h.future.slice(1),
              gestureStart: undefined,
            }
          : h,
      ),
    [],
  );
  return {
    value: history.present,
    update,
    replace,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    beginGesture,
    preview,
    endGesture,
  };
}
