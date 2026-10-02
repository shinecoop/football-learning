import type {
  Point,
  Route,
  PlayerAlignment,
  Coverage,
  BlockingAssignment,
} from "@/domain/types";
export const LOS = 70;
export function samplePath(points: Point[], t: number): Point {
  if (!points.length) return { x: 50, y: 70 };
  if (points.length === 1) return points[0];
  const lengths = points
    .slice(1)
    .map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y));
  const total = lengths.reduce((a, b) => a + b, 0);
  if (!total) return points[0];
  let remaining = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] || i === lengths.length - 1) {
      const f = lengths[i] ? remaining / lengths[i] : 0;
      return {
        x: points[i].x + (points[i + 1].x - points[i].x) * f,
        y: points[i].y + (points[i + 1].y - points[i].y) * f,
      };
    }
    remaining -= lengths[i];
  }
  return points.at(-1)!;
}
export const flipPoint = (p: Point): Point => ({ x: 100 - p.x, y: p.y });
export function offsetRoute(route: Route, players: PlayerAlignment[]): Route {
  const player = players.find((p) => p.id === route.playerId);
  if (!player) return route;
  const start = route.waypoints[0];
  return {
    ...route,
    waypoints: route.waypoints.map((p) => ({
      x: Math.max(3, Math.min(97, p.x + player.x - start.x)),
      y: Math.max(3, Math.min(96, p.y + player.y - start.y)),
    })),
  };
}
export function defensivePosition(
  player: PlayerAlignment,
  coverage: Coverage,
  routes: Route[],
  t: number,
): Point {
  const a = coverage.assignments.find((a) => a.defenderId === player.id);
  if (!a) return player;
  if (a.type === "man" && a.targetId) {
    const route = routes.find((r) => r.playerId === a.targetId);
    if (route) {
      const target = samplePath(route.waypoints, Math.max(0, t - 0.06));
      const end = { x: target.x + 1.8, y: target.y - 2 };
      const blend = Math.min(1, t * 5);
      return {
        x: player.x + (end.x - player.x) * blend,
        y: player.y + (end.y - player.y) * blend,
      };
    }
  }
  return samplePath([player, a.destination], Math.min(1, t * 2));
}
export function blockRoutes(blocks: BlockingAssignment[]): Route[] {
  return blocks.map((b) => ({
    playerId: b.playerId,
    routeType: b.type,
    waypoints: b.waypoints,
  }));
}
export const routeLibrary = [
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
];
export function makeRoute(player: PlayerAlignment, type: string): Route {
  const { x, y } = player;
  const outside = x < 50 ? -1 : 1;
  const patterns: Record<string, Point[]> = {
    go: [{ x, y: y - 56 }],
    fade: [{ x: x + outside * 9, y: y - 48 }],
    slant: [
      { x, y: y - 9 },
      { x: x - outside * 20, y: y - 26 },
    ],
    hitch: [
      { x, y: y - 15 },
      { x: x - outside * 2, y: y - 12 },
    ],
    out: [
      { x, y: y - 23 },
      { x: x + outside * 18, y: y - 23 },
    ],
    dig: [
      { x, y: y - 33 },
      { x: x - outside * 35, y: y - 33 },
    ],
    post: [
      { x, y: y - 28 },
      { x: x - outside * 25, y: y - 52 },
    ],
    corner: [
      { x, y: y - 28 },
      { x: x + outside * 22, y: y - 48 },
    ],
    drag: [
      { x: x - outside * 10, y: y - 10 },
      { x: x - outside * 50, y: y - 10 },
    ],
    shallow: [
      { x: x - outside * 8, y: y - 6 },
      { x: x - outside * 55, y: y - 6 },
    ],
    wheel: [
      { x: x + outside * 18, y: y - 8 },
      { x: x + outside * 18, y: y - 48 },
    ],
    flat: [{ x: x + outside * 27, y: y - 8 }],
    angle: [
      { x: x + outside * 9, y: y - 9 },
      { x: x - outside * 12, y: y - 24 },
    ],
  };
  return {
    playerId: player.id,
    routeType: type,
    waypoints: [
      { x, y },
      ...(patterns[type] ?? patterns.go).map((p) => ({
        x: Math.max(4, Math.min(96, p.x)),
        y: Math.max(5, p.y),
      })),
    ],
  };
}
