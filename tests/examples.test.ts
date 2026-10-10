import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import {
  decodeBackup,
  decodeDesignerPlay,
  parseProfile,
  parseScenario,
} from "../src/lib/workspace-codec";
const read = (file: string) => readFileSync(`examples/${file}`, "utf8");
describe("published starter files", () => {
  it("imports the workspace sample without fabricated learning or measured profiles", () => {
    const data = decodeBackup(read("workspace-backup.json"));
    expect(data.scenarios).toHaveLength(1);
    expect(data.plays).toHaveLength(1);
    expect(data.progress.lessons).toEqual({});
    expect(data.progress.training.attempts).toBe(0);
    expect(
      data.profiles.every(
        (p) => p.confidence === "unrated" && p.observations.length === 0,
      ),
    ).toBe(true);
  });
  it("imports the original-format designer play", () => {
    const play = decodeDesignerPlay(
      read("designer-play.json"),
      "sample-import",
      "2026-10-08T12:00:00Z",
    );
    expect(play.players).toHaveLength(11);
    expect(play.routes).toHaveLength(2);
  });
  it("keeps standalone scenario and profile examples consistent with the workspace", () => {
    const data = decodeBackup(read("workspace-backup.json"));
    expect(parseScenario(JSON.parse(read("sandbox-scenario.json")))).toEqual(
      data.scenarios[0],
    );
    expect(parseProfile(JSON.parse(read("opponent-profile.json")))).toEqual(
      data.profiles[0],
    );
  });
});
