"use client";
import Link from "next/link";
import { Trash2, ArrowRight } from "lucide-react";
import type { SandboxScenario } from "@/domain/sandbox";
import { SANDBOX_FORMATIONS, scenarioFromDesigner } from "@/domain/sandbox";
import { deleteScenario, useStore } from "@/lib/store";
export function SandboxLibrary({
  scenario,
  loadScenario,
  update,
  setMessage,
}: {
  scenario: SandboxScenario;
  loadScenario: (value: SandboxScenario) => void;
  update: (value: SandboxScenario) => void;
  setMessage: (message: string) => void;
}) {
  const { scenarios, plays } = useStore();
  return (
    <details className="panel scenario-library">
      <summary>Saved scenarios ({scenarios.length}) and designer plays</summary>
      {scenarios.length === 0 && (
        <p className="subtle">
          Save your first scenario to preserve routes, assignments, timing,
          notes, and a snapshot of the profile.
        </p>
      )}
      {scenarios.map((s) => (
        <div key={s.id} className="saved-play-row">
          <button onClick={() => loadScenario(s)}>
            <strong>{s.name}</strong>
            <small>
              {s.coverageId.replace("cover", "Cover ")} ·{" "}
              {s.releaseTime.toFixed(1)}s release
            </small>
          </button>
          <button
            className="icon-button"
            aria-label={`Delete scenario ${s.name}`}
            onClick={() => {
              deleteScenario(s.id);
              if (scenario.id === s.id) update({ ...scenario, id: "draft" });
              setMessage("Saved scenario deleted.");
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      {plays.some((p) => SANDBOX_FORMATIONS.includes(p.formationId)) && (
        <>
          <h3 className="small-heading">Import from the designer</h3>
          {plays
            .filter((p) => SANDBOX_FORMATIONS.includes(p.formationId))
            .map((p) => (
              <button
                key={p.id}
                className="designer-import"
                onClick={() => loadScenario(scenarioFromDesigner(p))}
              >
                {p.name}
                <ArrowRight size={14} />
              </button>
            ))}
        </>
      )}
      <Link href="/workspace" className="arrow-link">
        Export your workspace
        <ArrowRight size={14} />
      </Link>
    </details>
  );
}
