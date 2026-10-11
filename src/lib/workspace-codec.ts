import {
  playerAttributeNames,
  baselineAttributes,
} from "@/domain/workspace-extras";
import type {
  PlayerProfile,
  SavedGame,
  LessonFilm,
} from "@/domain/workspace-extras";
import type {
  Mastery,
  PlayerAlignment,
  Route,
  SavedPlay,
  UserProgress,
  CoverageAssignment,
  CoverageZone,
} from "@/domain/types";
import type {
  OpponentProfile,
  Ratings,
  SandboxScenario,
  ReceiverSettings,
  DefenderSettings,
  FilmObservation,
} from "@/domain/sandbox";
import {
  ratingDefinitions,
  SANDBOX_MODEL_VERSION,
  RECEIVER_IDS,
  SANDBOX_COVERAGES,
  sandboxCoverage,
  newProfile,
} from "@/domain/sandbox";
import { formations } from "@/domain/formations";
export interface WorkspaceData {
  version: 2;
  progress: UserProgress;
  plays: SavedPlay[];
  profiles: OpponentProfile[];
  scenarios: SandboxScenario[];
  playerProfiles: PlayerProfile[];
  games: SavedGame[];
  films: LessonFilm[];
}
const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Expected an object.");
  return value as Record<string, unknown>;
};
const text = (value: unknown, max = 2000, allowEmpty = true): string => {
  if (
    typeof value !== "string" ||
    value.length > max ||
    (!allowEmpty && !value.trim())
  )
    throw new Error(
      `Expected ${allowEmpty ? "" : "nonempty "}text up to ${max} characters.`,
    );
  return value;
};
const number = (value: unknown, min: number, max: number): number => {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < min ||
    value > max
  )
    throw new Error(`Expected a number between ${min} and ${max}.`);
  return value;
};
const list = (value: unknown, max = 500): unknown[] => {
  if (!Array.isArray(value) || value.length > max)
    throw new Error(`Expected a list of at most ${max} items.`);
  return value;
};
const id = (value: unknown) => {
  const result = text(value, 120, false);
  if (
    !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(result) ||
    ["constructor", "prototype"].includes(result)
  )
    throw new Error("Invalid stable ID.");
  return result;
};
const point = (value: unknown) => {
  const v = object(value);
  return { x: number(v.x, 0, 100), y: number(v.y, 0, 100) };
};
function uniqueIds<T extends { id: string }>(values: T[], label: string): T[] {
  if (new Set(values.map((v) => v.id)).size !== values.length)
    throw new Error(`${label} contain duplicate IDs.`);
  return values;
}
export function parseRatings(value: unknown): Ratings {
  const v = object(value);
  return Object.fromEntries(
    ratingDefinitions.map((r) => [r.key, number(v[r.key], 0, 100)]),
  ) as Ratings;
}
function parseObservation(value: unknown): FilmObservation {
  const v = object(value),
    sourceUrl = text(v.sourceUrl, 1000);
  if (sourceUrl) {
    let url: URL;
    try {
      url = new URL(sourceUrl);
    } catch {
      throw new Error("Film references must use a valid http or https URL.");
    }
    if (!["http:", "https:"].includes(url.protocol))
      throw new Error("Film references must use http or https.");
  }
  return {
    id: id(v.id),
    label: text(v.label, 120, false),
    timestamp: text(v.timestamp, 80),
    notes: text(v.notes, 2000),
    sourceUrl,
  };
}
export function parseProfile(value: unknown): OpponentProfile {
  const v = object(value);
  if (!["unrated", "low", "medium", "high"].includes(String(v.confidence)))
    throw new Error("Invalid profile confidence.");
  return {
    id: id(v.id),
    name: text(v.name, 120, false),
    ratings: parseRatings(v.ratings),
    uncertainty: number(v.uncertainty, 0, 40),
    confidence: v.confidence as OpponentProfile["confidence"],
    notes: text(v.notes, 4000),
    observations: uniqueIds(
      list(v.observations, 100).map(parseObservation),
      "Observations",
    ),
    updatedAt: text(v.updatedAt, 80, false),
  };
}
function parsePlayer(value: unknown): PlayerAlignment {
  const v = object(value);
  if (v.side !== "offense" && v.side !== "defense")
    throw new Error("Invalid player side.");
  return {
    id: id(v.id),
    label: text(v.label, 20, false),
    position: text(v.position, 20, false),
    side: v.side,
    ...point(v),
  };
}
function parseRoutes(value: unknown, players: PlayerAlignment[]): Route[] {
  const routes = list(value, 11).map((value) => {
    const r = object(value);
    const playerId = id(r.playerId);
    if (!players.some((p) => p.id === playerId))
      throw new Error("A route references an unknown player.");
    const waypoints = list(r.waypoints, 40).map(point);
    if (waypoints.length < 2)
      throw new Error("Routes need at least a start and an end point.");
    return { playerId, routeType: text(r.routeType, 40, false), waypoints };
  });
  if (new Set(routes.map((r) => r.playerId)).size !== routes.length)
    throw new Error("A player can have only one route.");
  return routes;
}
export function parseSavedPlay(value: unknown): SavedPlay {
  const v = object(value),
    formationId = id(v.formationId);
  if (!formations.some((f) => f.id === formationId))
    throw new Error("Unknown formation.");
  const players = uniqueIds(list(v.players, 11).map(parsePlayer), "Players");
  if (
    !formations
      .find((f) => f.id === formationId)!
      .players.every((expected) => players.some((p) => p.id === expected.id)) ||
    players.find((p) => p.id === "QB")?.position !== "QB" ||
    players.length !== 11 ||
    players.some((p) => p.side !== "offense") ||
    players.filter((p) => p.position === "OL").length !== 5 ||
    players.filter((p) => p.position === "QB").length !== 1
  )
    throw new Error("Saved designer plays require eleven offensive players.");
  return {
    id: id(v.id),
    name: text(v.name, 120, false),
    formationId,
    players,
    routes: parseRoutes(v.routes, players),
    updatedAt: text(v.updatedAt, 80, false),
  };
}
function parseAssignment(
  value: unknown,
  defenderId: string,
  players: PlayerAlignment[],
): CoverageAssignment {
  const v = object(value);
  if (
    v.defenderId !== defenderId ||
    !["man", "zone", "spy"].includes(String(v.type))
  )
    throw new Error(
      "Sandbox assignments must be man, zone, or spy for the selected defender.",
    );
  let targetId: string | undefined;
  if (v.type === "man") {
    targetId = id(v.targetId);
    if (!players.some((p) => p.id === targetId && RECEIVER_IDS.includes(p.id)))
      throw new Error("Man assignments must reference an eligible receiver.");
  }
  return {
    defenderId,
    type: v.type as CoverageAssignment["type"],
    destination: point(v.destination),
    responsibility: text(v.responsibility, 2000),
    leverage: text(v.leverage, 2000),
    ...(targetId ? { targetId } : {}),
  };
}
export function parseScenario(value: unknown): SandboxScenario {
  const v = object(value);
  if (
    v.version !== 1 ||
    !SANDBOX_COVERAGES.includes(v.coverageId as SandboxScenario["coverageId"])
  )
    throw new Error("Unknown scenario version or coverage.");
  // V1 scenarios retain their setup; lineup-aware replays now use the V2 model.
  if (
    v.modelVersion !== undefined &&
    v.modelVersion !== "assignment-movement-v1" &&
    v.modelVersion !== SANDBOX_MODEL_VERSION
  )
    throw new Error(
      "This scenario uses an unsupported movement model version.",
    );
  const coverageId = v.coverageId as SandboxScenario["coverageId"],
    formationId = id(v.formationId);
  if (!formations.some((f) => f.id === formationId && f.id !== "i"))
    throw new Error("Unsupported sandbox formation.");
  const players = uniqueIds(
    list(v.players, 7).map(parsePlayer),
    "Sandbox players",
  );
  const expected = ["C", "QB", ...RECEIVER_IDS];
  if (
    players.length !== 7 ||
    players.some((p) => p.side !== "offense") ||
    !expected.every((i) => players.some((p) => p.id === i))
  )
    throw new Error("Sandbox scenarios require C, QB, X, H, Y, Z, and RB.");
  const routes = parseRoutes(v.routes, players);
  if (routes.some((r) => !RECEIVER_IDS.includes(r.playerId)))
    throw new Error("Only eligible receivers can have sandbox routes.");
  const rawReceivers = object(v.receivers),
    receivers: Record<string, ReceiverSettings> = {};
  for (const playerId of RECEIVER_IDS) {
    const r = object(rawReceivers[playerId]);
    receivers[playerId] = {
      speed: number(r.speed, 0, 100),
      releaseDelay: number(r.releaseDelay, 0, 2),
    };
  }
  const rawDefenders = object(v.defenders),
    defenders: Record<string, DefenderSettings> = {};
  for (const d of sandboxCoverage(coverageId).defenders) {
    const s = object(rawDefenders[d.id]);
    let zone: CoverageZone | undefined;
    if (s.zone) {
      const z = object(s.zone);
      const left = number(z.x, 0, 100),
        top = number(z.y, 0, 100),
        width = number(z.width, 1, 100 - left),
        height = number(z.height, 1, 100 - top);
      if (z.defenderId !== d.id) throw new Error("Custom zone owner mismatch.");
      if (z.deep !== undefined && typeof z.deep !== "boolean")
        throw new Error("Zone depth classification must be a boolean.");
      zone = {
        ...(z.deep !== undefined ? { deep: z.deep as boolean } : {}),
        id: id(z.id),
        defenderId: d.id,
        name: text(z.name, 60, false),
        x: left,
        y: top,
        width,
        height,
      };
    }
    defenders[d.id] = {
      ...(zone ? { zone } : {}),
      x: number(s.x, 3, 97),
      y: number(s.y, 3, 69),
      cushion: number(s.cushion, 0, 10),
      assignment: parseAssignment(s.assignment, d.id, players),
      ...(s.ratings ? { ratings: parseRatings(s.ratings) } : {}),
    };
  }
  const targetId = id(v.targetId);
  if (!RECEIVER_IDS.includes(targetId))
    throw new Error("Unknown throw target.");
  const profileId = id(v.profileId);
  const profileSnapshot = v.profileSnapshot
    ? parseProfile(v.profileSnapshot)
    : undefined;
  if (profileSnapshot && profileSnapshot.id !== profileId)
    throw new Error("Profile snapshot does not match the scenario profile ID.");
  const lineup: Record<string, PlayerProfile> = {};
  for (const [actorId, raw] of Object.entries(object(v.lineup ?? {}))) {
    if (
      !players.some((p) => p.id === actorId) &&
      !Object.hasOwn(defenders, actorId)
    )
      throw new Error("Unknown lineup position.");
    const profile = parsePlayerProfile(raw);
    if (
      profile.side !== "both" &&
      profile.side !==
        (players.some((p) => p.id === actorId) ? "offense" : "defense")
    )
      throw new Error("Player profile side does not match lineup position.");
    lineup[actorId] = profile;
  }
  return {
    ...(v.lineup ? { lineup } : {}),
    modelVersion: SANDBOX_MODEL_VERSION,
    ...(profileSnapshot ? { profileSnapshot } : {}),
    version: 1,
    id: id(v.id),
    name: text(v.name, 120, false),
    formationId,
    conceptId: text(v.conceptId, 120, false),
    coverageId,
    players,
    routes,
    receivers,
    defenders,
    profileId: id(v.profileId),
    releaseTime: number(v.releaseTime, 0.2, 6),
    pressureTime: number(v.pressureTime, 0.2, 6),
    targetId,
    notes: text(v.notes, 4000),
    updatedAt: text(v.updatedAt, 80, false),
  };
}
function parseProgress(value: unknown): UserProgress {
  const v = object(value);
  if (v.version !== 1) throw new Error("Unknown progress version.");
  const rawLessons = object(v.lessons),
    lessons: Record<string, Mastery> = {};
  if (Object.keys(rawLessons).length > 2000)
    throw new Error("Too many progress records.");
  const keys = [
    "completed",
    "recognition",
    "understanding",
    "interaction",
    "qbReads",
    "quiz",
  ] as const;
  for (const [lessonId, value] of Object.entries(rawLessons)) {
    id(lessonId);
    const raw = object(value);
    const record = {} as Mastery;
    for (const key of keys) {
      if (typeof raw[key] !== "boolean")
        throw new Error("Malformed lesson milestone.");
      record[key] = raw[key];
    }
    lessons[lessonId] = record;
  }
  const t = object(v.training),
    attempts = number(t.attempts, 0, 1000000),
    correct = number(t.correct, 0, attempts),
    coverageCorrect = number(t.coverageCorrect, 0, correct),
    conflictCorrect = number(t.conflictCorrect, 0, correct);
  if (coverageCorrect + conflictCorrect !== correct)
    throw new Error("Training counts do not agree.");
  return {
    version: 1,
    lessons,
    recent: list(v.recent, 8).map(id),
    training: { attempts, correct, coverageCorrect, conflictCorrect },
  };
}
export function emptyWorkspace(): WorkspaceData {
  return {
    version: 2,
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
    profiles: [newProfile()],
    scenarios: [],
    playerProfiles: [],
    games: [],
    films: [],
  };
}
export function parseWorkspace(value: unknown): WorkspaceData {
  const v = object(value);
  if (v.version !== undefined && v.version !== 2)
    throw new Error("Unsupported backup version.");
  const migrated = v.version === undefined;
  const profiles = uniqueIds(
    migrated ? [newProfile()] : list(v.profiles, 100).map(parseProfile),
    "Profiles",
  );
  if (!profiles.some((p) => p.id === "default")) profiles.unshift(newProfile());
  const scenarios = uniqueIds(
    migrated ? [] : list(v.scenarios, 300).map(parseScenario),
    "Scenarios",
  );
  if (scenarios.some((s) => !profiles.some((p) => p.id === s.profileId)))
    throw new Error("A scenario references a missing opponent profile.");
  return {
    version: 2,
    progress: parseProgress(v.progress),
    plays: uniqueIds(list(v.plays, 300).map(parseSavedPlay), "Saved plays"),
    profiles,
    scenarios,
    playerProfiles: uniqueIds(
      list(v.playerProfiles ?? [], 300).map(parsePlayerProfile),
      "Players",
    ),
    games: uniqueIds(list(v.games ?? [], 300).map(parseGame), "Games"),
    films: uniqueIds(list(v.films ?? [], 300).map(parseFilm), "Films"),
  };
}
export function decodeBackup(text: string): WorkspaceData {
  if (text.length > 2000000)
    throw new Error("Backup is too large. Use a file smaller than 2 MB.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(
      "This is not valid JSON. Export a Fieldwork workspace backup first.",
    );
  }
  return parseWorkspace(parsed);
}
export function encodeBackup(value: WorkspaceData): string {
  return JSON.stringify(parseWorkspace(value), null, 2);
}

