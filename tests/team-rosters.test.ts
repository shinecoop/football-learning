import { describe, expect, it } from "vitest";
import source from "../data/ea/broncos-madden-27-week-3.json";
import roster from "../src/domain/broncos-roster.json";
import { importTeam, offensivePlayerLabels, playerSkillSummary, TEAM_OPTIONS } from "../src/domain/team-rosters";
import { createScenario, newProfile, withCoverage, SANDBOX_COVERAGES, SANDBOX_FORMATIONS } from "../src/domain/sandbox";
import { playerAttributeNames, type PlayerProfile } from "../src/domain/workspace-extras";
import { decodeBackup, emptyWorkspace, encodeBackup, parsePlayerProfile, parseScenario } from "../src/lib/workspace-codec";

const teamId = "broncos-26-27";
const expectedPositions: Record<string, string[]> = {
  QB: ["QB"], C: ["C"], X: ["WR"], Z: ["WR"], H: ["WR"],
  Y: ["TE"], RB: ["HB"], CBL: ["CB"], CBR: ["CB"], A: ["CB"],
  SL: ["FS"], SR: ["SS"], M: ["MIKE", "WILL"], W: ["MIKE", "WILL"],
};
const average = (...values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;

function freeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

describe("local Broncos roster", () => {
  it("labels all seven offensive nodes with source jersey numbers and names, including saved lineups", () => {
    const imported = importTeam(createScenario(), teamId);
    const labels = offensivePlayerLabels(imported);
    expect(Object.keys(labels).sort()).toEqual(imported.players.map((p) => p.id).sort());
    for (const actor of imported.players) {
      const player = imported.lineup![actor.id];
      const original = source.ratingDetails.items.find((p) => `ea-${p.id}` === player.id)!;
      expect(labels[actor.id].name).toBe(`#${original.jerseyNum} ${player.name}`);
      expect(labels[actor.id].caption).toContain(`#${original.jerseyNum}`);
    }
    expect(offensivePlayerLabels(parseScenario(imported))).toEqual(labels);
    expect(offensivePlayerLabels(createScenario())).toEqual({});
    expect(labels.CBL).toBeUndefined();
  });
  it("keeps imported individual ratings when switching coverage", () => {
    const imported = importTeam(createScenario(), teamId);
    for (const coverage of SANDBOX_COVERAGES) {
      const changed = withCoverage(imported, coverage);
      expect(changed.lineup).toEqual(imported.lineup);
      expect(changed.receivers).toEqual(imported.receivers);
      for (const [id, settings] of Object.entries(changed.defenders)) {
        expect(settings.ratings).toEqual(imported.defenders[id].ratings);
      }
      expect(() => parseScenario(changed)).not.toThrow();
    }
  });
  it("offers the requested team and keeps all 60 players consistent with the seed source", () => {
    expect(TEAM_OPTIONS).toEqual([{ id: teamId, label: "2026–27 Denver Broncos" }]);
    expect(roster.players).toHaveLength(60);
    expect(new Set(roster.players.map((p) => p.eaId)).size).toBe(60);
    expect(roster.sourcePath).toBe("data/ea/broncos-madden-27-week-3.json");
    expect(roster.sourceUrl).toBe(source.retrieval[0].url);
    expect(roster.retrievedAt).toBe(source.retrieval[0].retrievedAtUtc);
    expect(roster.gameEdition).toBe(source.snapshot.gameSlug);
    expect(roster.iterationId).toBe(source.snapshot.iteration.id);
    for (const player of roster.players) {
      const original = source.ratingDetails.items.find((p) => p.id === player.eaId)!;
      expect(original).toBeDefined();
      expect(player.name).toBe(`${original.firstName} ${original.lastName}`);
      expect(player.position).toBe(original.position.shortLabel);
      expect(player.side).toBe(original.position.positionType.id);
      expect(player.overall).toBe(original.overallRating);
      expect(player.jerseyNumber).toBe(original.jerseyNum);
      for (const [key, value] of Object.entries(player.ratings)) {
        const stats = original.stats as Record<string, { value: number | string }>;
        expect(value, `${player.name}: ${key}`).toBe(stats[key].value);
      }
    }
  });

  for (const formation of SANDBOX_FORMATIONS) {
    for (const coverage of SANDBOX_COVERAGES) {
      it(`imports a complete unique position-fit lineup for ${formation}/${coverage}`, () => {
        const scenario = createScenario("smash", coverage, formation);
        const imported = importTeam(scenario, teamId);
        const lineup = imported.lineup!;
        expect(Object.keys(lineup).sort()).toEqual([
          ...scenario.players.map((p) => p.id), ...Object.keys(scenario.defenders),
        ].sort());
        expect(Object.keys(lineup)).toHaveLength(14);
        expect(new Set(Object.values(lineup).map((p) => p.id)).size).toBe(14);
        for (const [actorId, player] of Object.entries(lineup)) {
          expect(expectedPositions[actorId]).toContain(player.positions);
          expect(player.side).toBe(actorId in scenario.defenders ? "defense" : "offense");
          expect(parsePlayerProfile(player)).toEqual(player);
        }
        expect(Object.values(imported.defenders).every((d) => d.assignment.type !== "rush")).toBe(true);
        expect(parseScenario(imported)).toEqual(imported);
        expect(importTeam(scenario, teamId)).toEqual(imported);
      });
    }
  }

  it("selects the top overall eligible unused player, with EA ID as deterministic tie-breaker", () => {
    const lineup = importTeam(createScenario(), teamId).lineup!;
    const ranked = [...roster.players].sort((a, b) => b.overall - a.overall || a.eaId - b.eaId);
    const used = new Set<number>();
    for (const [actorId, positions] of Object.entries(expectedPositions)) {
      const expected = ranked.find((p) => positions.includes(p.position) && !used.has(p.eaId))!;
      expect(lineup[actorId].id).toBe(`ea-${expected.eaId}`);
      used.add(expected.eaId);
    }
    expect(lineup.QB.name).toBe("Bo Nix");
    expect(lineup.CBL.name).toBe("Pat Surtain II");
  });

  it("maps every profile field from real source ratings without adding schema fields", () => {
    const lineup = importTeam(createScenario(), teamId).lineup!;
    for (const profile of Object.values(lineup)) {
      const player = roster.players.find((p) => profile.id === `ea-${p.eaId}`)!;
      const r = player.ratings;
      expect(profile.ratings).toEqual({
        speed: r.speed, acceleration: r.acceleration, changeOfDirection: r.changeOfDirection,
        reaction: r.awareness, manCoverage: r.manCoverage, zoneDiscipline: r.zoneCoverage,
      });
      expect(profile.attributes).toEqual({
        strength: r.strength, awareness: r.awareness, stamina: r.stamina,
        throwPower: r.throwPower, throwAccuracy: average(r.throwAccuracyShort, r.throwAccuracyMid, r.throwAccuracyDeep),
        carrying: r.carrying, ballVision: r.bCVision, breakTackle: r.breakTackle,
        runBlock: r.runBlock, passBlock: r.passBlock, catching: r.catching,
        routeRunning: average(r.shortRouteRunning, r.mediumRouteRunning, r.deepRouteRunning),
        release: r.release, tackling: r.tackle, pursuit: r.pursuit,
      });
      expect(Object.keys(profile.attributes!).sort()).toEqual(Object.keys(playerAttributeNames).sort());
      expect(profile.releaseDelay).toBe(0);
      expect(profile.notes).toContain(`EA ID ${player.eaId}`);
      expect(profile.notes).toContain(roster.gameEdition);
      expect(profile.notes).toContain(roster.iterationId);
      expect(profile.notes).toContain(`overall ${player.overall}`);
      expect(profile.notes).toContain(roster.sourcePath);
      expect(profile.notes).toContain("illustrative, not measured real-world skill");
    }
  });

  it("preserves custom geometry, routes, assignments, timing, and opponent profile immutably", () => {
    const scenario = createScenario("mesh", "cover1", "trips");
    scenario.profileSnapshot = newProfile("high");
    scenario.notes = "Keep my assumptions";
    scenario.players[0].x += 2;
    scenario.routes[0].waypoints[1].x += 1;
    scenario.receivers.X.releaseDelay = 0.7;
    scenario.defenders.CBL.x = 17;
    scenario.defenders.CBL.cushion = 2;
    scenario.defenders.CBL.assignment.leverage = "Custom leverage";
    scenario.releaseTime = 1.8;
    scenario.pressureTime = 4.2;
    scenario.lineup = importTeam(createScenario(), teamId).lineup;
    const before = structuredClone(scenario);
    const imported = importTeam(freeze(scenario), teamId);
    expect(scenario).toEqual(before);
    const { lineup, receivers, defenders, ...rest } = imported;
    const { lineup: oldLineup, receivers: oldReceivers, defenders: oldDefenders, ...oldRest } = before;
    expect(rest).toEqual(oldRest);
    expect(lineup).not.toBe(oldLineup);
    for (const [id, settings] of Object.entries(receivers)) {
      expect(settings).toEqual({ ...oldReceivers[id], speed: lineup![id].ratings.speed });
    }
    for (const [id, settings] of Object.entries(defenders)) {
      expect(settings).toEqual({ ...oldDefenders[id], ratings: lineup![id].ratings });
    }
    imported.routes[0].waypoints[0].x = 3;
    imported.profileSnapshot!.ratings.speed = 0;
    expect(scenario).toEqual(before);
    expect(() => importTeam(scenario, "unknown-team")).toThrow("Unknown team");
    expect(scenario).toEqual(before);
  });

  it("round trips imported scenarios and lineup profiles through the workspace backup codec", () => {
    const workspace = emptyWorkspace();
    const scenario = importTeam(createScenario(), teamId);
    workspace.scenarios = [scenario];
    workspace.playerProfiles = Object.values(scenario.lineup!);
    expect(decodeBackup(encodeBackup(workspace))).toEqual(workspace);
  });
});

describe("five illustrative skill dimensions", () => {
  const lineup = importTeam(createScenario(), teamId).lineup!;
  it("returns the five labels and source-backed movement and awareness values", () => {
    for (const profile of Object.values(lineup)) {
      const summary = playerSkillSummary(profile);
      expect(summary).toHaveLength(5);
      expect(summary.slice(0, 4)).toEqual([
        { label: "Speed", value: profile.ratings.speed },
        { label: "Acceleration", value: profile.ratings.acceleration },
        { label: "Change of direction", value: profile.ratings.changeOfDirection },
        { label: "Awareness", value: profile.attributes!.awareness },
      ]);
      expect(summary[4].label).toBe("Technique");
      expect(summary.every((d) => Number.isFinite(d.value) && d.value >= 0 && d.value <= 100)).toBe(true);
    }
  });

  it("uses role-specific technique for the QB, center, and every receiver", () => {
    expect(playerSkillSummary(lineup.QB)[4].value).toBe(lineup.QB.attributes!.throwAccuracy);
    expect(playerSkillSummary(lineup.C)[4].value).toBe(lineup.C.attributes!.passBlock);
    for (const id of ["X", "Z", "H", "Y", "RB"]) {
      expect(playerSkillSummary(lineup[id])[4].value).toBe(lineup[id].attributes!.routeRunning);
    }
  });

  it("uses defensive man/zone technique and the mean for spy, rush, or no assignment", () => {
    for (const id of ["CBL", "CBR", "A", "SL", "SR", "M", "W"]) {
      const p = lineup[id];
      expect(playerSkillSummary(p, "man")[4].value).toBe(p.ratings.manCoverage);
      expect(playerSkillSummary(p, "zone")[4].value).toBe(p.ratings.zoneDiscipline);
      for (const type of [undefined, "spy", "rush"] as const) {
        expect(playerSkillSummary(p, type)[4].value).toBe(average(p.ratings.manCoverage, p.ratings.zoneDiscipline));
      }
    }
  });

  it("handles existing profiles without optional attributes or positions without mutation", () => {
    const profile: PlayerProfile = {
      id: "legacy", name: "Illustrative", side: "both", ratings: newProfile().ratings,
      releaseDelay: 0, notes: "",
    };
    profile.ratings.reaction = 61;
    const before = structuredClone(profile);
    expect(playerSkillSummary(freeze(profile))[3].value).toBe(61);
    expect(playerSkillSummary(profile)[4].value).toBe(50);
    expect(profile).toEqual(before);
    expect(playerSkillSummary({ ...profile, positions: "QB" })[4].value).toBe(50);
  });
});
