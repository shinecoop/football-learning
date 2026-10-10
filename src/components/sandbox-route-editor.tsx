"use client";
import { Trash2, PenTool, Check, X } from "lucide-react";
import type { SandboxScenario } from "@/domain/sandbox";
import { RECEIVER_IDS } from "@/domain/sandbox";
import type { Route } from "@/domain/types";
import { makeRoute, routeLibrary, offsetRoute } from "@/lib/simulation";
export function SandboxRouteEditor({
  scenario,
  selected,
  onSelect,
  onChange,
  drawing,
  onBeginDrawing,
  onCancelDrawing,
  onFinishDrawing,
  disabled,
}: {
  scenario: SandboxScenario;
  selected: string;
  onSelect: (id: string) => void;
  onChange: (scenario: SandboxScenario) => void;
  drawing: boolean;
  onBeginDrawing: () => void;
  onCancelDrawing: () => void;
  onFinishDrawing: () => void;
  disabled: boolean;
}) {
  const player = scenario.players.find((p) => p.id === selected);
  const eligible = player && RECEIVER_IDS.includes(selected);
  const route = scenario.routes.find((r) => r.playerId === selected);
  const assign = (route: Route | undefined) =>
    onChange({
      ...scenario,
      conceptId: "custom",
      routes: [
        ...scenario.routes.filter((r) => r.playerId !== selected),
        ...(route ? [route] : []),
      ],
    });
  return (
    <>
      <span className="eyebrow">DRAW THE IDEA</span>
      <h2>Build the route together.</h2>
      <label className="control-label">
        Offensive player
        <select
          aria-label="Sandbox offensive player"
          value={player?.id ?? "Y"}
          onChange={(e) => onSelect(e.target.value)}
        >
          {scenario.players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.id} · {p.position}
            </option>
          ))}
        </select>
      </label>
      {player && (
        <div className="coordinate-controls">
          <label>
            X alignment
            <input
              aria-label="Offensive X alignment"
              type="number"
              min="3"
              max="97"
              step=".1"
              disabled={disabled}
              value={player.x}
              onChange={(e) => {
                const players = scenario.players.map((p) =>
                  p.id === selected
                    ? {
                        ...p,
                        x: Math.max(3, Math.min(97, Number(e.target.value))),
                      }
                    : p,
                );
                onChange({
                  ...scenario,
                  players,
                  routes: scenario.routes.map((r) =>
                    r.playerId === selected ? offsetRoute(r, players) : r,
                  ),
                });
              }}
            />
          </label>
          <label>
            Y alignment
            <input
              aria-label="Offensive Y alignment"
              type="number"
              min="71"
              max="95"
              step=".1"
              disabled={disabled}
              value={player.y}
              onChange={(e) => {
                const players = scenario.players.map((p) =>
                  p.id === selected
                    ? {
                        ...p,
                        y: Math.max(71, Math.min(95, Number(e.target.value))),
                      }
                    : p,
                );
                onChange({
                  ...scenario,
                  players,
                  routes: scenario.routes.map((r) =>
                    r.playerId === selected ? offsetRoute(r, players) : r,
                  ),
                });
              }}
            />
          </label>
        </div>
      )}
      {eligible ? (
        <>
          <div className="draw-actions">
            {drawing ? (
              <>
                <button
                  className="button primary"
                  disabled={!route || route.waypoints.length < 2}
                  onClick={onFinishDrawing}
                >
                  <Check size={14} />
                  Finish route
                </button>
                <button className="button secondary" onClick={onCancelDrawing}>
                  <X size={14} />
                  Cancel
                </button>
              </>
            ) : (
              <button
                className="button primary"
                disabled={disabled}
                onClick={onBeginDrawing}
              >
                <PenTool size={14} />
                Draw new route
              </button>
            )}
          </div>
          {drawing && (
            <p className="drawing-instruction" role="status">
              Click the field to add breaks and the destination. Drag the
              numbered points or use their coordinate inputs. Add at least one
              destination, then finish.
            </p>
          )}
          <div className="route-library sandbox-route-library">
            {routeLibrary.map((type) => (
              <button
                disabled={disabled || drawing}
                key={type}
                className={route?.routeType === type ? "active" : ""}
                onClick={() => assign(makeRoute(player, type))}
              >
                {type}
              </button>
            ))}
          </div>
          {route && (
            <>
              <div className="waypoint-heading">
                <h3>Route points</h3>
                <small>{route.waypoints.length} / 40</small>
              </div>
              <div className="waypoint-list">
                {route.waypoints.map((point, index) => (
                  <div key={index}>
                    <span>{index === 0 ? "Start" : index}</span>
                    <input
                      aria-label={`Waypoint ${index} X`}
                      type="number"
                      min="3"
                      max="97"
                      step=".1"
                      disabled={disabled || index === 0}
                      value={point.x}
                      onChange={(e) =>
                        assign({
                          ...route,
                          waypoints: route.waypoints.map((p, i) =>
                            i === index
                              ? {
                                  ...p,
                                  x: Math.max(
                                    3,
                                    Math.min(97, Number(e.target.value)),
                                  ),
                                }
                              : p,
                          ),
                        })
                      }
                    />
                    <input
                      aria-label={`Waypoint ${index} Y`}
                      type="number"
                      min="3"
                      max="97"
                      step=".1"
                      disabled={disabled || index === 0}
                      value={point.y}
                      onChange={(e) =>
                        assign({
                          ...route,
                          waypoints: route.waypoints.map((p, i) =>
                            i === index
                              ? {
                                  ...p,
                                  y: Math.max(
                                    3,
                                    Math.min(97, Number(e.target.value)),
                                  ),
                                }
                              : p,
                          ),
                        })
                      }
                    />
                    {index > 0 && (
                      <button
                        className="icon-button"
                        aria-label={`Remove waypoint ${index}`}
                        disabled={disabled}
                        onClick={() =>
                          assign(
                            route.waypoints.length <= 2
                              ? undefined
                              : {
                                  ...route,
                                  waypoints: route.waypoints.filter(
                                    (_, i) => i !== index,
                                  ),
                                },
                          )
                        }
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                className="clear-route"
                disabled={disabled}
                onClick={() => assign(undefined)}
              >
                <Trash2 size={14} />
                Clear {selected}’s route
              </button>
            </>
          )}
          <p className="subtle">
            Waypoints are straight segments. Receiver speed and release delay
            belong to Timing; curved running mechanics and collisions are not
            modeled.
          </p>
        </>
      ) : (
        <p className="subtle">
          QB and center alignments can be adjusted. Draw routes for X, H, Y, Z,
          or RB.
        </p>
      )}
    </>
  );
}
