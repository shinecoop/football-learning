"use client";
import { useSyncExternalStore } from "react";
import type { Mastery, SavedPlay, UserProgress } from "@/domain/types";
export interface AppStore {
  progress: UserProgress;
  plays: SavedPlay[];
}
const empty: AppStore = {
  progress: {
    version: 1,
    lessons: {},
    recent: [],
    training: {
      attempts: 0,
      correct: 0,
      coverageCorrect: 0,
      conflictCorrect: 0,
    },
  },
  plays: [],
};
let snapshot: AppStore = empty;
let hydrated = false;
const listeners = new Set<() => void>();
const key = "fieldwork:v1";
function notify() {
  listeners.forEach((l) => l());
}
function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        parsed.progress?.version === 1 &&
        parsed.progress?.lessons &&
        Array.isArray(parsed.plays) &&
        Array.isArray(parsed.progress.recent) &&
        parsed.progress.training
      )
        snapshot = parsed;
    }
  } catch {}
  notify();
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  hydrate();
  const sync = (event: StorageEvent) => {
    if (event.key === key) {
      try {
        const parsed = event.newValue ? JSON.parse(event.newValue) : empty;
        if (parsed.progress?.version === 1 && Array.isArray(parsed.plays)) {
          snapshot = parsed;
          notify();
        }
      } catch {}
    }
  };
  window.addEventListener("storage", sync);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", sync);
  };
}
export function useStore() {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => empty,
  );
}
function update(next: AppStore) {
  snapshot = next;
  try {
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    console.warn(
      "Local storage is unavailable; this session’s changes remain in memory.",
    );
  }
  notify();
}
export const blankMastery: Mastery = {
  completed: false,
  recognition: false,
  understanding: false,
  interaction: false,
  qbReads: false,
  quiz: false,
};
export function markLesson(id: string, patch: Partial<Mastery>) {
  hydrate();
  update({
    ...snapshot,
    progress: {
      ...snapshot.progress,
      lessons: {
        ...snapshot.progress.lessons,
        [id]: { ...blankMastery, ...snapshot.progress.lessons[id], ...patch },
      },
      recent: [id, ...snapshot.progress.recent.filter((i) => i !== id)].slice(
        0,
        8,
      ),
    },
  });
}
export function viewLesson(id: string) {
  hydrate();
  if (snapshot.progress.recent[0] === id) return;
  update({
    ...snapshot,
    progress: {
      ...snapshot.progress,
      recent: [id, ...snapshot.progress.recent.filter((i) => i !== id)].slice(
        0,
        8,
      ),
    },
  });
}
export function recordTraining(
  correct: boolean,
  type: "coverage" | "conflict",
) {
  const t = snapshot.progress.training;
  update({
    ...snapshot,
    progress: {
      ...snapshot.progress,
      training: {
        ...t,
        attempts: t.attempts + 1,
        correct: t.correct + Number(correct),
        coverageCorrect:
          t.coverageCorrect + Number(correct && type === "coverage"),
        conflictCorrect:
          t.conflictCorrect + Number(correct && type === "conflict"),
      },
    },
  });
}
export function savePlay(play: SavedPlay) {
  update({
    ...snapshot,
    plays: [play, ...snapshot.plays.filter((p) => p.id !== play.id)],
  });
}
export function deletePlay(id: string) {
  update({ ...snapshot, plays: snapshot.plays.filter((p) => p.id !== id) });
}
