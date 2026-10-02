import type { Concept, CoverageInteraction, Route } from "./types";
import { coverages } from "./coverage";
const r = (playerId: string, routeType: string, points: number[][]): Route => ({
  playerId,
  routeType,
  waypoints: points.map(([x, y]) => ({ x, y })),
});
const outlet = r("RB", "check-release", [
  [59, 85],
  [62, 76],
  [70, 65],
  [87, 64],
]);
const definitions: Omit<Concept, "coverageInteractions">[] = [
  {
    id: "four-verticals",
    name: "Four Verticals",
    aliases: ["4 Verts", "Verts"],
    category: "passing",
    family: "Vertical stretch",
    difficulty: "Intermediate",
    summary:
      "Four vertical threats. Three deep defenders. Make the defense account for every seam.",
    detailedExplanation:
      "Four Verticals sends four eligible receivers into vertical lanes. The outside routes widen the corners while the two inside routes threaten seams. Against a three-deep structure, the middle safety must relate to two inside threats; against two-high, seam spacing tests each safety and the underneath carry. Receivers often adjust their stems and settle or bend based on the system.",
    coachingPoints: [
      {
        title: "Own separate lanes",
        body: "Keep enough horizontal space to prevent one defender from covering two routes.",
      },
      {
        title: "Read the carry",
        body: "An underneath defender can disrupt a seam before the deep safety closes. Timing matters as much as the shell.",
      },
      {
        title: "Do not force the seam",
        body: "A closing window calls for a checkdown or an outside matchup, not a predetermined throw.",
      },
    ],
    prerequisites: ["coverage-foundations"],
    relatedConcepts: ["cover3", "cover2", "dagger"],
    strengths: [
      "Stresses three-deep distribution",
      "Creates vertical one-on-one opportunities",
    ],
    limitations: [
      "Needs protection and well-timed throws",
      "Match rules can carry the seams",
    ],
    formations: ["2x2"],
    personnel: ["10", "11"],
    routes: [
      r("X", "go", [
        [12, 72],
        [12, 10],
      ]),
      r("H", "seam", [
        [28, 75],
        [32, 48],
        [35, 9],
      ]),
      r("Y", "seam", [
        [72, 75],
        [68, 48],
        [65, 9],
      ]),
      r("Z", "go", [
        [88, 72],
        [88, 10],
      ]),
      outlet,
    ],
    assignments: {
      X: "Outside vertical: preserve width.",
      H: "Left seam: stay distinct from the outside vertical.",
      Y: "Right seam: watch the underneath carry and safety leverage.",
      Z: "Outside vertical: hold the corner wide.",
      RB: "Check protection, then release as the outlet.",
    },
    qbProgression: [
      "Alert: favorable outside matchup",
      "Read the middle safety and seam carry",
      "Opposite seam if timing permits",
      "RB outlet",
    ],
    variations: [
      {
        name: "Seam bend",
        description:
          "An inside receiver may bend away from safety leverage; exact rules differ by offense.",
      },
    ],
  },
  {
    id: "mesh",
    name: "Mesh",
    aliases: ["Mesh cross"],
    category: "passing",
    family: "Horizontal stretch",
    difficulty: "Foundation",
    summary:
      "Two shallow crossers create traffic against man and spacing decisions against zone.",
    detailedExplanation:
      "Mesh pairs two shallow crossing routes at slightly different depths. Against man, receivers can win through natural traffic without initiating illegal contact. Against zone, crossers may throttle in windows according to the offense’s rules. A sit route occupies an interior defender and an outside route stretches the coverage vertically.",
    coachingPoints: [
      {
        title: "Cross without collision",
        body: "Use distinct depths. Natural traffic is useful; deliberate contact can be an offensive foul.",
      },
      {
        title: "Run away from man",
        body: "Keep moving when a defender follows. Against zone, some systems coach a settle in open grass.",
      },
      {
        title: "Keep a top on the concept",
        body: "The corner route prevents defenders from crowding only the shallow space.",
      },
    ],
    prerequisites: ["man-vs-zone"],
    relatedConcepts: ["cover1", "cover3", "banjo"],
    strengths: [
      "Creates separation through traffic",
      "Offers short throws with run-after-catch potential",
    ],
    limitations: [
      "Switch calls can reduce traffic",
      "Low-hole defenders can crowd the crossing window",
    ],
    formations: ["2x2"],
    personnel: ["10", "11"],
    routes: [
      r("X", "shallow", [
        [12, 72],
        [22, 63],
        [83, 63],
      ]),
      r("H", "sit", [
        [28, 75],
        [44, 51],
        [49, 51],
      ]),
      r("Y", "shallow", [
        [72, 75],
        [62, 60],
        [17, 60],
      ]),
      r("Z", "corner", [
        [88, 72],
        [82, 44],
        [95, 24],
      ]),
      outlet,
    ],
    assignments: {
      X: "Shallow across: lower of the two crossers.",
      H: "Sit route: find interior grass according to the call.",
      Y: "Shallow across: cross above X.",
      Z: "Corner route: stretch the outside coverage.",
      RB: "Check-release to the flat.",
    },
    qbProgression: [
      "Alert: corner route matchup",
      "First shallow exiting traffic",
      "Second shallow / interior sit",
      "RB flat",
    ],
    variations: [
      {
        name: "Mesh sit",
        description:
          "An interior sit route offers a zone answer; this is the variation shown.",
      },
    ],
  },
  {
    id: "sail",
    name: "Sail / Flood",
    aliases: ["Flood"],
    category: "passing",
    family: "Three-level stretch",
    difficulty: "Foundation",
    summary:
      "Put a deep route, an intermediate out, and a flat route on the same side.",
    detailedExplanation:
      "Sail creates a three-level stretch near one sideline. The vertical route occupies the deep outside defender. The intermediate sail and flat route place the curl/flat defender in a depth conflict. The quarterback must account for the deep defender squeezing the intermediate window and the hook defender expanding underneath.",
    coachingPoints: [
      {
        title: "Separate all three levels",
        body: "Flat, intermediate, and vertical routes need distinct depths and enough sideline space.",
      },
      {
        title: "Watch both edges of the window",
        body: "The curl/flat defender matters, but the deep corner can squeeze the sail from above.",
      },
      {
        title: "Match footwork to timing",
        body: "Deliver the intermediate throw before the defense can overlap it.",
      },
    ],
    prerequisites: ["cover3"],
    relatedConcepts: ["cover3", "stick", "smash"],
    strengths: [
      "Overloads one side of three-deep zone",
      "Gives a clear underneath depth key",
    ],
    limitations: [
      "Sideline limits space",
      "Late intermediate throws invite overlap",
    ],
    formations: ["2x2"],
    personnel: ["11"],
    routes: [
      r("X", "post", [
        [12, 72],
        [12, 35],
        [37, 14],
      ]),
      r("H", "drag", [
        [28, 75],
        [36, 61],
        [69, 61],
      ]),
      r("Y", "sail", [
        [72, 75],
        [72, 43],
        [94, 38],
      ]),
      r("Z", "go", [
        [88, 72],
        [88, 9],
      ]),
      r("RB", "flat", [
        [59, 85],
        [70, 68],
        [94, 64],
      ]),
    ],
    assignments: {
      X: "Backside post: occupy the deep middle.",
      H: "Cross underneath as a secondary answer.",
      Y: "Intermediate sail: break toward the sideline.",
      Z: "Vertical: carry the deep corner away.",
      RB: "Fast flat: widen and pull the curl/flat defender down.",
    },
    qbProgression: [
      "Alert: vertical route",
      "Key curl/flat: sail if he drives down",
      "Flat if he sinks under the sail",
      "Backside answer according to the call",
    ],
    variations: [
      {
        name: "Boot flood",
        description:
          "Play action and a moving launch point can create the same three levels.",
      },
    ],
  },
  {
    id: "smash",
    name: "Smash",
    aliases: ["Hitch-corner"],
    category: "passing",
    family: "High–low stretch",
    difficulty: "Foundation",
    summary:
      "A hitch holds the corner low. A corner route attacks the space behind him.",
    detailedExplanation:
      "Smash pairs an outside hitch with an inside corner route. In a conventional spot-drop Cover 2, the corner owns the flat and the safety owns the deep half. The hitch and corner create a high-low on the flat corner while the corner route also tests the safety’s ability to reach the sideline. Match Cover 2 and trap rules can change this picture substantially.",
    coachingPoints: [
      {
        title: "Keep the hitch available",
        body: "A corner gaining depth creates an easy underneath completion.",
      },
      {
        title: "Respect the half-field safety",
        body: "The corner route is not automatically open when the flat corner drives down.",
      },
      {
        title: "Identify the coverage rules",
        body: "Palms / 2-read can exchange these routes and defeat a simple high-low expectation.",
      },
    ],
    prerequisites: ["cover2"],
    relatedConcepts: ["cover2", "sail", "leverage"],
    strengths: [
      "Stresses a flat corner in spot-drop Cover 2",
      "Offers an accessible underneath answer",
    ],
    limitations: [
      "Match and trap rules change the read",
      "Corner throw requires anticipation and sideline accuracy",
    ],
    formations: ["2x2"],
    personnel: ["10", "11"],
    routes: [
      r("X", "hitch", [
        [12, 72],
        [12, 60],
        [15, 62],
      ]),
      r("H", "corner", [
        [28, 75],
        [28, 43],
        [7, 26],
      ]),
      r("Y", "corner", [
        [72, 75],
        [72, 43],
        [93, 26],
      ]),
      r("Z", "hitch", [
        [88, 72],
        [88, 60],
        [85, 62],
      ]),
      outlet,
    ],
    assignments: {
      X: "Outside hitch: show your numbers to the QB.",
      H: "Inside corner: attack the deep sideline window.",
      Y: "Inside corner: attack the deep sideline window.",
      Z: "Outside hitch: occupy the flat corner.",
      RB: "Check protection and release underneath.",
    },
    qbProgression: [
      "Pick a side from leverage and shell",
      "Key flat corner: hitch if he sinks",
      "Corner if he drives and the safety cannot overlap",
      "RB outlet",
    ],
    variations: [
      {
        name: "Smash switch",
        description:
          "Receivers exchange releases to change leverage; protection and timing need adjustment.",
      },
    ],
  },
  {
    id: "dagger",
    name: "Dagger",
    aliases: ["Seam-dig"],
    category: "passing",
    family: "Vertical clear-out",
    difficulty: "Intermediate",
    summary:
      "Clear the middle vertically, then bring a dig into the space underneath.",
    detailedExplanation:
      "Dagger combines an inside vertical clear-out with an outside dig. The clear-out pushes the deep middle coverage while the dig crosses behind the underneath hook defenders. An underneath route can pull those defenders down. The dig is a timing window between two levels, not an empty spot that remains open.",
    coachingPoints: [
      {
        title: "Clear before the dig arrives",
        body: "The vertical route must threaten the safety enough to create depth.",
      },
      {
        title: "Read underneath depth",
        body: "A hook defender sinking under the dig can erase the window.",
      },
      {
        title: "Account for a robber",
        body: "Low-hole help can cut the dig even when the deep safety is occupied.",
      },
    ],
    prerequisites: ["cover3"],
    relatedConcepts: ["four-verticals", "cover3", "robber"],
    strengths: [
      "Attacks the intermediate middle",
      "Pairs naturally with shallow action",
    ],
    limitations: [
      "Requires time for the dig",
      "Robbers and sinking hook defenders can close the window",
    ],
    formations: ["2x2"],
    personnel: ["11"],
    routes: [
      r("X", "dig", [
        [12, 72],
        [12, 39],
        [64, 39],
      ]),
      r("H", "seam", [
        [28, 75],
        [40, 43],
        [46, 8],
      ]),
      r("Y", "shallow", [
        [72, 75],
        [61, 62],
        [20, 62],
      ]),
      r("Z", "go", [
        [88, 72],
        [88, 10],
      ]),
      outlet,
    ],
    assignments: {
      X: "Dig: cross behind the underneath coverage.",
      H: "Seam: occupy deep middle coverage.",
      Y: "Shallow: offer an underneath answer and occupy hook defenders.",
      Z: "Outside vertical: prevent the corner from squeezing inside.",
      RB: "Check-release outlet.",
    },
    qbProgression: [
      "Alert: seam or outside matchup",
      "Dig behind the hook defender",
      "Shallow if hooks gain depth",
      "RB outlet",
    ],
    variations: [
      {
        name: "Deep dig",
        description:
          "Depth and timing depend on protection, receiver speed, and the offensive system.",
      },
    ],
  },
  {
    id: "stick",
    name: "Stick",
    aliases: ["Y-stick"],
    category: "passing",
    family: "Quick-game stretch",
    difficulty: "Foundation",
    summary:
      "Stretch the underneath defender horizontally with a stick and a fast flat.",
    detailedExplanation:
      "Stick places an interior receiver on a short settle or option route while another eligible receiver expands to the flat. The outside receiver clears space vertically. A curl/flat or apex defender cannot sit inside and cover the fast flat at the same time. The stick receiver’s leverage adjustments depend on the offense and coverage rules.",
    coachingPoints: [
      {
        title: "Make the flat urgent",
        body: "A slow release lets the underneath defender guard both routes.",
      },
      {
        title: "Find the nearest underneath key",
        body: "Read width and leverage, not only the deep safety count.",
      },
      {
        title: "Do not drift into help",
        body: "Option and settle rules are specific to the offensive system.",
      },
    ],
    prerequisites: ["zone-spacing"],
    relatedConcepts: ["cover3", "sail", "leverage"],
    strengths: [
      "Quick and accessible zone answer",
      "Creates a horizontal underneath conflict",
    ],
    limitations: [
      "Tight man coverage changes the answer",
      "A widened hook defender can help the flat defender",
    ],
    formations: ["2x2"],
    personnel: ["11"],
    routes: [
      r("X", "slant", [
        [12, 72],
        [12, 64],
        [28, 52],
      ]),
      r("H", "hitch", [
        [28, 75],
        [28, 59],
        [30, 61],
      ]),
      r("Y", "stick", [
        [72, 75],
        [72, 58],
        [77, 58],
      ]),
      r("Z", "go", [
        [88, 72],
        [88, 10],
      ]),
      r("RB", "flat", [
        [59, 85],
        [74, 68],
        [94, 64],
      ]),
    ],
    assignments: {
      X: "Backside slant as a matchup answer.",
      H: "Backside hitch.",
      Y: "Stick: settle or break away according to leverage and the call.",
      Z: "Vertical clear-out.",
      RB: "Fast flat: force the underneath key to expand.",
    },
    qbProgression: [
      "Alert: backside matchup",
      "Key apex: stick if he widens",
      "Flat if he stays inside",
      "Protect against pressure with your system’s hot answer",
    ],
    variations: [
      {
        name: "Stick option",
        description:
          "Some systems allow the stick receiver to break out or settle based on leverage.",
      },
    ],
  },
];
const authored: Record<string, Partial<CoverageInteraction>> = {
  "smash:cover2": {
    title: "One corner. Two depths.",
    keyDefender: "CBR",
    stress: { x: 88, y: 40 },
    explanation:
      "The right corner owns the flat. Z’s hitch asks him to drive forward, while Y’s corner route attacks the space behind him and outside the deep-half safety. Read the corner’s depth, then confirm the safety cannot overlap.",
    high: "If CBR sinks under the corner route, throw the hitch before underneath help arrives.",
    low: "If CBR drives on the hitch, the corner route has a window behind him—if the safety is too far inside.",
    qbNote:
      "A common teaching: hitch-to-corner using the flat corner’s depth. Throw with anticipation.",
    limitation:
      "Palms / 2-read may exchange responsibilities. This scenario models spot-drop Cover 2.",
  },
  "mesh:cover1": {
    title: "Create traffic, then run away.",
    keyDefender: "A",
    stress: { x: 50, y: 61 },
    explanation:
      "A is assigned to Y in man coverage. Y and X cross at different depths, forcing their trailing defenders through a busy area. Natural traffic can create separation; receivers must avoid initiating illegal contact.",
    high: "If the low-hole defender sits on the shallow crossers, the interior sit or corner matchup may become available.",
    low: "If A trails through the mesh, deliver to Y as he exits the traffic with space to run.",
    qbNote:
      "One common progression checks the corner alert, then the shallow crossers as they separate.",
    limitation:
      "Banjo, switch, and low-hole help can defeat the traffic. Mesh is not an automatic man beater.",
  },
  "mesh:cover3": {
    title: "Cross the zone. Find the window.",
    keyDefender: "M",
    stress: { x: 51, y: 56 },
    explanation:
      "The Mike relates to the interior sit while shallow crossers enter and leave the underneath zones. Unlike man coverage, defenders can pass routes off. Receivers may settle in grass rather than run into the next defender, if their system permits.",
    high: "If M gains depth with the sit, a shallow crosser can enter the space below him.",
    low: "If M drives the shallow route, the interior sit can show above him; check the adjacent hook defender.",
    qbNote:
      "Read the hook defenders’ depth. Do not assume crossing traffic creates the same separation as man.",
    limitation:
      "Pattern-match Cover 3 may carry routes instead of handing them off at landmarks.",
  },
  "sail:cover3": {
    title: "Three levels. Two outside defenders.",
    keyDefender: "A",
    stress: { x: 85, y: 45 },
    explanation:
      "Z’s vertical route carries the deep-third corner. RB threatens the flat while Y breaks on the intermediate sail. The apex defender A must gain depth under Y or expand down to RB; he cannot occupy both levels.",
    high: "If A sinks beneath Y’s sail, take the flat before pursuit arrives.",
    low: "If A drives to RB in the flat, throw Y behind him before the deep corner squeezes down.",
    qbNote:
      "A common read is vertical alert → sail → flat, tied to the curl/flat defender’s depth.",
    limitation:
      "The deep corner can overlap a late sail. The vertical clear-out must actually threaten him.",
  },
  "four-verticals:cover3": {
    title: "Split the middle safety’s attention.",
    keyDefender: "SL",
    stress: { x: 50, y: 26 },
    explanation:
      "The outside corners relate to X and Z. H and Y attack opposite seams, putting two vertical threats around the middle-third safety. Underneath seam carries still matter; use the safety’s leverage to identify the better window.",
    high: "If SL leans toward H, Y can threaten the opposite seam before the safety recovers.",
    low: "If SL stays centered and underneath defenders carry both seams, use an outside matchup or the checkdown.",
    qbNote:
      "Identify one-high, then confirm post-snap rotation and seam-carry depth. Do not stare down one seam.",
    limitation:
      "Rip/Liz and other match rules can carry both seams. Four routes do not guarantee an open receiver.",
  },
  "four-verticals:cover2": {
    title: "Attack the seams between levels.",
    keyDefender: "SR",
    stress: { x: 66, y: 30 },
    explanation:
      "Y’s seam and Z’s outside vertical stretch the right deep-half safety. The flat corner can reroute Z, and the Mike can carry the inside lane. The QB reads safety width along with the underneath carry to locate a timed seam window.",
    high: "If SR widens with Z, the inside seam can open before the Mike gains enough depth.",
    low: "If SR stays inside over Y, the outside vertical may have a sideline window behind the corner.",
    qbNote:
      "A common teaching is to key a half-field safety and confirm the linebacker carry before releasing the seam.",
    limitation:
      "Tampa 2 adds a deeper Mike carry and shrinks the inside window. Timing and protection are essential.",
  },
  "dagger:cover3": {
    title: "Clear high. Enter behind the hooks.",
    keyDefender: "W",
    stress: { x: 40, y: 40 },
    explanation:
      "H’s seam pushes the middle-third safety deep. Y’s shallow route occupies underneath vision. X’s dig arrives behind W in the intermediate middle; the window depends on W’s depth and the adjacent Mike.",
    high: "If W sinks under the dig, the shallow route becomes a lower-risk answer.",
    low: "If W drives on Y’s shallow, X can enter behind him before the deep safety closes.",
    qbNote:
      "A common progression is vertical alert → dig → shallow. Match the dig throw to the hook defender’s movement.",
    limitation:
      "A robber or a sinking Mike can close the same window. Do not read only one defender.",
  },
};
authored["stick:cover3"] = {
  title: "Stretch the apex, side to side.",
  keyDefender: "A",
  stress: { x: 81, y: 59 },
  explanation:
    "Z’s vertical holds the deep-third corner while Y settles on the stick and RB expands quickly to the flat. A owns the curl/flat responsibility: the two short routes stretch his width. The adjacent hook defender can help inside, so spacing and the speed of the flat release matter.",
  high: "If A widens with RB into the flat, Y can show inside on the stick—confirm the Mike has not expanded into that window.",
  low: "If A stays inside on Y’s stick, deliver the fast flat to RB before the corner or pursuit closes.",
  qbNote:
    "One common quick-game read keys the apex’s width: stick if he expands, flat if he holds inside. Exact option and footwork rules vary.",
  limitation:
    "Match rules or an expanding hook defender may cover both threats. The routes need distinct spacing and a coordinated pressure answer.",
};
for (const coverageId of ["cover2", "tampa2", "cover6"]) {
  authored[`stick:${coverageId}`] = {
    title: "Find the underneath spacing.",
    conflict: false,
    keyDefender: "A",
    stress: { x: 77, y: 58 },
    explanation:
      "On the right side of this look, A owns the hook/curl while CBR owns the flat. They are separate defenders, so the stick and flat are not an automatic two-on-one. RB’s fast flat can widen CBR while Y settles between the outside coverage and A’s inside leverage. Confirm both defenders’ width and the safety help.",
    high: "If A gains depth and CBR expands with RB, Y may find a short window beneath A and inside CBR.",
    low: "If A sits on Y and CBR drives the flat, both short routes can be covered. Use the system’s backside answer rather than forcing the ball.",
    qbNote:
      "A common approach checks the stick window and flat leverage together. A safety shell alone cannot tell you which short route is open.",
    limitation:
      "This is an underneath-spacing lesson, not a claim that A alone must cover both routes. Trap, match, and pressure rules can change the answer.",
  };
}
function interaction(
  concept: Omit<Concept, "coverageInteractions">,
  coverageId: string,
): CoverageInteraction {
  const c = coverages.find((c) => c.id === coverageId)!;
  const isMan = ["cover0", "cover1", "robber"].includes(c.id);
  const specific = authored[`${concept.id}:${c.id}`];
  const common: CoverageInteraction = {
    coverageId: c.id,
    title: isMan
      ? "Win leverage and account for help."
      : "Locate the window between responsibilities.",
    keyDefender:
      concept.id === "smash"
        ? c.id === "cover3" || c.id === "buzz"
          ? "CBR"
          : "A"
        : concept.id === "four-verticals"
          ? "SR"
          : concept.id === "dagger"
            ? "M"
            : "A",
    stress: { x: 75, y: 47 },
    explanation: isMan
      ? `${c.name} assigns receivers individually. ${concept.name} must win releases and leverage; ${c.id === "cover0" ? "there is no dedicated deep helper" : c.id === "robber" ? "the low-hole safety can cut in-breaking routes" : "the deep safety and low-hole help can overlap routes"}. The zone-style high-low is not a guaranteed man-coverage read.`
      : `${c.summary} ${concept.id === "stick" ? "The stick and fast flat stretch A horizontally. If A widens, Y can show inside; if A holds inside, RB can reach the flat." : concept.id === "smash" ? "With different deep and underneath distribution, check who carries the corner route. A deep outside defender can squeeze it while the underneath defender covers the hitch." : concept.id === "sail" ? "The three levels still test outside distribution, but quarters or half-field help can squeeze the sail; locate the flat defender before choosing a throw." : concept.id === "four-verticals" ? "The vertical lanes test how the defense distributes deep threats. Four-deep has a defender for each lane; leverage and underneath carries become decisive." : concept.id === "dagger" ? "The dig targets space between underneath depth and deep coverage. Sinking hook defenders can close it." : "The crossers challenge underneath handoffs while the sit occupies interior help. Look for grass rather than assuming man-style traffic."}`,
    high: isMan
      ? "If the defender stays on top, an underneath break may create separation; check low-hole help."
      : "If the underneath key gains depth, locate the short route beneath him and check adjacent help.",
    low: isMan
      ? "If the defender trails, separation may develop away from his leverage; deep help can still close."
      : "If the underneath key drives down or widens, inspect the next level before throwing.",
    qbNote: `One common progression: ${concept.qbProgression.join(" → ")}. Exact reads vary by offense.`,
    limitation: isMan
      ? "Switches, brackets, pressure, and leverage can change this response."
      : "This uses deterministic teaching landmarks. Match rules, reroutes, and technique alter real outcomes.",
  };
  return { ...common, ...specific };
}
export const concepts: Concept[] = definitions.map((c) => ({
  ...c,
  coverageInteractions: coverages.map((v) => interaction(c, v.id)),
}));
