import type { CurriculumCategory, Lesson, TeachingPoint } from "./types";
import { concepts } from "./concepts";
import { coverages } from "./coverage";
import { formations, personnel } from "./formations";
import { runs, motions } from "./runs";
export const categories: CurriculumCategory[] = [
  ...Object.entries({
    passing: [
      "Passing concepts",
      "Understand route spacing, progressions, and the defender in conflict.",
      "route",
    ],
    running: [
      "Run game",
      "Learn how blocks, fronts, and back paths create a crease.",
      "run",
    ],
    protection: [
      "Pass protection",
      "Build a pocket by identifying threats and protecting inside out.",
      "shield",
    ],
    motion: [
      "Motion strategy",
      "Use movement to gather information and create leverage.",
      "motion",
    ],
    personnel: [
      "Offensive personnel",
      "Know who is on the field, before studying where they align.",
      "users",
    ],
    formations: [
      "Formations",
      "Explore the geometry of offensive spacing.",
      "formation",
    ],
    strategy: [
      "Play calling",
      "Make decisions with down, distance, and game context.",
      "strategy",
    ],
    philosophy: [
      "Offensive philosophy",
      "Explore the principles that connect an offensive system.",
      "book",
    ],
  }).map(([id, [name, description, icon]]) => ({
    id,
    name,
    description,
    icon,
    side: "offense" as const,
  })),
  ...Object.entries({
    coverage: [
      "Coverage foundations",
      "Understand shells, distribution, and coverage techniques.",
      "coverage",
    ],
    fronts: [
      "Defensive fronts",
      "How the front controls gaps and shapes the run game.",
      "formation",
    ],
    pressure: [
      "Pressure",
      "The relationship between pressure, protection, and coverage.",
      "bolt",
    ],
    "run-fits": [
      "Run fits",
      "Connect gap responsibility, leverage, and force.",
      "run",
    ],
    "defensive-personnel": [
      "Defensive personnel",
      "How defensive packages answer offensive personnel.",
      "users",
    ],
    "defensive-philosophy": [
      "Defensive philosophy",
      "Principles behind building a defensive system.",
      "book",
    ],
  }).map(([id, [name, description, icon]]) => ({
    id,
    name,
    description,
    icon,
    side: "defense" as const,
  })),
];
const make = (
  id: string,
  title: string,
  categoryId: string,
  kind: Lesson["kind"],
  summary: string,
  sections: TeachingPoint[],
  extra: Partial<Lesson> = {},
): Lesson => ({
  id,
  title,
  categoryId,
  kind,
  summary,
  sections,
  status: "ready",
  minutes: 6,
  level: "Foundation",
  keyIdeas: sections.map((s) => s.title),
  mistakes: [
    "Treating this example as a universal rule. Always account for your system, technique, and opponent.",
  ],
  related: [],
  ...extra,
});
const pass = concepts.map((c) =>
  make(
    c.id,
    c.name,
    "passing",
    "passing",
    c.summary,
    [
      { title: "The concept", body: c.detailedExplanation },
      ...c.coachingPoints,
    ],
    {
      entityId: c.id,
      minutes: 8,
      level: c.difficulty,
      related: c.relatedConcepts,
      mistakes: c.limitations,
      quiz: {
        id: `${c.id}-quiz`,
        prompt: `What should guide the decision in ${c.name}?`,
        options: [
          "The coverage name alone",
          "The key defender’s leverage and adjacent help",
          "A predetermined receiver regardless of the defense",
        ],
        answer: 1,
        explanation:
          "The shell is only the starting point. Confirm post-snap responsibility, leverage, and help before choosing a throw.",
      },
    },
  ),
);
const runLessons = runs.map((r) =>
  make(
    r.id,
    r.name,
    "running",
    "run",
    r.summary,
    [
      { title: "Back track and read", body: r.key },
      {
        title: "Blocking structure",
        body: r.blocks.map((b) => `${b.playerId}: ${b.description}`).join(" "),
      },
      {
        title: "Against different fronts",
        body: "A changed front alters combinations and linebacker declarations. The diagram adjusts target landmarks; it does not implement a full coaching rulebook.",
      },
    ],
    { entityId: r.id, related: ["front-even", "half-slide"] },
  ),
);
const coverageLessons = coverages.map((c) =>
  make(
    c.id,
    c.name,
    "coverage",
    "coverage",
    c.summary,
    [
      { title: "Structure", body: c.summary },
      {
        title: "Pre-snap evidence",
        body: `${c.shell}. ${c.rotation ?? "A shell is an alignment clue, not a promise of post-snap coverage."}`,
      },
      {
        title: "Responsibilities",
        body: "Click defenders to inspect assignments. Zone landmarks illustrate responsibility, but defenders relate to routes and can overlap adjacent space.",
      },
    ],
    {
      entityId: c.id,
      related: ["man-vs-zone", "zone-spacing"],
      quiz: {
        id: `${c.id}-quiz`,
        prompt: "Can the pre-snap safety shell prove the post-snap coverage?",
        options: [
          "Yes, always",
          "No; rotation and assignment rules must be confirmed",
        ],
        answer: 1,
        explanation:
          "A defense can disguise coverage and rotate after the snap. Use the shell as evidence and confirm how defenders distribute routes.",
      },
    },
  ),
);
const foundations = [
  make(
    "coverage-foundations",
    "Coverage Foundations",
    "coverage",
    "coverage",
    "Start with deep defenders, underneath distribution, and leverage.",
    [
      {
        title: "Count the deep responsibilities",
        body: "Coverage numbers often describe deep coverage structure, but names alone do not tell you every underneath technique.",
      },
      {
        title: "Shell versus coverage",
        body: "A one-high or two-high shell describes alignment. Post-snap rotation and receiver distribution reveal responsibilities.",
      },
    ],
    { entityId: "cover3", related: ["man-vs-zone", "cover3", "cover2"] },
  ),
  make(
    "man-vs-zone",
    "Man vs Zone",
    "coverage",
    "coverage",
    "Follow a receiver or defend space? Start with responsibility, then add technique.",
    [
      {
        title: "Man",
        body: "A defender carries a specific receiver, sometimes with help, bracket, or switch rules.",
      },
      {
        title: "Zone",
        body: "A defender relates to threats in an assigned area. Zone defenders still cover people, and may carry routes based on match rules.",
      },
    ],
    { entityId: "cover1", related: ["mesh", "zone-spacing"] },
  ),
  make(
    "zone-spacing",
    "Zone Spacing 101",
    "coverage",
    "coverage",
    "Understand the windows between underneath and deep responsibilities.",
    [
      {
        title: "Landmarks are teaching tools",
        body: "Hook/curl, curl/flat, and deep zones help distribute threats. They are not fixed walls.",
      },
      {
        title: "Stretch a responsibility",
        body: "Two routes at distinct depths or widths can place a defender in conflict. Adjacent defenders may still help.",
      },
    ],
    { entityId: "cover3", related: ["sail", "stick"] },
  ),
  make(
    "spot-vs-match",
    "Spot Drop vs Pattern Match",
    "coverage",
    "coverage",
    "Similar shells can produce very different post-snap assignments.",
    [
      {
        title: "Spot-drop emphasis",
        body: "Defenders gain depth to landmarks and relate to the quarterback and threats entering their zones.",
      },
      {
        title: "Match emphasis",
        body: "Defenders distribute and carry receivers based on release patterns and call-specific rules. Quarters and Cover 3 have many distinct match implementations.",
      },
      {
        title: "Simulator boundary",
        body: "This lab demonstrates man assignments and spot-drop landmarks. It does not execute a complete pattern-match rule engine.",
      },
    ],
    { entityId: "cover4", related: ["cover4", "cover3"] },
  ),
  ...[
    [
      "leverage",
      "Leverage",
      "Position your body to deny a route or run path.",
      "Leverage is relative to the threat and available help. Inside leverage can deny an in-break but may concede space outside.",
    ],
    [
      "banjo",
      "Banjo",
      "Distribute receivers rather than chase through traffic.",
      "One common banjo call exchanges man responsibilities based on inside and outside releases. Exact rules vary by staff; it can reduce traffic against bunch or mesh.",
    ],
    [
      "bracket",
      "Bracket",
      "Use two defenders to control one receiver.",
      "One defender can play underneath or inside while another caps the receiver from above or outside. The actual split of duties depends on the call.",
    ],
    [
      "qb-spy",
      "QB Spy",
      "Assign a defender to monitor the quarterback.",
      "A spy can mirror the quarterback and close on a scramble. The defense sacrifices another coverage or rush responsibility, and rush-lane discipline still matters.",
    ],
  ].map(([id, title, summary, body]) =>
    make(
      id,
      title,
      "coverage",
      "article",
      summary,
      [
        { title: "One common implementation", body },
        {
          title: "Communication",
          body: "Define the exact responsibility and help before the snap. Terminology and execution vary by system.",
        },
      ],
      { related: ["cover1", "mesh"] },
    ),
  ),
  ...[
    [
      "intro-protection",
      "Intro to Pass Protection",
      "Build a pocket through threat identification and coordinated responsibility.",
      "Count potential rushers, identify a declaration, and distribute threats. A protected count does not remove every pressure problem; the QB and receivers may need a hot or sight adjustment.",
    ],
    [
      "protection-gaps",
      "Gaps / Protect Inside Out",
      "Identify A, B, and C gaps before chasing an edge.",
      "A gaps sit between center and guards; B between guards and tackles; C outside the tackles. Protect immediate inside pressure first. Systems define how to exchange stunts and handle late additions.",
    ],
    [
      "big-on-big",
      "Big on Big",
      "Match offensive linemen to declared down defenders.",
      "In one common man protection, linemen account for down defenders while a back scans assigned linebackers. The Mike declaration organizes the count; it is not necessarily the defense’s literal middle linebacker.",
    ],
    [
      "full-slide",
      "Full Slide",
      "Move the line’s responsibility in one direction.",
      "All five linemen work gap responsibility toward the slide. The back often handles the edge away from the slide, depending on the protection and personnel.",
    ],
    [
      "half-slide",
      "Half Slide",
      "Combine a slide side, a man side, and an inside-out scan.",
      "Three linemen slide left in this example, with the right guard and tackle on the man side. The back scans from the Mike outward. When Mike and the apex both rush on that side, one back cannot take both: the apex is the schematic free rusher.",
    ],
  ].map(([id, title, summary, body]) =>
    make(
      id,
      title,
      "protection",
      "protection",
      summary,
      [
        { title: "The responsibility", body },
        {
          title: "Teach the count",
          body: "Protection names and Mike declarations vary. This module illustrates one six-man half-slide family, not a universal protection rule.",
        },
      ],
      {
        entityId: ["full-slide", "big-on-big"].includes(id) ? id : "half-slide",
        related: ["half-slide", "protection-gaps", "big-on-big"],
      },
    ),
  ),
  ...motions.map((m) =>
    make(
      m.id,
      m.name,
      "motion",
      "motion",
      m.teaching,
      [
        { title: "What movement tells you", body: m.teaching },
        {
          title: "Timing and legality",
          body: "Coordinate the motion with the snap. One eligible player can move laterally or backward at the snap in common American football rules; a shift requires players to reset under the relevant ruleset.",
        },
      ],
      { entityId: m.id, related: ["man-vs-zone", "trips"] },
    ),
  ),
  make(
    "personnel-intro",
    "Personnel Notation",
    "personnel",
    "personnel",
    "The first digit counts backs. The second counts tight ends.",
    [
      {
        title: "Read the two digits",
        body: "11 means one running back and one tight end, generally leaving three wide receivers among the five eligible skill players. The quarterback is not counted in this notation.",
      },
      {
        title: "Personnel is not formation",
        body: "A tight end can detach, and a back can align as a receiver. Package labels describe who is on the field, not where they line up.",
      },
    ],
    { entityId: "11", related: ["personnel-11", "shotgun"] },
  ),
  ...personnel.map((p) =>
    make(
      `personnel-${p.id}`,
      p.name,
      "personnel",
      "personnel",
      p.description,
      [
        {
          title: "Composition",
          body: `${p.rb} RB · ${p.te} TE · ${p.wr} WR. ${p.description}`,
        },
        {
          title: "Deployment",
          body: "These are typical positional counts. Teams can use hybrid players and different labels; alignment does not change the package count.",
        },
      ],
      { entityId: p.id, related: p.formations },
    ),
  ),
  ...formations.map((f) =>
    make(
      f.id,
      f.name,
      "formations",
      "formation",
      f.description,
      [
        { title: "Spacing", body: f.description },
        {
          title: "Separate the terms",
          body: `This example uses ${f.personnel} personnel. Formation describes where players align; personnel describes who plays; concept describes their coordinated assignments.`,
        },
      ],
      { entityId: f.id, related: ["personnel-intro", "stick"] },
    ),
  ),
  ...[
    [
      "down-distance",
      "Intro to Down & Distance",
      "Start with the situation, then choose a family of answers.",
      "Distance is only one input. Field position, score, clock, personnel, defensive tendencies, and the available playbook shape a good call. Conversion probability and expected points should inform risk without pretending the same answer fits every team.",
    ],
    [
      "first-10",
      "1st & 10",
      "Balance efficient gains with calculated explosive opportunities.",
      "First down offers room to run, throw quick game, or use play action. Evaluate box counts, safety leverage, and tendencies. An early-down pass can be attractive without becoming a universal prescription.",
    ],
    [
      "second-short",
      "2nd & Short",
      "A manageable distance can support a calculated shot.",
      "You may preserve a run/pass threat or take a matchup opportunity, but field position and clock can favor a safer gain. Avoid turning a favorable situation into predictable habits.",
    ],
    [
      "second-medium",
      "2nd & Medium",
      "Stay ahead of the sticks while preserving options.",
      "Consider an efficient completion or a favorable run fit. The defense can pressure or disguise because both remain credible; a protection answer is part of the call.",
    ],
    [
      "third-short",
      "3rd & Short",
      "Design for the required gain and anticipate pressure.",
      "Evaluate interior numbers, perimeter leverage, and the risk of penetration. Condensed formations can invite crowded fronts; spread spacing can change the box but affects protection.",
    ],
    [
      "third-medium",
      "3rd & Medium",
      "Create a clean decision near the line to gain.",
      "Routes need enough depth, but shorter throws with clear run-after-catch space can work. Expect pressure and disguise, and define an outlet that still has a credible path to conversion.",
    ],
    [
      "third-long",
      "3rd & Long",
      "Manage protection, windows, and conversion risk.",
      "Defenses may rush conservatively and protect the sticks or attack protection with pressure. Longer routes need time. Draws and screens can exploit tendencies, but their conversion value depends on spacing and context.",
    ],
    [
      "fourth-short",
      "4th & Short",
      "Treat the decision to go as part of the play call.",
      "Field position, score, timeouts, clock, team strengths, and conversion estimates determine whether going is sensible. If going, plan for penetration and pressure rather than assuming one formation or run always works.",
    ],
  ].map(([id, title, summary, body]) =>
    make(
      id,
      title,
      "strategy",
      "strategy",
      summary,
      [
        { title: "Decision framework", body },
        {
          title: "Before calling a play",
          body: "Ask: what response is likely, how does protection handle it, where is the advantage, and what is the consequence of failure?",
        },
      ],
      {
        related: ["half-slide", "stick"],
        quiz: {
          id: `${id}-quiz`,
          prompt: "Which is the strongest basis for a play-calling decision?",
          options: [
            "A fixed run/pass rule for the down",
            "Distance, game context, personnel, and opponent tendencies",
            "Always choose the deepest route",
          ],
          answer: 1,
          explanation:
            "Down and distance frame the problem. Game context and the actual matchup determine the decision.",
        },
      },
    ),
  ),
];
const future: Record<string, string[]> = {
  passing: [
    "Dragon / Slant-Flat",
    "Lion / Double Slants",
    "Spacing",
    "Option Concept",
    "Levels",
    "Drive",
    "Shallow Cross",
    "Y-Cross",
    "Double Post",
    "Snag",
    "Bow",
    "Yankee",
    "Mills",
    "Scissors",
    "Post-Wheel",
    "Texas",
    "RB Fast-to-Flat",
  ],
  running: [
    "Wide Zone",
    "Split Zone",
    "Jet Zone",
    "Zone Read",
    "RPO Attachments",
    "GT Counter",
    "Trap",
    "Wrap",
    "Wham",
    "Straight Dive",
    "Isolation / Iso",
    "Lead",
    "Pin and Pull",
    "Toss",
    "Crack Toss",
    "Jet Sweep",
  ],
  protection: [
    "Offensive Line Archetypes",
    "Defensive Alignment",
    "Adjustments to Half Slide",
    "Play Action Protection",
    "Sprint Protection",
    "Other Ways to Protect the QB",
  ],
  motion: [
    "Motion to Force Coverage Checks",
    "Motion to Manipulate Run Fits",
    "Motion as Misdirection",
    "The Compounding Effect of Motion",
  ],
  personnel: ["22 Personnel", "13 Personnel"],
  formations: ["Jumbo Formation", "Formation Evolution"],
  strategy: [
    "1st & Short",
    "1st & Long",
    "2nd & Long",
    "2nd & Very Long",
    "3rd & Very Long",
    "4th & Inches",
    "4th & Medium",
    "4th & Long",
  ],
  philosophy: [
    "West Coast Principles",
    "Air Raid Principles",
    "Spread Offense",
    "Pro-style Multiplicity",
    "Wide-zone Families",
    "Gap-scheme Offenses",
    "RPO Systems",
    "Tempo",
    "Formation Multiplicity",
    "Constraint Plays",
  ],
  coverage: [
    "Zone Rotation Calls",
    "M.E.G.",
    "M.O.D.",
    "No Cover Zone",
    "Trail Technique",
    "Cover 0 Pressure",
    "Cover 0 Simulated Pressure",
    "Forms of Cover 0",
    "Forms of Cover 1",
    "Forms of Cover 2",
    "Palms / 2-Read",
    "Forms of Cover 3",
    "Match Quarters",
    "Forms of Cover 4",
  ],
  fronts: ["Even", "Odd", "Over", "Under", "Bear", "Tite / Mint"],
  pressure: [
    "Linebacker Pressure",
    "Nickel Pressure",
    "Overloads",
    "Simulated Pressure",
    "Creepers",
    "Fire Zones",
  ],
  "run-fits": ["Gap Responsibility", "Force and Spill", "Fit Adjustments"],
  "defensive-personnel": ["4–2–5", "3–3–5", "Nickel and Dime"],
  "defensive-philosophy": [
    "Single-high Families",
    "Split-safety Families",
    "Multiplicity and Disguise",
  ],
};
const planned = Object.entries(future).flatMap(([category, titles]) =>
  titles.map((title) =>
    make(
      `future-${category}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      title,
      category,
      "article",
      "Planned curriculum. Teaching content and interactive scenarios are not yet available.",
      [],
      { status: "planned", minutes: 0 },
    ),
  ),
);
export const lessons: Lesson[] = [
  ...pass,
  ...runLessons,
  ...foundations,
  ...coverageLessons,
  ...planned,
];
export function getLesson(id: string) {
  return lessons.find((l) => l.id === id);
}
