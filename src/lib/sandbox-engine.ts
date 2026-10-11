import type { Point, Route } from "@/domain/types";
import type { PlayerProfile } from "@/domain/workspace-extras";
import type {
  Ratings,
  ReplayFrame,
  ReplayResult,
  SandboxScenario,
  OpponentProfile,
  WindowMetric,
} from "@/domain/sandbox";
import {
  SANDBOX_MODEL_VERSION,
  SANDBOX_DURATION,
  SANDBOX_DT,
  RECEIVER_IDS,
  scenarioCoverage,
} from "@/domain/sandbox";
import { offsetRoute } from "./simulation";
// Coordinates map to an illustrative 53 1/3-yard width and a 50-yard viewport.
// These units define this sandbox only; legacy lesson diagrams remain schematic.
export const FIELD_WIDTH_YARDS = 53.333333;
export const FIELD_DEPTH_YARDS = 50;
const toYards = (p: Point): Point => ({
  x: (p.x * FIELD_WIDTH_YARDS) / 100,
  y: (p.y * FIELD_DEPTH_YARDS) / 100,
});
const fromYards = (p: Point): Point => ({
  x: Math.max(2, Math.min(98, (p.x * 100) / FIELD_WIDTH_YARDS)),
  y: Math.max(2, Math.min(98, (p.y * 100) / FIELD_DEPTH_YARDS)),
});
export const distanceYards = (a: Point, b: Point) => {
  const p = toYards(a),
    q = toYards(b);
  return Math.hypot(q.x - p.x, q.y - p.y);
};
export function pathLengthYards(route: Route) {
  return route.waypoints
    .slice(1)
    .reduce((length, p, i) => length + distanceYards(route.waypoints[i], p), 0);
}
const clampRating = (v: number) => Math.max(0, Math.min(100, v));
export function variedRatings(ratings: Ratings, variation: number): Ratings {
  return Object.fromEntries(
    Object.entries(ratings).map(([key, v]) => [
      key,
      clampRating(v + variation),
    ]),
  ) as Ratings;
}
export function physicalParameters(r: Ratings) {
  return {
    speed: 5.2 + r.speed * 0.036,
    acceleration: 2.2 + r.acceleration * 0.055,
    turnRate: 1.1 + r.changeOfDirection * 0.034,
    reactionDelay: 0.65 - r.reaction * 0.005,
    manOffset: 2.5 - r.manCoverage * 0.021,
    landmarkWeight: 0.18 + r.zoneDiscipline * 0.006,
  };
}
export function receiverPosition(
  route: Route,
  seconds: number,
  speedRating: number,
  releaseDelay = 0,
  player?: PlayerProfile,
): Point {
  // Illustrative timing assumptions, not measured athletic performance. Editable
  // speed/releaseDelay override their profile equivalents; awareness adds snap lag.
  const startDelay = player
    ? 0.3 * (1 - clampRating(player.attributes?.awareness ?? player.ratings.reaction) / 100)
    : 0;
  const t = Math.max(0, seconds - releaseDelay - startDelay);
  const speed = 5.2 + clampRating(speedRating) * 0.036;
  const acceleration = player
    ? 2.2 + clampRating(player.ratings.acceleration) * 0.055
    : 4.5;
  const ramp = speed / acceleration;
  const distanceAt = (time: number) => {
    const elapsed = Math.max(0, time);
    return elapsed < ramp
      ? 0.5 * acceleration * elapsed * elapsed
      : 0.5 * acceleration * ramp * ramp + speed * (elapsed - ramp);
  };
  let remaining = distanceAt(t);
  let traveled = 0;
  let turnDelay = 0;
  for (let i = 1; i < route.waypoints.length; i++) {
    const a = route.waypoints[i - 1],
      b = route.waypoints[i],
      length = distanceYards(a, b);
    if (remaining <= length || i === route.waypoints.length - 1) {
      const f = length ? Math.min(1, remaining / length) : 0;
      return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
    }
    remaining -= length;
    traveled += length;
    if (player && length > 0) {
      const next = route.waypoints.slice(i + 1).find((p) => distanceYards(b, p) > 0);
      if (next) {
        const start = toYards(a), corner = toYards(b), end = toYards(next);
        const incoming = Math.atan2(corner.y - start.y, corner.x - start.x);
        const outgoing = Math.atan2(end.y - corner.y, end.x - corner.x);
        const angle = Math.abs(Math.atan2(
          Math.sin(outgoing - incoming), Math.cos(outgoing - incoming),
        ));
        const turnRate = 1.1 + clampRating(player.ratings.changeOfDirection) * 0.034;
        const technique = 1.3 - clampRating(player.attributes?.routeRunning ?? 50) * 0.008;
        // Charge turn preparation at the waypoint, retaining the authored route
        // rather than rounding cuts into unassigned space. Straight stems pay none.
        turnDelay += angle / turnRate * technique;
        remaining = distanceAt(t - turnDelay) - traveled;
        if (remaining <= 0) return { x: b.x, y: b.y };
      }
    }
  }
  return route.waypoints[0];
}
export function segmentDistanceYards(
  point: Point,
  start: Point,
  end: Point,
): number {
  const p = toYards(point),
    a = toYards(start),
    b = toYards(end);
  const dx = b.x - a.x,
    dy = b.y - a.y,
    length = dx * dx + dy * dy;
  const t = length
    ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length))
    : 0;
  return Math.hypot(p.x - a.x - dx * t, p.y - a.y - dy * t);
}
function approach(
  position: Point,
  velocity: Point,
  target: Point,
  ratings: Ratings,
  dt: number,
): { position: Point; velocity: Point } {
  const params = physicalParameters(ratings),
    p = toYards(position),
    goal = toYards(target);
  const dx = goal.x - p.x,
    dy = goal.y - p.y,
    dist = Math.hypot(dx, dy);
  if (dist < 0.03) return { position, velocity: { x: 0, y: 0 } };
  const currentSpeed = Math.hypot(velocity.x, velocity.y);
  const desiredAngle = Math.atan2(dy, dx);
  let angle =
    currentSpeed > 0.05 ? Math.atan2(velocity.y, velocity.x) : desiredAngle;
  let difference = Math.atan2(
    Math.sin(desiredAngle - angle),
    Math.cos(desiredAngle - angle),
  );
  difference = Math.max(
    -params.turnRate * dt,
    Math.min(params.turnRate * dt, difference),
  );
  angle += difference;
  const speed = Math.min(
    params.speed,
    currentSpeed + params.acceleration * dt,
    dist / dt,
  );
  const nextVelocity = {
    x: Math.cos(angle) * speed,
    y: Math.sin(angle) * speed,
  };
  return {
    position: fromYards({
      x: p.x + nextVelocity.x * dt,
      y: p.y + nextVelocity.y * dt,
    }),
    velocity: nextVelocity,
  };
}
export function frameAt(result: ReplayResult, seconds: number): ReplayFrame {
  const scaled = Math.max(0, Math.min(SANDBOX_DURATION, seconds)) / SANDBOX_DT;
  const i = Math.floor(scaled),
    fraction = scaled - i;
  const a = result.frames[Math.min(i, result.frames.length - 1)],
    b = result.frames[Math.min(i + 1, result.frames.length - 1)];
  return {
    seconds,
    positions: Object.fromEntries(
      Object.entries(a.positions).map(([id, p]) => [
        id,
        {
          x: p.x + (b.positions[id].x - p.x) * fraction,
          y: p.y + (b.positions[id].y - p.y) * fraction,
        },
      ]),
    ),
  };
}
export function simulateScenario(
  scenario: SandboxScenario,
  profile: OpponentProfile,
  variation = 0,
): ReplayResult {
  const coverage = scenarioCoverage(scenario);
  const routes = scenario.routes.map((r) => offsetRoute(r, scenario.players));
  const positions: Record<string, Point> = Object.fromEntries(
    [...scenario.players, ...coverage.defenders].map((p) => [
      p.id,
      { x: p.x, y: p.y },
    ]),
  );
  const velocity: Record<string, Point> = Object.fromEntries(
    coverage.defenders.map((p) => [p.id, { x: 0, y: 0 }]),
  );
  const frames: ReplayFrame[] = [
    { seconds: 0, positions: structuredClone(positions) },
  ];
  const eligible = scenario.players.filter((p) => RECEIVER_IDS.includes(p.id));
  const offenseAt = (seconds: number) =>
    Object.fromEntries(
      scenario.players.map((p) => {
        const route = routes.find((r) => r.playerId === p.id);
        const settings = scenario.receivers[p.id];
        return [
          p.id,
          route && settings
            ? receiverPosition(
                route,
                seconds,
                settings.speed,
                settings.releaseDelay,
                scenario.lineup?.[p.id],
              )
            : { x: p.x, y: p.y },
        ];
      }),
    );
  for (
    let step = 1;
    step <= Math.round(SANDBOX_DURATION / SANDBOX_DT);
    step++
  ) {
    const seconds = Number((step * SANDBOX_DT).toFixed(3));
    Object.assign(positions, offenseAt(seconds));
    for (const defender of coverage.defenders) {
      const settings = scenario.defenders[defender.id];
      const ratings = variedRatings(
        settings.ratings ?? profile.ratings,
        variation,
      );
      const params = physicalParameters(ratings);
      const assignment = settings.assignment;
      const perceived = offenseAt(Math.max(0, seconds - params.reactionDelay));
      let target: Point = assignment.destination;
      if (
        assignment.type === "man" &&
        assignment.targetId &&
        perceived[assignment.targetId]
      ) {
        target = {
          x: perceived[assignment.targetId].x,
          y: perceived[assignment.targetId].y - params.manOffset * 2,
        };
      } else if (assignment.type === "spy") {
        target = perceived.QB;
      } else if (assignment.type === "zone") {
        const zone = coverage.zones.find((z) => z.defenderId === defender.id);
        const threats = eligible
          .filter((p) => {
            const q = perceived[p.id];
            return (
              zone &&
              q.x >= zone.x - 3 &&
              q.x <= zone.x + zone.width + 3 &&
              q.y >= zone.y - 4 &&
              q.y <= zone.y + zone.height + 4
            );
          })
          .sort(
            (a, b) =>
              distanceYards(perceived[a.id], positions[defender.id]) -
              distanceYards(perceived[b.id], positions[defender.id]),
          );
        if (threats.length) {
          const threat = perceived[threats[0].id];
          target = {
            x:
              assignment.destination.x * params.landmarkWeight +
              threat.x * (1 - params.landmarkWeight),
            y:
              assignment.destination.y * params.landmarkWeight +
              (threat.y - 2) * (1 - params.landmarkWeight),
          };
        }
      }
      if (seconds < params.reactionDelay) continue;
      const next = approach(
        positions[defender.id],
        velocity[defender.id],
        target,
        ratings,
        SANDBOX_DT,
      );
      positions[defender.id] = next.position;
      velocity[defender.id] = next.velocity;
    }
    frames.push({ seconds, positions: structuredClone(positions) });
  }
  const partial: ReplayResult = {
    modelVersion: SANDBOX_MODEL_VERSION,
    frames,
    release: frames[0],
    windows: [],
    pressureExpired: scenario.releaseTime >= scenario.pressureTime,
    warnings: [],
  };
  partial.release = frameAt(partial, scenario.releaseTime);
  partial.windows = windowAt(partial, scenario, scenario.releaseTime);
  if (profile.confidence === "unrated")
    partial.warnings.push("The opponent profile has not been rated from film.");
  if (profile.confidence !== "high")
    partial.warnings.push(
      "Low confidence warrants wider assumption comparisons, not probability claims.",
    );
  if (partial.pressureExpired)
    partial.warnings.push(
      "Release occurs at or after the hypothetical pressure deadline. No rush is simulated.",
    );
  if (scenario.routes.length === 0)
    partial.warnings.push(
      "No routes are assigned. Receivers stay at their initial alignments.",
    );
  return partial;
}
export function windowAt(
  result: ReplayResult,
  scenario: SandboxScenario,
  seconds: number,
): WindowMetric[] {
  const frame = frameAt(result, seconds),
    coverage = scenarioCoverage(scenario);
  return scenario.players
    .filter((p) => RECEIVER_IDS.includes(p.id))
    .map((p) => {
      const ranked = coverage.defenders
        .map((d) => ({
          id: d.id,
          distance: distanceYards(frame.positions[d.id], frame.positions[p.id]),
        }))
        .sort((a, b) => a.distance - b.distance);
      return {
        receiverId: p.id,
        nearestDefenderId: ranked[0].id,
        separation: ranked[0].distance,
        laneClearance: Math.min(
          ...coverage.defenders.map((d) =>
            segmentDistanceYards(
              frame.positions[d.id],
              frame.positions.QB,
              frame.positions[p.id],
            ),
          ),
        ),
      };
    });
}
export function describeWindow(
  metric: WindowMetric,
  result: ReplayResult,
): string {
  const space =
    metric.separation >= 3
      ? "more space"
      : metric.separation >= 1.5
        ? "limited space"
        : "tight coverage";
  const lane =
    metric.laneClearance < 1.5
      ? "A defender is close to the straight QB-to-receiver segment."
      : "The straight segment has more clearance in this frame.";
  return `${metric.receiverId} has ${space} at the release frame; ${metric.nearestDefenderId} is nearest (${metric.separation.toFixed(1)} illustrative yards). ${lane} ${result.pressureExpired ? "The release misses the hypothetical pressure clock." : "The release is before the hypothetical pressure clock."} This is a geometry observation, not a throw recommendation or completion probability.`;
}
