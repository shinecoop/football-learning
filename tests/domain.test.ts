import { describe, it, expect } from "vitest";
import {
  samplePath,
  flipPoint,
  offsetRoute,
  makeRoute,
  defensivePosition,
} from "../src/lib/simulation";
import { concepts } from "../src/domain/concepts";
import { coverages } from "../src/domain/coverage";
import {
  formations,
  personnel,
  personnelFormation,
} from "../src/domain/formations";
import { lessons } from "../src/domain/curriculum";
import {
  fronts,
  runs,
  blocksAgainstFront,
  halfSlide,
} from "../src/domain/runs";
describe("field geometry", () => {
  it("interpolates by path distance, preserving turns and endpoints", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 0, y: 10 },
      { x: 30, y: 10 },
    ];
    expect(samplePath(points, 0.25)).toEqual({ x: 0, y: 10 });
    expect(samplePath(points, 0.5)).toEqual({ x: 10, y: 10 });
    expect(samplePath(points, -1)).toEqual(points[0]);
    expect(samplePath(points, 2)).toEqual(points[2]);
  });
  it("handles duplicate waypoints without invalid geometry", () => {
    expect(
      samplePath(
        [
          { x: 3, y: 5 },
          { x: 3, y: 5 },
        ],
        0.5,
      ),
    ).toEqual({ x: 3, y: 5 });
  });
  it("flips twice to the original coordinates", () => {
    expect(flipPoint(flipPoint({ x: 13, y: 72 }))).toEqual({ x: 13, y: 72 });
  });
  it("moves route geometry with a dragged receiver", () => {
    const player = {
      ...formations[0].players.find((p) => p.id === "X")!,
      x: 22,
    };
    const route = makeRoute({ ...player, x: 12 }, "go");
    expect(offsetRoute(route, [player]).waypoints[0].x).toBe(22);
    expect(offsetRoute(route, [player]).waypoints[1].x).toBe(22);
  });
  it("keeps all library routes within normalized bounds", () => {
    for (const player of formations[0].players)
      for (const type of [
        "go",
        "fade",
        "slant",
        "hitch",
        "out",
        "dig",
        "post",
        "corner",
        "drag",
        "shallow",
        "wheel",
        "flat",
        "angle",
      ])
        for (const point of makeRoute(player, type).waypoints) {
          expect(point.x).toBeGreaterThanOrEqual(0);
          expect(point.x).toBeLessThanOrEqual(100);
          expect(point.y).toBeGreaterThanOrEqual(0);
          expect(point.y).toBeLessThanOrEqual(100);
        }
  });
});
describe("curriculum integrity", () => {
  it("has stable unique lesson IDs", () => {
    expect(new Set(lessons.map((l) => l.id)).size).toBe(lessons.length);
  });
  it("has a valid explanation and conflict defender for every passing matchup", () => {
    expect(concepts.length).toBe(6);
    expect(coverages.length).toBe(9);
    for (const concept of concepts) {
      expect(concept.coverageInteractions.length).toBe(9);
      for (const interaction of concept.coverageInteractions) {
        const coverage = coverages.find(
          (c) => c.id === interaction.coverageId,
        )!;
        expect(
          coverage.defenders.some((d) => d.id === interaction.keyDefender),
        ).toBe(true);
        expect(interaction.explanation.length).toBeGreaterThan(100);
      }
    }
  });
  it("has five eligible skill players, quarterback, and five linemen in each formation", () => {
    for (const formation of formations) {
      expect(formation.players.length).toBe(11);
      expect(formation.players.filter((p) => p.position === "OL").length).toBe(
        5,
      );
      expect(formation.players.filter((p) => p.position === "QB").length).toBe(
        1,
      );
    }
  });
  it("shows correct positional composition for each personnel package", () => {
    for (const pack of personnel) {
      const players = personnelFormation(pack.id).players;
      expect(players.filter((p) => p.position === "RB").length).toBe(pack.rb);
      expect(players.filter((p) => p.position === "TE").length).toBe(pack.te);
      expect(players.filter((p) => p.position === "WR").length).toBe(pack.wr);
      expect(pack.rb + pack.te + pack.wr).toBe(5);
    }
  });
  it("assigns every defender and connects zones to existing players", () => {
    for (const coverage of coverages) {
      expect(coverage.defenders.length).toBe(11);
      expect(coverage.assignments.length).toBe(11);
      for (const zone of coverage.zones)
        expect(coverage.defenders.some((p) => p.id === zone.defenderId)).toBe(
          true,
        );
    }
  });
  it("makes man defenders follow their assigned receiver", () => {
    const coverage = coverages.find((c) => c.id === "cover1")!;
    const defender = coverage.defenders.find((d) => d.id === "A")!;
    const route = concepts.find((c) => c.id === "mesh")!.routes;
    const start = defensivePosition(defender, coverage, route, 0);
    const end = defensivePosition(defender, coverage, route, 1);
    expect(start).toEqual({ x: defender.x, y: defender.y });
    expect(end.x).toBeLessThan(30);
  });
  it("adapts run block landmarks to real defenders in each front", () => {
    for (const run of runs)
      for (const front of fronts)
        for (const block of blocksAgainstFront(run, front)) {
          expect(front.defenders.some((d) => d.id === block.targetId)).toBe(
            true,
          );
          expect(block.waypoints.at(-1)).toEqual(
            expect.objectContaining({
              x: expect.any(Number),
              y: expect.any(Number),
            }),
          );
        }
  });
  it("leaves the apex as the schematic free threat in half-slide pressure", () => {
    expect(halfSlide.pressureRushers).toContain(halfSlide.freeRusher);
    expect(
      halfSlide.pressureBlocks.some((b) => b.targetId === halfSlide.freeRusher),
    ).toBe(false);
  });
  it("never gives future lessons placeholder teaching sections", () => {
    for (const lesson of lessons.filter((l) => l.status === "planned")) {
      expect(lesson.sections).toHaveLength(0);
      expect(lesson.quiz).toBeUndefined();
    }
  });
});
