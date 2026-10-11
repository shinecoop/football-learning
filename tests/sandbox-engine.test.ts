import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
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
import { baselineAttributes, type PlayerProfile } from "../src/domain/workspace-extras";
const receiverProfile = (): PlayerProfile => ({
  id: "receiver-profile",
  name: "Illustrative receiver",
  side: "offense",
  ratings: { ...newProfile().ratings, acceleration: 50, changeOfDirection: 50, reaction: 100 },
  attributes: { ...baselineAttributes, awareness: 100 },
  releaseDelay: 0,
  notes: "",
});
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
describe("player-aware receiver movement", () => {
  const cut: Route = {
    ...straight,
    routeType: "out",
    waypoints: [{ x: 50, y: 75 }, { x: 50, y: 65 }, { x: 90, y: 65 }],
  };
  it("lineup acceleration meaningfully changes the initial ramp", () => {
    const low = receiverProfile(), high = receiverProfile();
    low.ratings.acceleration = 0;
    high.ratings.acceleration = 100;
    expect(distanceYards(
      receiverPosition(straight, 1, 50, 0, low),
      receiverPosition(straight, 1, 50, 0, high),
    )).toBeGreaterThan(2);
  });
  it.each(["changeOfDirection", "routeRunning"] as const)(
    "%s changes cut timing but not straight-stem movement",
    (key) => {
      const low = receiverProfile(), high = receiverProfile();
      if (key === "changeOfDirection") {
        low.ratings[key] = 0;
        high.ratings[key] = 100;
      } else {
        low.attributes![key] = 0;
        high.attributes![key] = 100;
      }
      expect(receiverPosition(straight, 2.5, 50, 0, low)).toEqual(
        receiverPosition(straight, 2.5, 50, 0, high),
      );
      const slow = receiverPosition(cut, 2.5, 50, 0, low);
      const fast = receiverPosition(cut, 2.5, 50, 0, high);
      expect(fast.y).toBe(65);
      expect(fast.x).toBeGreaterThan(slow.x);
      expect(distanceYards(slow, fast)).toBeGreaterThan(1);
      expect(receiverPosition(cut, 100, 50, 0, low)).toEqual(cut.waypoints.at(-1));
    },
  );
  it("accumulates turn delays without position jumps at successive corners", () => {
    const player = receiverProfile();
    const route: Route = {
      ...cut,
      waypoints: [
        { x: 50, y: 75 },
        { x: 50, y: 65 },
        { x: 60, y: 65 },
        { x: 60, y: 45 },
      ],
    };
    const speed = 5.2 + 50 * 0.036;
    const acceleration = 2.2 + player.ratings.acceleration * 0.055;
    const rampDistance = speed * speed / (2 * acceleration);
    const travelTime = (distance: number) => distance < rampDistance
      ? Math.sqrt(2 * distance / acceleration)
      : distance / speed + speed / (2 * acceleration);
    const turnDelay = (Math.PI / 2)
      / (1.1 + player.ratings.changeOfDirection * 0.034)
      * (1.3 - player.attributes!.routeRunning * 0.008);
    let traveled = 0;
    for (let i = 1; i <= 2; i++) {
      traveled += distanceYards(route.waypoints[i - 1], route.waypoints[i]);
      const arrival = travelTime(traveled) + (i - 1) * turnDelay;
      const departure = arrival + turnDelay;
      const corner = route.waypoints[i];
      expect(receiverPosition(route, arrival + turnDelay / 2, 50, 0, player)).toEqual(corner);
      for (const seconds of [arrival - 0.00001, arrival, departure, departure + 0.00001]) {
        expect(distanceYards(receiverPosition(route, seconds, 50, 0, player), corner))
          .toBeLessThanOrEqual(speed * 0.00001 + 1e-9);
      }
      expect(distanceYards(
        receiverPosition(route, departure + 0.1, 50, 0, player), corner,
      )).toBeGreaterThan(0.1);
    }
  });
  it("awareness adds start lag, with reaction as the legacy profile fallback", () => {
    const low = receiverProfile(), high = receiverProfile();
    low.attributes!.awareness = 0;
    expect(receiverPosition(straight, 0.2, 50, 0, low)).toEqual(straight.waypoints[0]);
    expect(receiverPosition(straight, 0.2, 50, 0, high).y).toBeLessThan(75);
    expect(distanceYards(
      receiverPosition(straight, 1.5, 50, 0, low),
      receiverPosition(straight, 1.5, 50, 0, high),
    )).toBeGreaterThan(1);
    delete low.attributes;
    low.ratings.reaction = 0;
    expect(receiverPosition(straight, 0.2, 50, 0, low)).toEqual(straight.waypoints[0]);
  });
  it("keeps editable speed and release delay authoritative over profile values", () => {
    const player = receiverProfile();
    const before = receiverPosition(straight, 3, 50, 0.4, player);
    player.ratings.speed = 0;
    player.releaseDelay = 5;
    expect(receiverPosition(straight, 3, 50, 0.4, player)).toEqual(before);
    expect(receiverPosition(straight, 0.4, 50, 0.4, player)).toEqual(straight.waypoints[0]);
    expect(receiverPosition(straight, 3, 100, 0.4, player).y).toBeLessThan(before.y);
    expect(receiverPosition(straight, 3, 50, 1.4, player).y).toBeGreaterThan(before.y);
  });
  it("ignores duplicate waypoints when charging turns and clamps player ratings", () => {
    const player = receiverProfile();
    const duplicate = { ...cut, waypoints: [cut.waypoints[0], cut.waypoints[1], cut.waypoints[1], cut.waypoints[2]] };
    for (const seconds of [0, 1, 1.5, 2, 3, 100]) {
      expect(receiverPosition(duplicate, seconds, 50, 0, player)).toEqual(
        receiverPosition(cut, seconds, 50, 0, player),
      );
    }
    const clamped = structuredClone(player);
    player.ratings.acceleration = 200;
    player.ratings.changeOfDirection = -100;
    player.attributes!.awareness = -100;
    player.attributes!.routeRunning = 200;
    clamped.ratings.acceleration = 100;
    clamped.ratings.changeOfDirection = 0;
    clamped.attributes!.awareness = 0;
    clamped.attributes!.routeRunning = 100;
    expect(receiverPosition(cut, 3, 50, 0, player)).toEqual(
      receiverPosition(cut, 3, 50, 0, clamped),
    );
  });
  it.each(["acceleration", "changeOfDirection", "awareness", "routeRunning"] as const)(
    "uses lineup %s in deterministic replays without mutating the scenario",
    (key) => {
      const scenario = createScenario();
      scenario.routes = [cut];
      scenario.lineup = { Y: receiverProfile() };
      const low = structuredClone(scenario), high = structuredClone(scenario);
      if (key === "acceleration" || key === "changeOfDirection") {
        low.lineup!.Y.ratings[key] = 0;
        high.lineup!.Y.ratings[key] = 100;
      } else {
        low.lineup!.Y.attributes![key] = 0;
        high.lineup!.Y.attributes![key] = 100;
      }
      const before = structuredClone(high);
      const profile = newProfile();
      const result = simulateScenario(high, profile);
      expect(result).toEqual(simulateScenario(high, profile));
      expect(high).toEqual(before);
      expect(distanceYards(
        frameAt(simulateScenario(low, profile), 2.5).positions.Y,
        frameAt(result, 2.5).positions.Y,
      )).toBeGreaterThan(1);
      expect(frameAt(result, 2.5).positions.X).toEqual(
        frameAt(simulateScenario(scenario, profile), 2.5).positions.X,
      );
    },
  );
});
describe("explicit seven-on-seven assignments", () => {
  it("preserves baseline replay geometry without a lineup", () => {
    const hashes = SANDBOX_COVERAGES.map((coverage) => {
      const replay = simulateScenario(createScenario("mesh", coverage), newProfile());
      // Audit metadata changed, but baseline geometry is unchanged. Canonicalize
      // only the model version to retain the independently captured pre-change hashes.
      return createHash("sha256")
        .update(JSON.stringify({ ...replay, modelVersion: "assignment-movement-v1" }))
        .digest("hex");
    });
    expect(hashes).toMatchInlineSnapshot(`
      [
        "1b03df568a87bce8c3146380925bc1ac6ade2cf839e23a1f0d7111e62d86f9d1",
        "eb40078f8954797b5282b5a9a1500da044a79533342786d09b47adb66e5c7f55",
        "9b03a979829ac0fed82caaf55fefcf5bb9df4f7dcae36d68470ae27304ea8d50",
        "266863de96e9387783caca3ead08e3769527230f91583b9586c3794303137ebc",
      ]
    `);
  });
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
