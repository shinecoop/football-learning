import type { Ratings, SandboxScenario } from "./sandbox";
export interface PlayerProfile {
  id: string;
  name: string;
  side: "offense" | "defense";
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
