import type {
  BlockingAssignment,
  DefensiveFront,
  Defender,
  RunConcept,
  Protection,
  Motion,
} from "./types";
const d = (id: string, x: number, y: number, position = "DL"): Defender => ({
  id,
  label: id,
  side: "defense",
  position,
  x,
  y,
});
export const fronts: DefensiveFront[] = [
  {
    id: "over",
    name: "4–2–5 Over",
    description:
      "A four-down front with a three-technique to the declared strength in this example.",
    defenders: [
      d("E", 36, 67),
      d("N", 47, 67),
      d("T", 57, 67),
      d("J", 65, 67),
      d("W", 42, 56, "LB"),
      d("M", 56, 56, "LB"),
      d("A", 73, 57, "DB"),
    ],
  },
  {
    id: "under",
    name: "4–2–5 Under",
    description: "The three-technique is away from the declared strength.",
    defenders: [
      d("E", 36, 67),
      d("T", 43, 67),
      d("N", 53, 67),
      d("J", 65, 67),
      d("W", 40, 56, "LB"),
      d("M", 58, 56, "LB"),
      d("A", 73, 57, "DB"),
    ],
  },
  {
    id: "odd",
    name: "Odd",
    description:
      "Three down linemen with two stand-up edges in this teaching look.",
    defenders: [
      d("E", 40, 67),
      d("N", 50, 67),
      d("J", 60, 67),
      d("W", 42, 55, "LB"),
      d("M", 58, 55, "LB"),
      d("A", 70, 66, "LB"),
      d("B", 30, 66, "LB"),
    ],
  },
  {
    id: "bear",
    name: "Bear",
    description:
      "Interior linemen cover the center and both guards, restricting easy interior combinations.",
    defenders: [
      d("E", 34, 67),
      d("T", 45, 67),
      d("N", 50, 67),
      d("J", 55, 67),
      d("A", 66, 67),
      d("W", 42, 55, "LB"),
      d("M", 58, 55, "LB"),
    ],
  },
  {
    id: "tite",
    name: "Tite / Mint",
    description:
      "A nose and two 4i techniques reduce the interior gaps. Labels and personnel vary.",
    defenders: [
      d("E", 42, 67),
      d("N", 50, 67),
      d("J", 58, 67),
      d("W", 40, 54, "LB"),
      d("M", 60, 54, "LB"),
      d("A", 73, 59, "DB"),
      d("B", 27, 59, "DB"),
    ],
  },
];
const block = (
  playerId: string,
  targetId: string,
  type: BlockingAssignment["type"],
  description: string,
  waypoints: number[][],
): BlockingAssignment => ({
  playerId,
  targetId,
  type,
  description,
  waypoints: waypoints.map(([x, y]) => ({ x, y })),
});
const zoneBlocks = [
  block(
    "LT",
    "E",
    "block",
    "Reach or drive the playside gap threat. Footwork and aiming point vary.",
    [
      [40, 72],
      [38, 67],
    ],
  ),
  block(
    "LG",
    "N",
    "combo",
    "Work with C on the nose; one blocker climbs when linebacker leverage permits.",
    [
      [45, 72],
      [47, 67],
    ],
  ),
  block(
    "C",
    "W",
    "climb",
    "Secure the nose with LG before climbing to the backside linebacker.",
    [
      [50, 72],
      [47, 67],
      [42, 56],
    ],
  ),
  block(
    "RG",
    "T",
    "block",
    "Control the three-technique; avoid penetration into the back’s track.",
    [
      [55, 72],
      [57, 67],
    ],
  ),
  block("RT", "J", "block", "Account for the playside edge.", [
    [60, 72],
    [65, 67],
  ]),
  block(
    "Y",
    "M",
    "climb",
    "An attached tight end may help the edge and climb; this is one simplified allocation.",
    [
      [65, 72],
      [66, 66],
      [56, 56],
    ],
  ),
];
export const runs: RunConcept[] = [
  {
    id: "inside-zone",
    name: "Inside Zone",
    summary:
      "Covered and uncovered linemen work combinations, then climb as the back presses an interior track.",
    key: "Press the playside interior track; read the first down lineman beyond the center. Exact read rules vary.",
    blocks: zoneBlocks,
    backPath: {
      playerId: "RB",
      routeType: "back path",
      waypoints: [
        { x: 40, y: 85 },
        { x: 48, y: 80 },
        { x: 54, y: 68 },
        { x: 55, y: 51 },
      ],
    },
  },
  {
    id: "outside-zone",
    name: "Outside Zone",
    summary:
      "Stretch the front laterally. The back presses a wide landmark before choosing a crease.",
    key: "Press a wide landmark; many systems teach bounce, bang, or bend based on the edge and next inside defender.",
    blocks: zoneBlocks.map((b) => ({
      ...b,
      waypoints: b.waypoints.map((p) => ({ x: p.x + 5, y: p.y })),
      description:
        "Reach the playside threat and sustain lateral leverage. Combinations and climbs depend on the front.",
    })),
    backPath: {
      playerId: "RB",
      routeType: "back path",
      waypoints: [
        { x: 40, y: 85 },
        { x: 55, y: 81 },
        { x: 73, y: 69 },
        { x: 78, y: 49 },
      ],
    },
  },
  {
    id: "duo",
    name: "Duo",
    summary:
      "Vertical double teams create displacement while the back reads linebacker leverage.",
    key: "In one common teaching, read the Mike and press the interior gap. Duo is not simply inside zone without lateral steps.",
    blocks: zoneBlocks.map((b) => ({
      ...b,
      type: b.playerId === "RG" || b.playerId === "LG" ? "combo" : b.type,
      description:
        "Generate vertical displacement through a double team, then release based on linebacker movement.",
    })),
    backPath: {
      playerId: "RB",
      routeType: "back path",
      waypoints: [
        { x: 40, y: 85 },
        { x: 50, y: 79 },
        { x: 53, y: 66 },
        { x: 49, y: 50 },
      ],
    },
  },
  {
    id: "power",
    name: "Power",
    summary:
      "Down blocks build a wall. A backside guard pulls into the playside gap.",
    key: "Follow the pulling guard inside the kick-out. The kick-out player and aiming points differ by formation.",
    blocks: [
      block(
        "LT",
        "E",
        "block",
        "Protect the backside B gap; hinge for the edge threat.",
        [
          [40, 72],
          [37, 68],
        ],
      ),
      block(
        "LG",
        "M",
        "pull",
        "Backside guard pulls behind the line and leads through the playside gap.",
        [
          [45, 72],
          [45, 79],
          [63, 79],
          [62, 58],
        ],
      ),
      block(
        "C",
        "N",
        "block",
        "Block back on the nose to protect the puller’s departure.",
        [
          [50, 72],
          [47, 67],
        ],
      ),
      block(
        "RG",
        "T",
        "combo",
        "Work a vertical double with RT; climb when the down lineman is secured.",
        [
          [55, 72],
          [57, 67],
          [56, 56],
        ],
      ),
      block("RT", "T", "combo", "Secure the inside down lineman with RG.", [
        [60, 72],
        [57, 67],
      ]),
      block(
        "Y",
        "J",
        "block",
        "Kick out the edge in this one-back implementation. Against a spill technique, the ball may bounce.",
        [
          [65, 72],
          [68, 66],
        ],
      ),
    ],
    backPath: {
      playerId: "RB",
      routeType: "back path",
      waypoints: [
        { x: 40, y: 85 },
        { x: 54, y: 83 },
        { x: 63, y: 73 },
        { x: 62, y: 51 },
      ],
    },
  },
  {
    id: "counter",
    name: "Counter",
    summary:
      "An initial step away delays pursuit before pullers create the playside entry.",
    key: "Take the counter step, then follow the wrap player. This example represents a GT family structure.",
    blocks: [
      ...zoneBlocks.filter((b) => !["LG", "LT"].includes(b.playerId)),
      block("LG", "J", "pull", "Backside guard pulls to kick the edge.", [
        [45, 72],
        [44, 79],
        [67, 79],
        [68, 66],
      ]),
      block(
        "LT",
        "M",
        "pull",
        "Backside tackle wraps through the entry behind the kick-out.",
        [
          [40, 72],
          [39, 82],
          [61, 82],
          [61, 57],
        ],
      ),
    ],
    backPath: {
      playerId: "RB",
      routeType: "back path",
      waypoints: [
        { x: 40, y: 85 },
        { x: 35, y: 87 },
        { x: 52, y: 83 },
        { x: 62, y: 70 },
        { x: 61, y: 50 },
      ],
    },
  },
];
export function blocksAgainstFront(
  run: RunConcept,
  front: DefensiveFront,
): BlockingAssignment[] {
  return run.blocks.map((b) => {
    const target =
      front.defenders.find((d) => d.id === b.targetId) ??
      front.defenders
        .filter((d) => d.position === "DL")
        .sort(
          (a, c) =>
            Math.abs(a.x - b.waypoints.at(-1)!.x) -
            Math.abs(c.x - b.waypoints.at(-1)!.x),
        )[0];
    return {
      ...b,
      targetId: target.id,
      waypoints: b.waypoints.map((p, i) =>
        i === b.waypoints.length - 1 ? { x: target.x, y: target.y } : p,
      ),
      description: `${b.description} Current landmark: ${target.id}. Front changes require a new declaration and combination plan; this is a simplified teaching allocation.`,
    };
  });
}
const half = [
  block(
    "LT",
    "E",
    "block",
    "Slide left: protect the outside gap and take the edge.",
    [
      [40, 72],
      [37, 67],
    ],
  ),
  block(
    "LG",
    "W",
    "block",
    "Slide left: protect the B gap; exchange inside threats with the center.",
    [
      [45, 72],
      [43, 66],
    ],
  ),
  block(
    "C",
    "N",
    "block",
    "Slide left: protect the left A gap. Inside threats come first.",
    [
      [50, 72],
      [47, 67],
    ],
  ),
  block("RG", "T", "block", "Man side: block the declared down lineman.", [
    [55, 72],
    [57, 67],
  ]),
  block("RT", "J", "block", "Man side: take the right edge.", [
    [60, 72],
    [65, 67],
  ]),
  block(
    "RB",
    "M",
    "block",
    "Scan inside-out on the man side, beginning with the declared Mike.",
    [
      [40, 85],
      [53, 78],
      [56, 64],
    ],
  ),
];
export const halfSlide: Protection = {
  id: "half-slide",
  name: "Half Slide",
  summary:
    "Three linemen slide left; the right guard and tackle use man assignments. The back scans inside-out on the man side in this six-man example.",
  mikeId: "M",
  blocks: half,
  pressureBlocks: half,
  rushers: ["E", "N", "T", "J"],
  pressureRushers: ["E", "N", "T", "J", "M", "A"],
  freeRusher: "A",
};
export const motions: Motion[] = [
  {
    id: "motion-vs-shift",
    name: "Motion vs Shift",
    playerId: "H",
    waypoints: [
      { x: 28, y: 75 },
      { x: 49, y: 77 },
      { x: 75, y: 77 },
    ],
    teaching:
      "Motion involves a player moving at the snap. A shift changes alignment before players reset. At the snap, one eligible player may be in legal lateral or backward motion; shift/set details depend on the ruleset.",
  },
  {
    id: "diagnostic-motion",
    name: "Motion as a Diagnostic Tool",
    playerId: "H",
    waypoints: [
      { x: 28, y: 75 },
      { x: 49, y: 77 },
      { x: 75, y: 77 },
    ],
    teaching:
      "A defender traveling with a receiver can suggest man responsibility. A bump or zone exchange can suggest zone. Motion is evidence, not proof: defenses disguise and use checks.",
  },
  {
    id: "leverage-motion",
    name: "Motion to Create Leverage and Speed",
    playerId: "H",
    waypoints: [
      { x: 28, y: 75 },
      { x: 49, y: 77 },
      { x: 85, y: 77 },
    ],
    teaching:
      "Lateral motion can create a running start, change the strength, and improve a release angle. It must remain legal at the snap and fit the timing of the play.",
  },
];

