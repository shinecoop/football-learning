export type Point = { x: number; y: number };
export type Side = "offense" | "defense";
export interface CurriculumCategory {
  id: string;
  name: string;
  side: Side;
  description: string;
  icon: string;
}
export interface Player {
  id: string;
  label: string;
  position: string;
  side: Side;
}
export interface PlayerAlignment extends Player, Point {
  assignment?: string;
}
export interface RouteWaypoint extends Point {
  at?: number;
}
export interface Route {
  playerId: string;
  routeType: string;
  waypoints: RouteWaypoint[];
}
export interface TeachingPoint {
  title: string;
  body: string;
}
export interface CoverageZone {
  id: string;
  defenderId: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  deep?: boolean;
}
export interface CoverageAssignment {
  defenderId: string;
  type: "man" | "zone" | "rush" | "spy";
  targetId?: string;
  destination: Point;
  responsibility: string;
  leverage: string;
}
export interface Defender extends PlayerAlignment {
  side: "defense";
}
export interface Coverage {
  id: string;
  name: string;
  shell: string;
  summary: string;
  rotation?: string;
  defenders: Defender[];
  assignments: CoverageAssignment[];
  zones: CoverageZone[];
}
export interface CoverageInteraction {
  conflict?: boolean;
  coverageId: string;
  title: string;
  explanation: string;
  keyDefender: string;
  stress: Point;
  high: string;
  low: string;
  qbNote: string;
  limitation: string;
}
export interface ConceptVariation {
  name: string;
  description: string;
}
export interface Concept {
  id: string;
  name: string;
  aliases: string[];
  category: string;
  family: string;
  difficulty: string;
  summary: string;
  detailedExplanation: string;
  coachingPoints: TeachingPoint[];
  prerequisites: string[];
  relatedConcepts: string[];
  strengths: string[];
  limitations: string[];
  formations: string[];
  personnel: string[];
  routes: Route[];
  assignments: Record<string, string>;
  qbProgression: string[];
  coverageInteractions: CoverageInteraction[];
  variations: ConceptVariation[];
}
export interface Formation {
  id: string;
  name: string;
  description: string;
  players: PlayerAlignment[];
  personnel: string;
}
export interface PersonnelPackage {
  id: string;
  name: string;
  rb: number;
  te: number;
  wr: number;
  description: string;
  formations: string[];
}
export interface DefensiveFront {
  id: string;
  name: string;
  description: string;
  defenders: Defender[];
}
export interface BlockingAssignment {
  playerId: string;
  targetId?: string;
  type: "block" | "combo" | "climb" | "pull";
  waypoints: Point[];
  description: string;
}
export interface RunConcept {
  id: string;
  name: string;
  summary: string;
  key: string;
  blocks: BlockingAssignment[];
  backPath: Route;
}
export interface Protection {
  id: string;
  name: string;
  summary: string;
  mikeId: string;
  blocks: BlockingAssignment[];
  pressureBlocks: BlockingAssignment[];
  rushers: string[];
  pressureRushers: string[];
  freeRusher?: string;
}
export interface Motion {
  id: string;
  name: string;
  playerId: string;
  waypoints: Point[];
  teaching: string;
}
export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
}
export interface Scenario {
  id: string;
  name: string;
  conceptId: string;
  coverageId: string;
}
export type LessonKind =
  | "passing"
  | "run"
  | "protection"
  | "motion"
  | "personnel"
  | "formation"
  | "coverage"
  | "strategy"
  | "article";
export interface Lesson {
  id: string;
  title: string;
  categoryId: string;
  kind: LessonKind;
  status: "ready" | "planned";
  minutes: number;
  level: string;
  summary: string;
  sections: TeachingPoint[];
  keyIdeas: string[];
  mistakes: string[];
  related: string[];
  quiz?: QuizQuestion;
  entityId?: string;
}
export interface Mastery {
  completed: boolean;
  recognition: boolean;
  understanding: boolean;
  interaction: boolean;
  qbReads: boolean;
  quiz: boolean;
}
export interface UserProgress {
  version: 1;
  lessons: Record<string, Mastery>;
  recent: string[];
  training: {
    attempts: number;
    correct: number;
    coverageCorrect: number;
    conflictCorrect: number;
  };
}
export interface SavedPlay {
  id: string;
  name: string;
  formationId: string;
  players: PlayerAlignment[];
  routes: Route[];
  updatedAt: string;
}
