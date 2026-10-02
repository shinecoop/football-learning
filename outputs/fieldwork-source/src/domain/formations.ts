import type { Formation, PlayerAlignment, PersonnelPackage } from "./types";
const p = (
  id: string,
  x: number,
  y: number,
  position: string,
): PlayerAlignment => ({ id, label: id, x, y, position, side: "offense" });
export const line = [
  p("LT", 40, 72, "OL"),
  p("LG", 45, 72, "OL"),
  p("C", 50, 72, "OL"),
  p("RG", 55, 72, "OL"),
  p("RT", 60, 72, "OL"),
];
const make = (
  id: string,
  name: string,
  description: string,
  skill: PlayerAlignment[],
  personnel = "11",
): Formation => ({
  id,
  name,
  description,
  players: [...line, ...skill],
  personnel,
});
export const formations: Formation[] = [
  make(
    "2x2",
    "2 × 2 spread",
    "Two eligible receivers on either side. This describes the distribution, not the personnel.",
    [
      p("X", 12, 72, "WR"),
      p("H", 28, 75, "WR"),
      p("Y", 72, 75, "TE"),
      p("Z", 88, 72, "WR"),
      p("QB", 50, 83, "QB"),
      p("RB", 59, 85, "RB"),
    ],
  ),
  make(
    "trips",
    "Trips / 3 × 1",
    "Three eligible receivers to one side can stress coverage distribution.",
    [
      p("X", 12, 72, "WR"),
      p("H", 68, 75, "WR"),
      p("Y", 78, 75, "TE"),
      p("Z", 90, 72, "WR"),
      p("QB", 50, 83, "QB"),
      p("RB", 40, 85, "RB"),
    ],
  ),
  make(
    "bunch",
    "Bunch",
    "A compact three-receiver cluster creates release and communication problems.",
    [
      p("X", 12, 72, "WR"),
      p("H", 73, 76, "WR"),
      p("Y", 77, 71, "TE"),
      p("Z", 81, 76, "WR"),
      p("QB", 50, 83, "QB"),
      p("RB", 40, 85, "RB"),
    ],
  ),
  make(
    "empty",
    "Empty",
    "Five eligible receivers spread out; no running back in the backfield.",
    [
      p("X", 10, 72, "WR"),
      p("H", 25, 76, "WR"),
      p("RB", 70, 76, "RB"),
      p("Y", 79, 76, "TE"),
      p("Z", 91, 72, "WR"),
      p("QB", 50, 83, "QB"),
    ],
  ),
  make(
    "shotgun",
    "Shotgun",
    "The quarterback receives the snap several yards behind the center.",
    [
      p("X", 12, 72, "WR"),
      p("H", 28, 75, "WR"),
      p("Y", 65, 72, "TE"),
      p("Z", 88, 72, "WR"),
      p("QB", 50, 83, "QB"),
      p("RB", 40, 85, "RB"),
    ],
  ),
  make(
    "singleback",
    "Singleback",
    "One back behind an under-center quarterback. Receivers can align in many distributions.",
    [
      p("X", 12, 72, "WR"),
      p("H", 28, 75, "WR"),
      p("Y", 65, 72, "TE"),
      p("Z", 88, 72, "WR"),
      p("QB", 50, 77, "QB"),
      p("RB", 50, 90, "RB"),
    ],
  ),
  make(
    "i",
    "I formation",
    "Two backs aligned behind an under-center quarterback.",
    [
      p("X", 12, 72, "WR"),
      p("Y", 65, 72, "TE"),
      p("Z", 88, 72, "WR"),
      p("QB", 50, 77, "QB"),
      p("FB", 50, 84, "RB"),
      p("RB", 50, 93, "RB"),
    ],
    "21",
  ),
  make(
    "pistol",
    "Pistol",
    "A short shotgun snap with the back aligned behind the quarterback.",
    [
      p("X", 12, 72, "WR"),
      p("H", 28, 75, "WR"),
      p("Y", 65, 72, "TE"),
      p("Z", 88, 72, "WR"),
      p("QB", 50, 82, "QB"),
      p("RB", 50, 92, "RB"),
    ],
  ),
  make(
    "condensed",
    "Condensed splits",
    "Narrow receiver splits create room outside and change leverage.",
    [
      p("X", 25, 72, "WR"),
      p("H", 33, 76, "WR"),
      p("Y", 67, 76, "TE"),
      p("Z", 75, 72, "WR"),
      p("QB", 50, 83, "QB"),
      p("RB", 40, 85, "RB"),
    ],
  ),
];
export const personnel: PersonnelPackage[] = [
  {
    id: "10",
    name: "10 personnel",
    rb: 1,
    te: 0,
    wr: 4,
    description:
      "Four wide receivers give the offense spread spacing. A back may flex out; the package counts personnel, not alignment.",
    formations: ["2x2", "empty"],
  },
  {
    id: "11",
    name: "11 personnel",
    rb: 1,
    te: 1,
    wr: 3,
    description:
      "One back and one tight end offer a mix of spread passing and attached run surfaces.",
    formations: ["shotgun", "trips", "bunch"],
  },
  {
    id: "12",
    name: "12 personnel",
    rb: 1,
    te: 2,
    wr: 2,
    description:
      "Two tight ends can create additional gaps or detach to test defensive matchups.",
    formations: ["singleback", "shotgun"],
  },
  {
    id: "21",
    name: "21 personnel",
    rb: 2,
    te: 1,
    wr: 2,
    description:
      "Two backs and a tight end can build lead runs and play-action. Both backs need not stay in the backfield.",
    formations: ["i", "pistol"],
  },
];
export function personnelFormation(id: string): Formation {
  const pack = personnel.find((p) => p.id === id) ?? personnel[1];
  const base = structuredClone(
    formations.find((f) => f.id === pack.formations[0])!,
  );
  const skill = base.players.filter((p) =>
    ["WR", "TE", "RB"].includes(p.position),
  );
  const roles = [
    ...Array(pack.wr).fill("WR"),
    ...Array(pack.te).fill("TE"),
    ...Array(pack.rb).fill("RB"),
  ];
  skill.forEach((player) => {
    const index = roles.indexOf(player.position);
    if (index >= 0) roles.splice(index, 1);
    else player.position = "pending";
  });
  skill
    .filter((player) => player.position === "pending")
    .forEach((player) => {
      player.position = roles.shift()!;
    });
  return { ...base, personnel: id };
}
