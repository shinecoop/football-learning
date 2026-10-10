import { describe, it, expect } from "vitest";
import {
  createScenario,
  newProfile,
  sandboxCoverage,
  scenarioCoverage,
  SANDBOX_COVERAGES,
  SANDBOX_FORMATIONS,
  RECEIVER_IDS,
  SANDBOX_DT,
  SANDBOX_MODEL_VERSION,
} from "../src/domain/sandbox";
import {
  simulateScenario,
  receiverPosition,
  distanceYards,
  physicalParameters,
  variedRatings,
  frameAt,
  segmentDistanceYards,
  pathLengthYards,
} from "../src/lib/sandbox-engine";
import { parseScenario } from "../src/lib/workspace-codec";
import type { Route } from "../src/domain/types";
const straight: Route = {
  playerId: "Y",
  routeType: "go",
  waypoints: [
    { x: 50, y: 75 },
    { x: 50, y: 15 },
  ],
};
describe("timed route model", () => {
  it("holds the receiver for the configured release delay", () => {
    expect(receiverPosition(straight, 0.9, 50, 1)).toEqual(
      straight.waypoints[0],
    );
    expect(receiverPosition(straight, 1.4, 50, 1).y).toBeLessThan(75);
  });
  it("higher receiver speed covers more distance at a fixed time", () => {
    expect(receiverPosition(straight, 3, 80).y).toBeLessThan(
      receiverPosition(straight, 3, 20).y,
    );
  });
  it("starts exactly at alignment and stops at the last waypoint", () => {
    expect(receiverPosition(straight, 0, 50)).toEqual(straight.waypoints[0]);
    expect(receiverPosition(straight, 100, 50)).toEqual(straight.waypoints[1]);
    expect(pathLengthYards(straight)).toBeCloseTo(30);
  });
  it("does not break on duplicate points or an unfinished drawing", () => {
    expect(
      receiverPosition({ ...straight, waypoints: [{ x: 12, y: 72 }] }, 3, 50),
    ).toEqual({ x: 12, y: 72 });
    expect(
      receiverPosition(
        {
          ...straight,
          waypoints: [
            { x: 12, y: 72 },
            { x: 12, y: 72 },
            { x: 25, y: 30 },
          ],
        },
        2,
        50,
      ).y,
    ).toBeLessThan(72);
  });
  it("converts coordinates and checks the straight passing segment in illustrative yards", () => {
    expect(distanceYards({ x: 0, y: 0 }, { x: 0, y: 20 })).toBe(10);
    expect(
      segmentDistanceYards(
        { x: 50, y: 50 },
        { x: 50, y: 80 },
        { x: 50, y: 10 },
      ),
    ).toBeCloseTo(0);
    expect(
      segmentDistanceYards(
        { x: 70, y: 50 },
        { x: 50, y: 80 },
        { x: 50, y: 10 },
      ),
    ).toBeCloseTo(10.6666666);
  });
});
describe("explicit seven-on-seven assignments", () => {
  it("has seven offensive and seven defensive players in every supported formation and coverage", () => {
    for (const formation of SANDBOX_FORMATIONS)
      for (const coverage of SANDBOX_COVERAGES) {
        const s = createScenario("mesh", coverage, formation);
        expect(s.players).toHaveLength(7);
        expect(
          RECEIVER_IDS.every((id) => s.players.some((p) => p.id === id)),
        ).toBe(true);
        expect(sandboxCoverage(coverage).defenders).toHaveLength(7);
        expect(() => parseScenario(s)).not.toThrow();
      }
  });
  it("Cover 0 has no live rush or deep safety responsibility", () => {
    const c = sandboxCoverage("cover0");
    expect(c.assignments.some((a) => a.type === "rush")).toBe(false);
    expect(c.zones.some((z) => z.deep)).toBe(false);
    expect(c.assignments.filter((a) => a.type === "man")).toHaveLength(5);
  });
  it("renders a custom zone even when the preset assigned man responsibility", () => {
    const s = createScenario("smash", "cover1");
    s.defenders.CBR.assignment.type = "zone";
    s.defenders.CBR.zone = {
      id: "custom-CBR",
      defenderId: "CBR",
      name: "Test zone",
      x: 60,
      y: 30,
      width: 25,
      height: 20,
    };
    const coverage = scenarioCoverage(s);
    expect(coverage.zones.find((z) => z.defenderId === "CBR")?.name).toBe(
      "Test zone",
    );
  });
  it("cushion changes alignment separately from technique", () => {
    const s = createScenario();
    const initial = scenarioCoverage(s).defenders.find((d) => d.id === "CBR")!;
    s.defenders.CBR.cushion = 4;
    expect(scenarioCoverage(s).defenders.find((d) => d.id === "CBR")!.y).toBe(
      initial.y - 8,
    );
  });
  it("same scenario and profile produce identical replays", () => {
    const s = createScenario(),
      p = newProfile();
    expect(simulateScenario(s, p)).toEqual(simulateScenario(s, p));
    expect(simulateScenario(s, p).modelVersion).toBe(SANDBOX_MODEL_VERSION);
  });
  it("reaction delay leaves defenders at alignment before they can respond", () => {
    const s = createScenario("mesh", "cover1"),
      p = newProfile("low");
    const result = simulateScenario(s, p);
    const d = scenarioCoverage(s).defenders.find((d) => d.id === "A")!;
    expect(frameAt(result, 0.1).positions.A).toEqual({ x: d.x, y: d.y });
    expect(frameAt(result, 1).positions.A).not.toEqual({ x: d.x, y: d.y });
  });
  it("all movement remains bounded and no defender teleports faster than the speed cap", () => {
    for (const id of SANDBOX_COVERAGES) {
      const s = createScenario("sail", id),
        p = newProfile("high"),
        result = simulateScenario(s, p);
      for (let i = 1; i < result.frames.length; i++) {
        const frame = result.frames[i];
        for (const point of Object.values(frame.positions)) {
          expect(point.x).toBeGreaterThanOrEqual(0);
          expect(point.x).toBeLessThanOrEqual(100);
          expect(point.y).toBeGreaterThanOrEqual(0);
          expect(point.y).toBeLessThanOrEqual(100);
        }
        for (const d of sandboxCoverage(id).defenders) {
          expect(
            distanceYards(
              result.frames[i - 1].positions[d.id],
              frame.positions[d.id],
            ),
          ).toBeLessThanOrEqual(
            physicalParameters(p.ratings).speed * SANDBOX_DT + 0.00001,
          );
        }
      }
    }
  });
  it("reports release windows and a hypothetical deadline without outcome probabilities", () => {
    const s = createScenario();
    s.releaseTime = 4;
    s.pressureTime = 3;
    const result = simulateScenario(s, newProfile());
    expect(result.pressureExpired).toBe(true);
    expect(result.windows).toHaveLength(5);
    expect(result.release.seconds).toBe(4);
    expect(result.warnings.join(" ")).toContain("No rush is simulated");
    expect(result).not.toHaveProperty("completionProbability");
  });
  it("lower and higher settings affect replay geometry and clamp ratings", () => {
    const s = createScenario("mesh", "cover1"),
      p = newProfile();
    expect(simulateScenario(s, p, -20).frames.at(-1)?.positions.A).not.toEqual(
      simulateScenario(s, p, 20).frames.at(-1)?.positions.A,
    );
    expect(variedRatings(newProfile("low").ratings, -60).speed).toBe(0);
    expect(variedRatings(newProfile("high").ratings, 60).speed).toBe(100);
  });
  it("individual ratings override the global profile", () => {
    const s = createScenario("mesh", "cover1"),
      p = newProfile("high");
    s.defenders.A.ratings = newProfile("low").ratings;
    const individual = simulateScenario(s, p);
    delete s.defenders.A.ratings;
    const global = simulateScenario(s, p);
    expect(individual.frames.at(-1)?.positions.A).not.toEqual(
      global.frames.at(-1)?.positions.A,
    );
  });
  it("interpolates exact snapshot endpoints without mutating frames", () => {
    const result = simulateScenario(createScenario(), newProfile());
    const before = structuredClone(result);
    expect(frameAt(result, 0).positions).toEqual(result.frames[0].positions);
    expect(frameAt(result, 6).positions).toEqual(
      result.frames.at(-1)!.positions,
    );
    expect(result).toEqual(before);
  });
});
