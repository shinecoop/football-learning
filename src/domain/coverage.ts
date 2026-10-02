import type {
  Coverage,
  CoverageAssignment,
  CoverageZone,
  Defender,
  Point,
} from "./types";
const d = (id: string, x: number, y: number, position: string): Defender => ({
  id,
  label: id,
  position,
  side: "defense",
  x,
  y,
});
const base = [
  d("E", 38, 67, "DL"),
  d("T", 46, 67, "DL"),
  d("N", 55, 67, "DL"),
  d("J", 63, 67, "DL"),
  d("W", 39, 56, "LB"),
  d("M", 54, 56, "LB"),
  d("A", 72, 57, "DB"),
];
const cb = [d("CBL", 12, 59, "CB"), d("CBR", 88, 59, "CB")];
const zone = (
  id: string,
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
  deep = false,
): CoverageZone => ({
  id: `z-${id}`,
  defenderId: id,
  name,
  x,
  y,
  width,
  height,
  deep,
});
const assignment = (
  id: string,
  type: CoverageAssignment["type"],
  destination: Point,
  responsibility: string,
  targetId?: string,
): CoverageAssignment => ({
  defenderId: id,
  type,
  destination,
  responsibility,
  targetId,
  leverage:
    type === "man"
      ? "Maintain leverage according to help and the call."
      : "Keep vision on threats entering your responsibility.",
});
const deep2 = [
  zone("SL", "Deep half", 4, 8, 46, 36, true),
  zone("SR", "Deep half", 50, 8, 46, 36, true),
];
const under = [
  zone("CBL", "Flat", 3, 46, 22, 21),
  zone("W", "Hook / curl", 26, 44, 22, 22),
  zone("M", "Hook / curl", 48, 44, 23, 22),
  zone("A", "Curl / flat", 71, 44, 26, 23),
];
const deep3 = [
  zone("CBL", "Outside third", 3, 8, 30, 35, true),
  zone("SL", "Middle third", 34, 8, 32, 35, true),
  zone("CBR", "Outside third", 67, 8, 30, 35, true),
];
const quarters = [
  zone("CBL", "Outside quarter", 3, 8, 23, 35, true),
  zone("SL", "Inside quarter", 27, 8, 23, 35, true),
  zone("SR", "Inside quarter", 51, 8, 23, 35, true),
  zone("CBR", "Outside quarter", 75, 8, 22, 35, true),
];
const definitions = [
  {
    id: "cover0",
    name: "Cover 0",
    shell: "No deep safety",
    summary:
      "Man coverage with no dedicated deep safety. Extra defenders can pressure; the rush count depends on the call.",
    zones: [] as CoverageZone[],
    safeties: [d("SL", 28, 58, "DB"), d("SR", 65, 58, "DB")],
    man: true,
  },
  {
    id: "cover1",
    name: "Cover 1",
    shell: "One-high shell",
    summary:
      "Man coverage underneath with a middle-of-field safety and one low-hole helper in this example.",
    zones: [
      zone("SL", "Deep middle", 22, 7, 56, 35, true),
      zone("M", "Low hole", 37, 43, 27, 19),
    ],
    safeties: [d("SL", 50, 24, "S"), d("SR", 30, 57, "S")],
    man: true,
  },
  {
    id: "robber",
    name: "Cover 1 Robber",
    shell: "Two-high → one-high",
    summary:
      "A safety rotates into the low hole to rob in-breaking routes, while the other holds the deep middle.",
    zones: [
      zone("SL", "Deep middle", 22, 7, 56, 35, true),
      zone("SR", "Robber", 36, 43, 28, 20),
    ],
    safeties: [d("SL", 38, 27, "S"), d("SR", 64, 27, "S")],
    man: true,
  },
  {
    id: "cover2",
    name: "Cover 2",
    shell: "Two-high shell",
    summary:
      "Two deep halves with five underneath defenders in this spot-drop teaching example.",
    zones: [
      ...deep2,
      ...under.filter((z) => z.defenderId !== "A"),
      zone("A", "Hook / curl", 66, 44, 14, 22),
      zone("CBR", "Flat", 80, 46, 17, 21),
    ],
    safeties: [d("SL", 32, 27, "S"), d("SR", 68, 27, "S")],
    man: false,
  },
  {
    id: "tampa2",
    name: "Tampa 2",
    shell: "Two-high shell",
    summary:
      "Two deep halves with the middle linebacker carrying the middle seam. Underneath windows change as the Mike gains depth.",
    zones: [
      ...deep2,
      ...under.filter((z) => z.defenderId !== "M" && z.defenderId !== "A"),
      zone("M", "Middle run-through", 43, 26, 14, 29, true),
      zone("A", "Hook / curl", 65, 44, 15, 22),
      zone("CBR", "Flat", 80, 46, 17, 21),
    ],
    safeties: [d("SL", 32, 27, "S"), d("SR", 68, 27, "S")],
    man: false,
  },
  {
    id: "cover3",
    name: "Cover 3",
    shell: "One-high shell",
    summary:
      "Three deep thirds with four underneath defenders. This example uses spot-drop landmarks rather than match rules.",
    zones: [
      ...deep3,
      zone("SR", "Curl / flat", 3, 44, 24, 22),
      ...under.filter((z) => ["W", "M", "A"].includes(z.defenderId)),
    ],
    safeties: [d("SL", 50, 24, "S"), d("SR", 28, 51, "S")],
    man: false,
  },
  {
    id: "buzz",
    name: "Cover 3 Buzz",
    shell: "Two-high → one-high",
    summary:
      "A safety rotates into a hook area rather than the flat. The remaining defenders distribute the underneath zones.",
    zones: [
      ...deep3,
      zone("W", "Curl / flat", 3, 44, 24, 22),
      zone("SR", "Buzz / hook", 27, 43, 22, 23),
      zone("M", "Hook / curl", 49, 44, 22, 22),
      zone("A", "Curl / flat", 71, 44, 26, 23),
    ],
    safeties: [d("SL", 38, 27, "S"), d("SR", 64, 27, "S")],
    man: false,
  },
  {
    id: "cover4",
    name: "Cover 4 / Quarters",
    shell: "Two-high shell",
    summary:
      "Four deep quarters and three underneath zones in this introductory spot-drop model. Match quarters requires receiver-distribution rules and is not identical.",
    zones: [
      ...quarters,
      zone("W", "Flat", 3, 45, 28, 22),
      zone("M", "Hook", 32, 43, 36, 23),
      zone("A", "Flat", 69, 45, 28, 22),
    ],
    safeties: [d("SL", 36, 27, "S"), d("SR", 64, 27, "S")],
    man: false,
  },
  {
    id: "cover6",
    name: "Cover 6",
    shell: "Quarter-quarter-half",
    summary:
      "Quarter-quarter coverage to the left and a deep half to the right in this example. The quarter side often goes to the passing strength, depending on the call.",
    zones: [
      ...quarters.filter((z) => ["CBL", "SL"].includes(z.defenderId)),
      zone("SR", "Deep half", 51, 8, 46, 35, true),
      zone("W", "Flat", 3, 45, 28, 22),
      zone("M", "Hook", 32, 43, 25, 23),
      zone("A", "Hook / curl", 58, 44, 20, 22),
      zone("CBR", "Flat", 79, 46, 18, 21),
    ],
    safeties: [d("SL", 36, 27, "S"), d("SR", 69, 27, "S")],
    man: false,
  },
];
export const coverages: Coverage[] = definitions.map((def) => {
  const defenders = [...base, ...cb, ...def.safeties];
  const assignments: CoverageAssignment[] = defenders.map((player) => {
    if (player.position === "DL")
      return assignment(
        player.id,
        "rush",
        { x: player.x + (50 - player.x) * 0.3, y: 83 },
        "Rush with lane integrity; this is a schematic path, not a pass-rush prediction.",
      );
    const z = def.zones.find((z) => z.defenderId === player.id);
    if (z)
      return assignment(
        player.id,
        "zone",
        { x: z.x + z.width / 2, y: z.y + z.height / 2 },
        `Protect the ${z.name.toLowerCase()}. Relate to receivers entering the area; landmarks are teaching aids, not walls.`,
      );
    const targets: Record<string, string> = {
      CBL: "X",
      CBR: "Z",
      SR: "H",
      A: "Y",
      W: "RB",
      M: "RB",
      SL: "H",
    };
    return assignment(
      player.id,
      "man",
      { x: player.x, y: player.y - 14 },
      `Carry ${targets[player.id]} in man coverage. Exact leverage and switch rules depend on the call.`,
      targets[player.id],
    );
  });
  if (def.id === "cover0") {
    for (const id of ["M", "SL"]) {
      const m = assignments.find((a) => a.defenderId === id)!;
      Object.assign(m, {
        type: "rush",
        targetId: undefined,
        destination: { x: id === "M" ? 50 : 40, y: 83 },
        responsibility:
          "Added pressure. No dedicated deep safety remains in this six-rusher example.",
      });
    }
  }
  if (def.id === "robber") {
    const m = assignments.find((a) => a.defenderId === "M")!;
    Object.assign(m, {
      type: "man",
      targetId: "H",
      responsibility: "Carry H while the rotating safety helps inside.",
    });
  }
  return {
    id: def.id,
    name: def.name,
    shell: def.shell,
    summary: def.summary,
    rotation:
      def.id === "robber"
        ? "SR rotates to the low hole"
        : def.id === "buzz"
          ? "SR rotates to the hook area"
          : undefined,
    defenders,
    assignments,
    zones: def.zones,
  };
});
