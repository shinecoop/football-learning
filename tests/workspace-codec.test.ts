import { describe, it, expect } from "vitest";
import { createScenario, newProfile } from "../src/domain/sandbox";
import { formations } from "../src/domain/formations";
import { makeRoute } from "../src/lib/simulation";
import {
  emptyWorkspace,
  parseWorkspace,
  decodeBackup,
  encodeBackup,
  parseScenario,
  parseProfile,
  decodeDesignerPlay,
} from "../src/lib/workspace-codec";
describe("workspace validation and migration", () => {
  it("migrates v1 progress and plays without changing earned data", () => {
    const old = {
      progress: {
        version: 1,
        lessons: {
          smash: {
            completed: true,
            recognition: true,
            understanding: false,
            interaction: false,
            qbReads: false,
            quiz: true,
          },
        },
        recent: ["smash"],
        training: {
          attempts: 3,
          correct: 2,
          coverageCorrect: 1,
          conflictCorrect: 1,
        },
      },
      plays: [],
    };
    const result = parseWorkspace(old);
    expect(result.version).toBe(2);
    expect(result.progress).toEqual(old.progress);
    expect(result.profiles[0].id).toBe("default");
    expect(result.scenarios).toEqual([]);
  });
  it("round trips routes, profile observations, saved assumptions, and progress", () => {
    const data = emptyWorkspace();
    const profile = {
      ...newProfile("high", "opponent-1"),
      observations: [
        {
          id: "obs-1",
          label: "Seam carry",
          timestamp: "Q2 04:12",
          sourceUrl: "https://example.com/film",
          notes: "Carry begins after the receiver reaches the hash.",
        },
      ],
      confidence: "low" as const,
    };
    data.profiles.push(profile);
    data.scenarios.push({
      ...createScenario("mesh", "cover1"),
      id: "scenario-1",
      profileId: profile.id,
      profileSnapshot: structuredClone(profile),
    });
    data.scenarios[0].defenders.SL.zone = {
      id: "zone-SL",
      defenderId: "SL",
      name: "Deep middle",
      x: 22,
      y: 7,
      width: 56,
      height: 35,
      deep: true,
    };
    expect(decodeBackup(encodeBackup(data))).toEqual(data);
  });
  it("rejects bad coordinates, unknown players, and incomplete routes before persistence", () => {
    const scenario = createScenario();
    scenario.routes[0].waypoints[1].x = 1000;
    expect(() => parseScenario(scenario)).toThrow();
    const unknown = createScenario();
    unknown.routes[0].playerId = "ghost";
    expect(() => parseScenario(unknown)).toThrow();
    const incomplete = createScenario();
    incomplete.routes[0].waypoints = [incomplete.routes[0].waypoints[0]];
    expect(() => parseScenario(incomplete)).toThrow();
  });
  it("rejects invalid rating ranges and active-content URLs", () => {
    const bad = newProfile();
    bad.ratings.speed = Number.NaN;
    expect(() => parseProfile(bad)).toThrow();
    bad.ratings.speed = 101;
    expect(() => parseProfile(bad)).toThrow();
    const profile = newProfile();
    profile.observations = [
      {
        id: "obs-1",
        label: "test",
        timestamp: "",
        notes: "",
        sourceUrl: "javascript:alert(1)",
      },
    ];
    expect(() => parseProfile(profile)).toThrow("http or https");
  });
  it("rejects unknown versions, duplicate identities, broken references, and mismatched snapshots", () => {
    expect(() => parseWorkspace({ ...emptyWorkspace(), version: 3 })).toThrow();
    const duplicate = emptyWorkspace();
    duplicate.profiles.push(newProfile());
    expect(() => parseWorkspace(duplicate)).toThrow("duplicate");
    const missing = emptyWorkspace();
    missing.scenarios = [{ ...createScenario(), profileId: "missing" }];
    expect(() => parseWorkspace(missing)).toThrow("missing");
    const mismatch = createScenario();
    mismatch.profileSnapshot = newProfile("low", "other");
    expect(() => parseScenario(mismatch)).toThrow("does not match");
  });
  it("rejects malformed and oversized files without trusting imported fields", () => {
    expect(() => decodeBackup("not json")).toThrow("valid JSON");
    expect(() => decodeBackup("x".repeat(2000001))).toThrow("too large");
    const bad = emptyWorkspace();
    bad.progress.training.correct = 1;
    expect(() => parseWorkspace(bad)).toThrow();
  });
  it("imports an original designer export with generated identity and explicit metadata", () => {
    const players = structuredClone(formations[0].players);
    const raw = JSON.stringify({
      name: "Imported play",
      formationId: "2x2",
      players,
      routes: [
        makeRoute(
          players.find((p) => p.id === "Y")!,
          "corner",
        ),
      ],
    });
    const result = decodeDesignerPlay(raw, "import-1", "2026-10-07T12:00:00Z");
    expect(result.id).toBe("import-1");
    expect(result.routes[0].routeType).toBe("corner");
  });
  it("rejects man targets outside the eligible receiver set and out-of-bounds zones", () => {
    const s = createScenario("mesh", "cover1");
    s.defenders.A.assignment.targetId = "QB";
    expect(() => parseScenario(s)).toThrow("eligible");
    const z = createScenario();
    z.defenders.A.zone = {
      id: "zone-A",
      defenderId: "A",
      name: "Bad zone",
      x: 90,
      y: 20,
      width: 40,
      height: 15,
    };
    expect(() => parseScenario(z)).toThrow();
  });
  it("rejects dangerous stable identifiers", () => {
    const p = newProfile();
    p.id = "__proto__";
    expect(() => parseProfile(p)).toThrow("stable ID");
  });
});

describe("replay audit metadata", () => {
  it("preserves the model identity and refuses unknown movement model versions", () => {
    const scenario = createScenario();
    expect(parseScenario(scenario).modelVersion).toBe(scenario.modelVersion);
    expect(() =>
      parseScenario({ ...scenario, modelVersion: "future-unknown-model" }),
    ).toThrow("unsupported movement model");
  });
});
