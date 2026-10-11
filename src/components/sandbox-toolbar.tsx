"use client";
import type { SandboxScenario, SandboxCoverageId } from "@/domain/sandbox";
import {
  createScenario,
  withCoverage,
  sandboxCoverage,
  SANDBOX_COVERAGES,
  SANDBOX_FORMATIONS,
} from "@/domain/sandbox";
import { concepts } from "@/domain/concepts";
import { formations } from "@/domain/formations";
export function SandboxToolbar({
  scenario,
  drawing,
  update,
  setSelected,
  setMessage,
}: {
  scenario: SandboxScenario;
  drawing: boolean;
  update: (
    value: SandboxScenario | ((current: SandboxScenario) => SandboxScenario),
  ) => void;
  setSelected: (id: string) => void;
  setMessage: (message: string) => void;
}) {
  return (
    <div className="sandbox-toolbar">
      <label>
        Scenario name
        <input
          aria-label="Scenario name"
          maxLength={120}
          value={scenario.name}
          onChange={(e) => {
            const name = e.target.value;
            update((s) => ({ ...s, name }));
          }}
        />
      </label>
      <label>
        Starting concept
        <select
          aria-label="Starting concept"
          value={scenario.conceptId}
          disabled={drawing}
          onChange={(e) => {
            const conceptId = e.target.value;
            update((s) => {
              const next = createScenario(
                conceptId,
                s.coverageId,
                s.formationId,
              );
              if (conceptId === "custom") {
                next.conceptId = "custom";
                next.routes = [];
              }
              return {
                ...next,
                lineup: s.lineup,
                receivers: s.receivers,
                defenders: Object.fromEntries(Object.entries(next.defenders).map(([id, settings]) => [id, { ...settings, ratings: s.defenders[id]?.ratings }])),
                profileId: s.profileId,
                profileSnapshot: s.profileSnapshot,
              };
            });
            setSelected("Y");
          }}
        >
          <option value="custom">Custom routes</option>
          {concepts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Formation
        <select
          aria-label="Sandbox formation"
          value={scenario.formationId}
          disabled={drawing}
          onChange={(e) => {
            const formationId = e.target.value;
            update((s) => {
              const next = createScenario(
                s.conceptId,
                s.coverageId,
                formationId,
              );
              if (s.conceptId === "custom") {
                next.conceptId = "custom";
                next.routes = [];
              }
              return {
                ...next,
                lineup: s.lineup,
                receivers: s.receivers,
                defenders: Object.fromEntries(Object.entries(next.defenders).map(([id, settings]) => [id, { ...settings, ratings: s.defenders[id]?.ratings }])),
                profileId: s.profileId,
                profileSnapshot: s.profileSnapshot,
              };
            });
            setMessage(
              "Formation changed. Custom routes are cleared; Undo restores the previous idea.",
            );
          }}
        >
          {formations
            .filter((f) => SANDBOX_FORMATIONS.includes(f.id))
            .map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
        </select>
      </label>
      <label>
        Coverage preset
        <select
          aria-label="Sandbox coverage preset"
          value={scenario.coverageId}
          disabled={drawing}
          onChange={(e) => {
            const coverageId = e.target.value as SandboxCoverageId;
            update((s) => withCoverage(s, coverageId));
          }}
        >
          {SANDBOX_COVERAGES.map((id) => (
            <option key={id} value={id}>
              {sandboxCoverage(id).name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
