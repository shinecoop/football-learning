import { it, expect } from "vitest";
import {
  emptyWorkspace,
  encodeBackup,
  decodeBackup,
  parseFilm,
  parsePlayerProfile,
  parseScenario,
} from "../src/lib/workspace-codec";
import { createScenario, newProfile } from "../src/domain/sandbox";
const player = {
  id: "player-one",
  name: "Avery",
  side: "offense" as const,
  ratings: newProfile().ratings,
  releaseDelay: 0,
  notes: "",
};
it("round trips games, lineup snapshots, players, and film metadata with old backups compatible", () => {
  const data = emptyWorkspace();
  data.playerProfiles = [player];
  data.games = [
    {
      id: "game-one",
      name: "Friday",
      opponent: "North",
      scenario: { ...createScenario(), lineup: { X: player } },
      updatedAt: new Date().toISOString(),
    },
  ];
  data.films = [
    {
      id: "film-smash",
      lessonId: "smash",
      title: "Smash",
      cameras: [
        {
          id: "camera-one",
          label: "Sideline",
          local: true,
          source: "media-one",
          offset: 0,
          focus: [],
        },
      ],
    },
  ];
  expect(decodeBackup(encodeBackup(data))).toEqual(data);
  const { games, films, playerProfiles, ...old } = data;
  expect(decodeBackup(JSON.stringify(old)).games).toEqual([]);
  expect(games.length + films.length + playerProfiles.length).toBe(3);
});
it("rejects invalid player ratings and mixed-side lineup assignments", () => {
  expect(() =>
    parsePlayerProfile({
      ...player,
      ratings: { ...player.ratings, speed: 101 },
    }),
  ).toThrow();
  expect(() =>
    parseScenario({ ...createScenario(), lineup: { CBL: player } }),
  ).toThrow();
});
it("rejects executable URLs, YouTube embeds, and malformed focus ranges", () => {
  const camera = {
    id: "view-one",
    label: "Sideline",
    source: "https://example.com/clip.mp4",
    local: false,
    offset: 0,
    focus: [],
  };
  const film = {
    id: "film-one",
    lessonId: "smash",
    title: "Smash",
    cameras: [camera],
  };
  expect(parseFilm(film)).toEqual(film);
  for (const source of [
    "javascript:alert(1)",
    "https://youtube.com/watch?v=abc",
    "https://youtu.be/abc",
  ])
    expect(() =>
      parseFilm({ ...film, cameras: [{ ...camera, source }] }),
    ).toThrow();
  expect(() =>
    parseFilm({
      ...film,
      cameras: [
        {
          ...camera,
          focus: [
            { id: "focus-one", label: "X", start: 5, end: 2, x: 50, y: 50 },
          ],
        },
      ],
    }),
  ).toThrow();
});

it("preserves two-way player skills in offense and defensive snapshots", () => {
  const athlete = {
    ...player,
    side: "both",
    positions: "WR / CB",
    attributes: { strength: 72, catching: 85, tackling: 78 },
  };
  const parsed = parsePlayerProfile(athlete);
  expect(parsed.attributes?.catching).toBe(85);
  expect(parsed.attributes?.tackling).toBe(78);
  expect(parsed.attributes?.passBlock).toBe(50);
  const scenario = parseScenario({
    ...createScenario(),
    lineup: { X: parsed, CBL: parsed },
  });
  expect(scenario.lineup?.X).toEqual(scenario.lineup?.CBL);
  expect(() =>
    parsePlayerProfile({ ...athlete, attributes: { strength: -1 } }),
  ).toThrow();
});
