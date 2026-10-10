"use client";
import type {
  PlayerProfile,
  SavedGame,
  LessonFilm,
} from "@/domain/workspace-extras";
import { parsePlayerProfile, parseGame, parseFilm } from "./workspace-codec";
import { useSyncExternalStore } from "react";
import type { Mastery, SavedPlay } from "@/domain/types";
import type { OpponentProfile, SandboxScenario } from "@/domain/sandbox";
import {
  emptyWorkspace,
  parseWorkspace,
  parseProfile,
  parseScenario,
  parseSavedPlay,
  decodeBackup,
  encodeBackup,
} from "./workspace-codec";
import type { WorkspaceData } from "./workspace-codec";
export interface AppStore extends WorkspaceData {
  storageError?: string;
  hydrated?: boolean;
}
const empty: AppStore = emptyWorkspace();
let snapshot: AppStore = empty;
let hydrated = false;
let recoveryBlocked = false;
const listeners = new Set<() => void>();
const key = "fieldwork:v2";
const legacyKey = "fieldwork:v1";
function notify() {
  listeners.forEach((l) => l());
}
function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(key) ?? localStorage.getItem(legacyKey);
    if (raw) snapshot = parseWorkspace(JSON.parse(raw));
  } catch {
    recoveryBlocked = true;
    snapshot = {
      ...empty,
      storageError:
        "Saved workspace could not be read. Original browser data has been preserved; export or restore a validated backup before replacing it.",
    };
  }
  snapshot = { ...snapshot, hydrated: true };
  notify();
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  hydrate();
  const sync = (event: StorageEvent) => {
    if (event.key === key) {
      try {
        snapshot = {
          ...(event.newValue
            ? parseWorkspace(JSON.parse(event.newValue))
            : emptyWorkspace()),
          hydrated: true,
        };
        notify();
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
  snapshot = { ...next, storageError: undefined, hydrated: true };
  if (recoveryBlocked) {
    snapshot = {
      ...snapshot,
      storageError:
        "Unreadable saved data has been preserved. Current changes are in memory only. Restore a validated backup from Workspace Data to enable saving again.",
    };
    notify();
    return;
  }
  try {
    localStorage.setItem(key, encodeBackup(snapshot));
  } catch {
    snapshot = {
      ...snapshot,
      storageError:
        "Browser storage is unavailable or full. Changes are in memory only; export a workspace backup before closing this page.",
    };
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
  hydrate();
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
  hydrate();
  play = parseSavedPlay(play);
  update({
    ...snapshot,
    plays: [play, ...snapshot.plays.filter((p) => p.id !== play.id)],
  });
}
export function deletePlay(id: string) {
  hydrate();
  update({ ...snapshot, plays: snapshot.plays.filter((p) => p.id !== id) });
}

export function saveProfile(profile: OpponentProfile) {
  hydrate();
  const valid = parseProfile(profile);
  update({
    ...snapshot,
    profiles: [valid, ...snapshot.profiles.filter((p) => p.id !== valid.id)],
  });
}
export function deleteProfile(id: string) {
  hydrate();
  if (id === "default")
    throw new Error("The baseline profile cannot be deleted.");
  if (snapshot.scenarios.some((s) => s.profileId === id))
    throw new Error(
      "This profile is used by a saved scenario. Choose a different profile in that scenario and save it before deleting.",
    );
  update({
    ...snapshot,
    profiles: snapshot.profiles.filter((p) => p.id !== id),
    scenarios: snapshot.scenarios.map((s) =>
      s.profileId === id ? { ...s, profileId: "default" } : s,
    ),
  });
}
export function saveScenario(scenario: SandboxScenario) {
  hydrate();
  const valid = parseScenario(scenario);
  if (!snapshot.profiles.some((p) => p.id === valid.profileId))
    throw new Error("Save the opponent profile before saving the scenario.");
  update({
    ...snapshot,
    scenarios: [valid, ...snapshot.scenarios.filter((s) => s.id !== valid.id)],
  });
}
export function deleteScenario(id: string) {
  hydrate();
  update({
    ...snapshot,
    scenarios: snapshot.scenarios.filter((s) => s.id !== id),
  });
}
export function exportWorkspace() {
  hydrate();
  return encodeBackup(snapshot);
}
export function restoreWorkspace(
  raw: string,
  mode: "merge" | "replace" = "merge",
) {
  hydrate();
  const imported = decodeBackup(raw);
  recoveryBlocked = false;
  if (mode === "replace") {
    update(imported);
    return;
  }
  const merge = <T extends { id: string }>(a: T[], b: T[]) => [
    ...a.filter((item) => !b.some((other) => other.id === item.id)),
    ...b,
  ];
  const progress = {
    ...snapshot.progress,
    lessons: { ...snapshot.progress.lessons },
  };
  for (const [id, m] of Object.entries(imported.progress.lessons)) {
    const existing = progress.lessons[id] ?? blankMastery;
    progress.lessons[id] = Object.fromEntries(
      Object.keys(blankMastery).map((key) => [
        key,
        existing[key as keyof Mastery] || m[key as keyof Mastery],
      ]),
    ) as unknown as Mastery;
  }
  // Re-importing a backup must not multiply training attempts. Merge keeps the larger count set.
  if (imported.progress.training.attempts > progress.training.attempts)
    progress.training = imported.progress.training;
  progress.recent = [
    ...new Set([...imported.progress.recent, ...progress.recent]),
  ].slice(0, 8);
  update({
    ...snapshot,
    progress,
    plays: merge(snapshot.plays, imported.plays),
    profiles: merge(snapshot.profiles, imported.profiles),
    scenarios: merge(snapshot.scenarios, imported.scenarios),
    playerProfiles: merge(snapshot.playerProfiles, imported.playerProfiles),
    games: merge(snapshot.games, imported.games),
    films: merge(snapshot.films, imported.films),
  });
}

export function savePlayerProfile(value: PlayerProfile) {
  hydrate();
  const p = parsePlayerProfile(value);
  update({
    ...snapshot,
    playerProfiles: [
      p,
      ...snapshot.playerProfiles.filter((x) => x.id !== p.id),
    ],
  });
}
export function saveGame(value: SavedGame) {
  hydrate();
  const g = parseGame(value);
  update({
    ...snapshot,
    games: [g, ...snapshot.games.filter((x) => x.id !== g.id)],
  });
}
export function saveFilm(value: LessonFilm) {
  hydrate();
  const f = parseFilm(value);
  update({
    ...snapshot,
    films: [f, ...snapshot.films.filter((x) => x.id !== f.id)],
  });
}
export function deleteExtra(
  kind: "games" | "playerProfiles" | "films",
  id: string,
) {
  hydrate();
  update({ ...snapshot, [kind]: snapshot[kind].filter((x) => x.id !== id) });
}
export function importPlayers(raw: string) {
  if (raw.length > 2000000)
    throw new Error("Player library is too large. Use a file under 2 MB.");
  const data: unknown = JSON.parse(raw);
  if (!Array.isArray(data) || data.length > 300)
    throw new Error("Choose a player library JSON array (up to 300 players).");
  const players = data.map(parsePlayerProfile);
  if (new Set(players.map((p) => p.id)).size !== players.length)
    throw new Error("Player library contains duplicate IDs.");
  hydrate();
  update({
    ...snapshot,
    playerProfiles: [
      ...snapshot.playerProfiles.filter(
        (p) => !players.some((x) => x.id === p.id),
      ),
      ...players,
    ],
  });
}
