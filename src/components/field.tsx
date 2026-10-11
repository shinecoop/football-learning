"use client";
import { useId, useRef } from "react";
import type {
  Point,
  PlayerAlignment,
  Route,
  Coverage,
  BlockingAssignment,
} from "@/domain/types";
import {
  samplePath,
  defensivePosition,
  offsetRoute,
  flipPoint,
  LOS,
} from "@/lib/simulation";
interface Props {
  players: PlayerAlignment[];
  playerLabels?: Record<string, { name: string; caption: string }>;
  routes?: Route[];
  coverage?: Coverage;
  defenders?: PlayerAlignment[];
  blocks?: BlockingAssignment[];
  rushers?: string[];
  motion?: Route;
  motionMan?: boolean;
  time?: number;
  flipped?: boolean;
  labels?: boolean;
  showRoutes?: boolean;
  showZones?: boolean;
  showAssignments?: boolean;
  selected?: string;
  highlight?: string;
  stress?: Point;
  onSelect?: (id: string) => void;
  onMove?: (id: string, p: Point) => void;
  title?: string;
  hideCoverageNames?: boolean;
  preview?: boolean;
  positions?: Record<string, Point>;
  editableDefense?: boolean;
  onFieldPoint?: (point: Point) => void;
  editableWaypoints?: Point[];
  onWaypointMove?: (index: number, point: Point) => void;
  throwTarget?: string;
  onMoveStart?: () => void;
  onMoveEnd?: () => void;
}
export function FootballField({
  players,
  playerLabels = {},
  routes = [],
  coverage,
  defenders,
  blocks = [],
  rushers = [],
  motion,
  motionMan = false,
  time = 0,
  flipped = false,
  labels = true,
  showRoutes = true,
  showZones = true,
  showAssignments = false,
  selected,
  highlight,
  stress,
  onSelect,
  onMove,
  title = "Interactive football field",
  hideCoverageNames = false,
  preview = false,
  positions,
  editableDefense = false,
  onFieldPoint,
  editableWaypoints = [],
  onWaypointMove,
  throwTarget,
  onMoveEnd,
  onMoveStart,
}: Props) {
  const unique = useId().replace(/:/g, "");
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<string | null>(null);
  const waypointDrag = useRef<number | null>(null);
  const moved = useRef(false);
  const suppressClick = useRef(false);
  const transformed = (p: Point) => (flipped ? flipPoint(p) : p);
  const offenseRoutes = routes.map((r) => offsetRoute(r, players));
  const fieldDefenders = defenders ?? coverage?.defenders ?? [];
  const poly = (points: Point[]) =>
    points
      .map((p) => {
        const q = transformed(p);
        return `${q.x},${q.y}`;
      })
      .join(" ");
  const eventPoint = (e: {
    clientX: number;
    clientY: number;
  }): Point | undefined => {
    const matrix = svg.current?.getScreenCTM();
    if (!matrix) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(
      matrix.inverse(),
    );
    return {
      x:
        Math.round(Math.max(3, Math.min(97, flipped ? 100 - p.x : p.x)) * 10) /
        10,
      y: Math.round(Math.max(3, Math.min(97, p.y)) * 10) / 10,
    };
  };
  const move = (e: React.PointerEvent<SVGSVGElement>) => {
    const p = eventPoint(e);
    if (!p) return;
    if (waypointDrag.current !== null && onWaypointMove) {
      moved.current = true;
      onWaypointMove(waypointDrag.current, p);
      return;
    }
    if (!drag.current || !onMove) return;
    const defense = fieldDefenders.some((d) => d.id === drag.current);
    moved.current = true;
    onMove(drag.current, {
      x: Math.max(
        editableDefense ? 3 : 5,
        Math.min(editableDefense ? 97 : 95, p.x),
      ),
      y: defense ? Math.min(69, p.y) : Math.max(71, Math.min(95, p.y)),
    });
  };
  const endDrag = () => {
    suppressClick.current = Boolean(
      moved.current || drag.current || waypointDrag.current !== null,
    );
    if (drag.current || waypointDrag.current !== null) onMoveEnd?.();
    drag.current = null;
    waypointDrag.current = null;
    moved.current = false;
  };
  return (
    <div className="field-wrap">
      <svg
        ref={svg}
        className="football-field"
        viewBox="0 0 100 100"
        preserveAspectRatio={preview ? "none" : "xMidYMid meet"}
        role="group"
        aria-label={title}
        onPointerMove={move}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClick={(e) => {
          if (suppressClick.current) {
            suppressClick.current = false;
            return;
          }
          const p = eventPoint(e);
          if (p && onFieldPoint && time === 0) onFieldPoint(p);
        }}
      >
        <title>{title}</title>
        <defs>
          <pattern
            id={`grass-${unique}`}
            width="100"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <rect width="100" height="10" fill="#315a4c" />
            <rect y="10" width="100" height="10" fill="#345e4f" />
          </pattern>
          {["route", "block", "rush", "motion"].map((name, i) => (
            <marker
              key={name}
              id={`${name}-${unique}`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="3.4"
              markerHeight="3.4"
              orient="auto-start-reverse"
            >
              <path
                d="M 0 0 L 10 5 L 0 10 z"
                fill={["#e6d095", "#b6d4c5", "#deaa9e", "#d4bbec"][i]}
              />
            </marker>
          ))}
        </defs>
        <rect
          x="0"
          y="0"
          width="100"
          height="100"
          rx="1.5"
          fill={`url(#grass-${unique})`}
        />
        {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((y) => (
          <g key={y}>
            <line
              x1="3"
              x2="97"
              y1={y}
              y2={y}
              stroke="#ffffff"
              strokeOpacity=".17"
              strokeWidth=".22"
            />
            {[8, 92].map((x) => (
              <text
                key={x}
                x={x}
                y={y - 1}
                fontSize="2.2"
                fill="#ffffff"
                opacity=".45"
                textAnchor="middle"
              >
                {50 - Math.abs(30 - y) / 2}
              </text>
            ))}
          </g>
        ))}
        {Array.from({ length: 45 }, (_, i) => i * 2 + 5).map((y) => (
          <g key={y}>
            <line
              x1="36"
              x2="37.2"
              y1={y}
              y2={y}
              stroke="white"
              strokeOpacity=".25"
              strokeWidth=".22"
            />
            <line
              x1="62.8"
              x2="64"
              y1={y}
              y2={y}
              stroke="white"
              strokeOpacity=".25"
              strokeWidth=".22"
            />
          </g>
        ))}
        <line
          x1="3"
          x2="97"
          y1={LOS}
          y2={LOS}
          stroke="#d9c88f"
          strokeOpacity=".65"
          strokeWidth=".38"
          strokeDasharray="1.5 1"
        />
        <text x="4" y="69" fill="#e4d8b5" fontSize="1.8">
          LOS
        </text>
        {showZones &&
          coverage?.zones.map((z) => (
            <g key={z.id}>
              <rect
                x={flipped ? 100 - z.x - z.width : z.x}
                y={z.y}
                width={z.width}
                height={z.height}
                rx="3"
                fill={z.deep ? "#a6c7bb" : "#d4d6bb"}
                fillOpacity=".12"
                stroke="#c1d3c7"
                strokeOpacity=".32"
                strokeDasharray="1 1"
                strokeWidth=".28"
              />
              {!hideCoverageNames && (
                <text
                  x={transformed({ x: z.x + z.width / 2, y: 0 }).x}
                  y={z.y + z.height / 2}
                  textAnchor="middle"
                  fill="#e4eee6"
                  opacity=".6"
                  fontSize="1.8"
                >
                  {z.name}
                </text>
              )}
            </g>
          ))}
        {stress && (
          <ellipse
            cx={transformed(stress).x}
            cy={stress.y}
            rx="10"
            ry="8"
            fill="#e6d095"
            fillOpacity=".1"
            stroke="#e6d095"
            strokeOpacity=".55"
            strokeDasharray="1.2 .8"
            strokeWidth=".35"
          />
        )}
        {showRoutes &&
          offenseRoutes.map((r) => (
            <polyline
              key={r.playerId}
              points={poly(r.waypoints)}
              fill="none"
              stroke={r.playerId === selected ? "#fff4d1" : "#e6d095"}
              strokeOpacity={selected && selected !== r.playerId ? ".6" : ".9"}
              strokeWidth={r.playerId === selected ? ".65" : ".42"}
              strokeLinejoin="round"
              markerEnd={`url(#route-${unique})`}
            />
          ))}
        {showRoutes &&
          blocks.map((b) => (
            <polyline
              key={b.playerId}
              points={poly(b.waypoints)}
              fill="none"
              stroke="#b6d4c5"
              strokeWidth=".5"
              strokeDasharray={b.type === "pull" ? "1 .6" : undefined}
              markerEnd={`url(#block-${unique})`}
            />
          ))}
        {showRoutes && motion && (
          <polyline
            points={poly(motion.waypoints)}
            fill="none"
            stroke="#d4bbec"
            strokeWidth=".6"
            strokeDasharray="1.2 .8"
            markerEnd={`url(#motion-${unique})`}
          />
        )}
        {showRoutes &&
          fieldDefenders
            .filter((d) => rushers.includes(d.id))
            .map((d) => (
              <polyline
                key={`rush-${d.id}`}
                points={poly([d, { x: 50 + (d.x - 50) * 0.35, y: 83 }])}
                fill="none"
                stroke="#deaa9e"
                strokeWidth=".48"
                markerEnd={`url(#rush-${unique})`}
              />
            ))}
        {showAssignments &&
          coverage?.assignments.map((a) => {
            const player = fieldDefenders.find((p) => p.id === a.defenderId);
            const target = a.targetId
              ? players.find((p) => p.id === a.targetId)
              : a.destination;
            return player && target ? (
              <line
                key={`assign-${a.defenderId}`}
                x1={transformed(player).x}
                y1={player.y}
                x2={transformed(target).x}
                y2={target.y}
                stroke="#ffffff"
                strokeOpacity=".28"
                strokeDasharray=".8 .8"
                strokeWidth=".25"
              />
            ) : null;
          })}
        {[...players, ...fieldDefenders].map((p) => {
          let pos: Point = p;
          if (p.side === "offense") {
            const m = motion?.playerId === p.id ? motion : undefined;
            const route = offenseRoutes.find((r) => r.playerId === p.id);
            const block = blocks.find((b) => b.playerId === p.id);
            if (m) pos = samplePath(m.waypoints, time);
            else if (route) pos = samplePath(route.waypoints, time);
            else if (block) pos = samplePath(block.waypoints, time);
          } else if (motion) {
            if (p.id === "SR" && motionMan) {
              const moving = samplePath(motion.waypoints, time);
              pos = { x: moving.x, y: 57 };
            } else if (!motionMan && p.id === "A")
              pos = samplePath([p, { x: 80, y: 57 }], time);
          } else if (rushers.includes(p.id))
            pos = samplePath([p, { x: 50 + (p.x - 50) * 0.35, y: 83 }], time);
          else if (coverage)
            pos = defensivePosition(p, coverage, offenseRoutes, time);
          if (positions?.[p.id]) pos = positions[p.id];
          const q = transformed(pos);
          const chosen = selected === p.id;
          const lit = highlight === p.id;
          const identity = p.side === "offense" ? playerLabels[p.id] : undefined;
          const badgeWidth = identity ? Math.min(20, Math.max(10, identity.caption.length * 0.8 + 2)) : 0;
          const badgeX = Math.max(badgeWidth / 2 + 1, Math.min(99 - badgeWidth / 2, q.x));
          const badgeY = q.y > 92 ? q.y - 5.3 : q.y + 3;
          return (
            <g
              key={`${p.side}-${p.id}`}
              role={onSelect ? "button" : undefined}
              tabIndex={onSelect ? 0 : undefined}
              aria-label={`${p.id}, ${p.position}, ${p.side}${identity ? `, ${identity.name}` : ""}${lit ? ", key defender" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.(p.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect?.(p.id);
                }
                if (
                  onMove &&
                  (p.side === "offense" || editableDefense) &&
                  time === 0 &&
                  ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
                    e.key,
                  )
                ) {
                  e.preventDefault();
                  onMoveStart?.();
                  onMove(p.id, {
                    x: Math.max(
                      editableDefense ? 3 : 5,
                      Math.min(
                        editableDefense ? 97 : 95,
                        p.x +
                          (e.key === "ArrowLeft"
                            ? -1
                            : e.key === "ArrowRight"
                              ? 1
                              : 0) *
                            (flipped ? -1 : 1),
                      ),
                    ),
                    y: Math.max(
                      p.side === "defense" ? 3 : 71,
                      Math.min(
                        p.side === "defense" ? 69 : 95,
                        p.y +
                          (e.key === "ArrowUp"
                            ? -1
                            : e.key === "ArrowDown"
                              ? 1
                              : 0),
                      ),
                    ),
                  });
                  onMoveEnd?.();
                }
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onSelect?.(p.id);
                moved.current = false;
                suppressClick.current = false;
                if (
                  onMove &&
                  (p.side === "offense" || editableDefense) &&
                  time === 0
                ) {
                  onMoveStart?.();
                  drag.current = p.id;
                  svg.current?.setPointerCapture(e.pointerId);
                }
              }}
              style={{
                cursor: !onSelect
                  ? "default"
                  : onMove &&
                      (p.side === "offense" || editableDefense) &&
                      time === 0
                    ? "grab"
                    : "pointer",
                touchAction: "none",
              }}
            >
              {identity && <title>{p.id} · {identity.name}</title>}
              {(chosen || lit) && (
                <circle
                  cx={q.x}
                  cy={q.y}
                  r="2.8"
                  fill="none"
                  stroke={lit ? "#e6d095" : "white"}
                  strokeWidth=".55"
                  strokeDasharray={lit ? "1 .5" : undefined}
                />
              )}
              {p.side === "offense" ? (
                <circle
                  cx={q.x}
                  cy={q.y}
                  r="1.9"
                  fill={chosen ? "#e6d095" : "#eef0e9"}
                  stroke="#274b3f"
                  strokeWidth=".35"
                />
              ) : (
                <rect
                  x={q.x - 1.8}
                  y={q.y - 1.8}
                  width="3.6"
                  height="3.6"
                  rx=".8"
                  fill={lit ? "#e6d095" : "#29463d"}
                  stroke={lit ? "#e6d095" : "#bbd2c6"}
                  strokeWidth=".35"
                />
              )}
              {labels && (
                <text
                  x={q.x}
                  y={q.y + 0.65}
                  textAnchor="middle"
                  fontSize={p.id.length > 2 ? "1.2" : "1.6"}
                  fontWeight="700"
                  fill={p.side === "offense" || lit ? "#213d33" : "#e1ebe4"}
                  pointerEvents="none"
                >
                  {p.label}
                </text>
              )}
              {labels && identity && (
                <g className="player-identity-badge" pointerEvents="none" aria-hidden="true">
                  <rect x={badgeX - badgeWidth / 2} y={badgeY} width={badgeWidth} height="2.8" rx=".8" fill="#172b3a" fillOpacity=".94" stroke="#f5a35b" strokeWidth=".15" />
                  <text x={badgeX} y={badgeY + 1.85} textAnchor="middle" fontSize="1.35" fontWeight="600" fill="#fff4e8">
                    {identity.caption}
                  </text>
                </g>
              )}
            </g>
          );
        })}
        {throwTarget && positions?.QB && positions[throwTarget] && (
          <line
            x1={transformed(positions.QB).x}
            y1={positions.QB.y}
            x2={transformed(positions[throwTarget]).x}
            y2={positions[throwTarget].y}
            stroke="#edf4e7"
            strokeWidth=".5"
            strokeDasharray="1.3 .8"
            pointerEvents="none"
          />
        )}
        {editableWaypoints.map((p, index) => {
          const q = transformed(p);
          return (
            <g
              key={index}
              role="button"
              tabIndex={0}
              aria-label={`Route waypoint ${index + 1}`}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => {
                e.stopPropagation();
                if (time !== 0) return;
                onMoveStart?.();
                waypointDrag.current = index;
                moved.current = false;
                svg.current?.setPointerCapture(e.pointerId);
              }}
              onKeyDown={(e) => {
                if (
                  time === 0 &&
                  ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
                    e.key,
                  )
                ) {
                  e.preventDefault();
                  onMoveStart?.();
                  onWaypointMove?.(index, {
                    x: Math.max(
                      3,
                      Math.min(
                        97,
                        p.x +
                          (e.key === "ArrowLeft"
                            ? -1
                            : e.key === "ArrowRight"
                              ? 1
                              : 0) *
                            (flipped ? -1 : 1),
                      ),
                    ),
                    y: Math.max(
                      3,
                      Math.min(
                        97,
                        p.y +
                          (e.key === "ArrowUp"
                            ? -1
                            : e.key === "ArrowDown"
                              ? 1
                              : 0),
                      ),
                    ),
                  });
                  onMoveEnd?.();
                }
              }}
            >
              <circle
                cx={q.x}
                cy={q.y}
                r="1.4"
                fill="#d9b8e5"
                stroke="#fff"
                strokeWidth=".3"
              />
              <text
                x={q.x}
                y={q.y + 0.5}
                fontSize="1.1"
                textAnchor="middle"
                fill="#28372e"
                pointerEvents="none"
              >
                {index + 1}
              </text>
            </g>
          );
        })}
        <ellipse
          cx={transformed({ x: 50, y: 74 }).x}
          cy="74"
          rx=".65"
          ry="1"
          fill="#b28c65"
          stroke="#ead7b6"
          strokeWidth=".2"
        />
      </svg>
      <div className="field-legend">
        <span>
          <i className="dot light" />
          Offense
        </span>
        <span>
          <i className="dot dark" />
          Defense
        </span>
        {highlight && (
          <span>
            <i className="dot gold" />
            Key defender
          </span>
        )}
        <span className="legend-note">Schematic · not a prediction</span>
      </div>
    </div>
  );
}