export function decodeDesignerPlay(
  raw: string,
  playId: string,
  updatedAt: string,
): SavedPlay {
  if (raw.length > 2000000) throw new Error("Play file is too large.");
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error("Play file is not valid JSON.");
  }
  const source = object(value);
  return parseSavedPlay({ ...source, id: playId, updatedAt });
}

export function parsePlayerProfile(value: unknown): PlayerProfile {
  const v = object(value);
  if (v.side !== "offense" && v.side !== "defense" && v.side !== "both")
    throw new Error("Invalid player side.");
  const attributes = { ...baselineAttributes };
  if (v.attributes !== undefined) {
    const values = object(v.attributes);
    for (const key of Object.keys(
      playerAttributeNames,
    ) as (keyof typeof attributes)[]) {
      if (values[key] !== undefined)
        attributes[key] = number(values[key], 0, 100);
    }
  }
  return {
    ...(v.attributes !== undefined ? { attributes } : {}),
    ...(v.positions !== undefined ? { positions: text(v.positions, 100) } : {}),
    id: id(v.id),
    name: text(v.name, 100, false),
    side: v.side,
    ratings: parseRatings(v.ratings),
    releaseDelay: number(v.releaseDelay, 0, 2),
    notes: text(v.notes),
  };
}
export function parseGame(value: unknown): SavedGame {
  const v = object(value);
  return {
    id: id(v.id),
    name: text(v.name, 100, false),
    opponent: text(v.opponent, 100),
    scenario: parseScenario(v.scenario),
    updatedAt: text(v.updatedAt, 100),
  };
}
export function parseFilm(value: unknown): LessonFilm {
  const v = object(value);
  return {
    id: id(v.id),
    lessonId: id(v.lessonId),
    title: text(v.title, 100, false),
    cameras: uniqueIds(
      list(v.cameras, 12).map((value) => {
        const c = object(value);
        if (typeof c.local !== "boolean")
          throw new Error("Invalid camera source.");
        const source = text(c.source, 2000, false);
        if (c.local) id(source);
        else {
          const url = new URL(source);
          if (
            url.protocol !== "https:" ||
            /(^|\.)(youtube\.com|youtu\.be)$/.test(url.hostname)
          )
            throw new Error(
              "Use a direct HTTPS video file, not a YouTube link.",
            );
        }
        return {
          id: id(c.id),
          label: text(c.label, 100, false),
          source,
          local: c.local,
          offset: number(c.offset, -3600, 3600),
          focus: uniqueIds(
            list(c.focus, 100).map((value) => {
              const f = object(value);
              const start = number(f.start, 0, 86400),
                end = number(f.end, start, 86400);
              return {
                id: id(f.id),
                label: text(f.label, 100, false),
                start,
                end,
                x: number(f.x, 0, 100),
                y: number(f.y, 0, 100),
              };
            }),
            "Focus marks",
          ),
        };
      }),
      "Cameras",
    ),
  };
}
