import type { Ratings, SandboxScenario } from "./sandbox";
export interface PlayerProfile {
  id: string;
  name: string;
  side: "offense" | "defense" | "both";
  positions?: string;
  attributes?: Record<PlayerAttribute, number>;
  ratings: Ratings;
  releaseDelay: number;
  notes: string;
}
export interface SavedGame {
  id: string;
  name: string;
  opponent: string;
  scenario: SandboxScenario;
  updatedAt: string;
}
export interface FilmFocus {
  id: string;
  label: string;
  start: number;
  end: number;
  x: number;
  y: number;
}
export interface FilmCamera {
  id: string;
  label: string;
  source: string;
  local: boolean;
  offset: number;
  focus: FilmFocus[];
}
export interface LessonFilm {
  id: string;
  lessonId: string;
  title: string;
  cameras: FilmCamera[];
}

export const playerAttributeNames = {
  strength: "Strength",
  awareness: "Awareness",
  stamina: "Stamina",
  throwPower: "Throw power",
  throwAccuracy: "Throw accuracy",
  carrying: "Ball security",
  ballVision: "Ballcarrier vision",
  breakTackle: "Break tackle",
  runBlock: "Run blocking",
  passBlock: "Pass blocking",
  catching: "Catching",
  routeRunning: "Route running",
  release: "Release",
  tackling: "Tackling",
  pursuit: "Pursuit",
} as const;
export type PlayerAttribute = keyof typeof playerAttributeNames;
export const baselineAttributes = Object.fromEntries(
  Object.keys(playerAttributeNames).map((key) => [key, 50]),
) as Record<PlayerAttribute, number>;