export const protections: Protection[] = [
  halfSlide,
  {
    id: "full-slide",
    name: "Full Slide",
    summary:
      "All five linemen work gap responsibility to the left. The back handles the right edge away from the slide in this six-man example.",
    mikeId: "M",
    blocks: [
      block("LT", "E", "block", "Slide left: secure the left edge threat.", [
        [40, 72],
        [36, 67],
      ]),
      block(
        "LG",
        "W",
        "block",
        "Slide left: protect the left B gap and exchange an added threat.",
        [
          [45, 72],
          [42, 66],
        ],
      ),
      block(
        "C",
        "N",
        "block",
        "Slide left: protect the left A gap; take the nose entering it.",
        [
          [50, 72],
          [47, 67],
        ],
      ),
      block(
        "RG",
        "M",
        "block",
        "Slide left: protect the right A gap and exchange inside threats.",
        [
          [55, 72],
          [51, 66],
        ],
      ),
      block("RT", "T", "block", "Slide left: secure the right B gap threat.", [
        [60, 72],
        [57, 67],
      ]),
      block(
        "RB",
        "J",
        "block",
        "Away from the slide: account for the right edge. Exact back technique varies.",
        [
          [40, 85],
          [55, 80],
          [65, 70],
        ],
      ),
    ],
    pressureBlocks: [],
    rushers: ["E", "N", "T", "J"],
    pressureRushers: [],
  },
  {
    id: "big-on-big",
    name: "Big on Big",
    summary:
      "Linemen match the four declared down defenders plus the Mike in this man-oriented count. The back scans the remaining inside linebacker.",
    mikeId: "M",
    blocks: [
      block("LT", "E", "block", "Man responsibility: declared left edge E.", [
        [40, 72],
        [36, 67],
      ]),
      block(
        "LG",
        "N",
        "block",
        "Man responsibility: nose N; protect inside leverage.",
        [
          [45, 72],
          [47, 67],
        ],
      ),
      block(
        "C",
        "M",
        "block",
        "Account for the declared Mike in this five-man count; help inside when he drops.",
        [
          [50, 72],
          [53, 65],
        ],
      ),
      block("RG", "T", "block", "Man responsibility: down defender T.", [
        [55, 72],
        [57, 67],
      ]),
      block("RT", "J", "block", "Man responsibility: right edge J.", [
        [60, 72],
        [65, 67],
      ]),
      block(
        "RB",
        "W",
        "block",
        "Scan W inside-out. Staffs differ in their count and scan rules.",
        [
          [40, 85],
          [42, 67],
        ],
      ),
    ],
    pressureBlocks: [],
    rushers: ["E", "N", "T", "J"],
    pressureRushers: [],
  },
];
