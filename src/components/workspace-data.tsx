"use client";
import { useState } from "react";
import { Download, Upload, Check, FileJson, ShieldCheck } from "lucide-react";
import {
  useStore,
  exportWorkspace,
  restoreWorkspace,
  savePlay,
} from "@/lib/store";
import { decodeBackup, decodeDesignerPlay } from "@/lib/workspace-codec";
import type { WorkspaceData } from "@/lib/workspace-codec";
import type { SavedPlay } from "@/domain/types";
import { PageHeading, Tag } from "./ui";
function downloadJson(raw: string, name: string) {
  const url = URL.createObjectURL(
    new Blob([raw], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
export function WorkspaceDataPage() {
  const store = useStore();
  const [raw, setRaw] = useState("");
  const [kind, setKind] = useState<"workspace" | "play">("workspace");
  const [preview, setPreview] = useState<WorkspaceData>();
  const [previewPlay, setPreviewPlay] = useState<SavedPlay>();
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [acknowledged, setAcknowledged] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const review = (source = raw) => {
    try {
      setError("");
      setPreview(undefined);
      setPreviewPlay(undefined);
      if (kind === "workspace") setPreview(decodeBackup(source));
      else
        setPreviewPlay(
          decodeDesignerPlay(
            source,
            "import-preview",
            new Date().toISOString(),
          ),
        );
      setMessage("Validated. Review the contents, then import.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read this file.");
      setMessage("Nothing has been imported.");
    }
  };
  const importData = () => {
    try {
      if (kind === "workspace") {
        if (!preview) throw new Error("Validate the backup first.");
        if (mode === "replace" && !acknowledged)
          throw new Error("Acknowledge replacement first.");
        restoreWorkspace(raw, mode);
      } else {
        if (!previewPlay) throw new Error("Validate the play first.");
        savePlay({
          ...previewPlay,
          id: crypto.randomUUID(),
          updatedAt: new Date().toISOString(),
        });
      }
      setMessage(
        kind === "workspace"
          ? "Workspace imported. Existing progress is preserved when merging."
          : "Designer play imported. It is available in the play designer and supported sandbox formations.",
      );
      setPreview(undefined);
      setPreviewPlay(undefined);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    }
  };
  return (
    <>
      <PageHeading
        eyebrow="LOCAL FIRST · PORTABLE BY DESIGN"
        title="Keep your work with you."
        description="Back up games, player libraries, routes, opponent observations, clip settings, and learning progress. Video files stay on this device; keep originals for relinking."
        action={
          <button
            className="button primary"
            onClick={() => {
              try {
                downloadJson(
                  exportWorkspace(),
                  `fieldwork-workspace-${new Date().toISOString().slice(0, 10)}.json`,
                );
                setMessage("Workspace backup exported.");
                setError("");
              } catch (e) {
                setError(
                  e instanceof Error
                    ? e.message
                    : "Backup could not be exported.",
                );
              }
            }}
          >
            <Download size={15} />
            Export workspace
          </button>
        }
      />
      <div className="workspace-stats">
        {[
          { label: "Saved designer plays", count: store.plays.length },
          { label: "Opponent profiles", count: store.profiles.length },
          { label: "Saved scenarios", count: store.scenarios.length },
          { label: "Saved games", count: store.games.length },
          { label: "Player profiles", count: store.playerProfiles.length },
          { label: "Lesson film rooms", count: store.films.length },
          {
            label: "Learning records",
            count: Object.keys(store.progress.lessons).length,
          },
        ].map((s) => (
          <div key={s.label}>
            <strong>{s.count}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
      <div className="data-layout">
        <section className="panel data-import">
          <span className="eyebrow">VALIDATE BEFORE IMPORTING</span>
          <h2>Restore or bring in a play.</h2>
          <div className="form-grid">
            <label>
              Import type
              <select
                aria-label="Import type"
                value={kind}
                onChange={(e) => {
                  setKind(e.target.value as typeof kind);
                  setPreview(undefined);
                  setPreviewPlay(undefined);
                  setError("");
                  setMessage("");
                }}
              >
                <option value="workspace">Full Fieldwork workspace</option>
                <option value="play">Designer play JSON</option>
              </select>
            </label>
            <label>
              Choose JSON file
              <input
                aria-label="Choose import JSON file"
                type="file"
                accept=".json,application/json"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 2000000) {
                    setError("Use a JSON file smaller than 2 MB.");
                    return;
                  }
                  try {
                    const text = await file.text();
                    setRaw(text);
                    review(text);
                  } catch {
                    setError("The file could not be read.");
                  }
                }}
              />
            </label>
          </div>
          <label className="notes-label">
            Or paste exported JSON
            <textarea
              aria-label="Import JSON"
              rows={7}
              value={raw}
              maxLength={2000000}
              spellCheck={false}
              placeholder="Paste a Fieldwork workspace backup or designer play export…"
              onChange={(e) => {
                setRaw(e.target.value);
                setPreview(undefined);
                setPreviewPlay(undefined);
                setError("");
                setMessage("");
              }}
            />
          </label>
          <button
            className="button secondary"
            disabled={!raw.trim()}
            onClick={() => review()}
          >
            <FileJson size={15} />
            Validate import
          </button>
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          {(preview || previewPlay) && (
            <div className="import-preview">
              <div className="section-header compact">
                <h3>
                  <Check size={15} /> Validated contents
                </h3>
                <Tag green>{preview ? "Workspace v2" : "Designer play"}</Tag>
              </div>
              {preview ? (
                <>
                  <p>
                    {preview.games.length} games ·{" "}
                    {preview.playerProfiles.length} players ·{" "}
                    {preview.films.length} film rooms · {preview.plays.length}{" "}
                    plays · {preview.profiles.length} profiles ·{" "}
                    {preview.scenarios.length} scenarios ·{" "}
                    {Object.keys(preview.progress.lessons).length} learning
                    records
                  </p>
                  <label className="control-label">
                    Import behavior
                    <select
                      aria-label="Import behavior"
                      value={mode}
                      onChange={(e) => {
                        setMode(e.target.value as typeof mode);
                        setAcknowledged(false);
                      }}
                    >
                      <option value="merge">
                        Merge with current workspace
                      </option>
                      <option value="replace">Replace current workspace</option>
                    </select>
                  </label>
                  <p className="subtle">
                    Merge updates matching saved items and retains earned lesson
                    milestones. Training totals are not added twice. Replace
                    uses only the imported backup.
                  </p>
                  {mode === "replace" && (
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        aria-label="Confirm workspace replacement"
                        checked={acknowledged}
                        onChange={(e) => setAcknowledged(e.target.checked)}
                      />
                      I have exported my current workspace and want to replace
                      it.
                    </label>
                  )}
                </>
              ) : (
                <p>
                  <strong>{previewPlay?.name}</strong> ·{" "}
                  {previewPlay?.routes.length} routes
                </p>
              )}
              <button
                className="button primary"
                disabled={
                  kind === "workspace" && mode === "replace" && !acknowledged
                }
                onClick={importData}
              >
                <Upload size={15} />
                {kind === "workspace" ? "Import workspace" : "Import play"}
              </button>
            </div>
          )}
          <p className="import-status" role="status">
            {message}
          </p>
        </section>
        <aside className="panel data-explanation">
          <ShieldCheck size={27} />
          <h2>Your browser is the workspace.</h2>
          <p>
            Data stays on this device until you export it. A backup includes
            saved plays, profile ratings, film references and notes, saved
            scenario assumptions, and learning activity.
          </p>
          <p>
            Older Fieldwork v1 workspace data is migrated when loaded.
            Validation checks player IDs, coordinates, assignments, ratings,
            relationships, and record limits before saving imported data.
          </p>
          <div className="note-box">
            <p>
              Deleting browser storage removes local work. Export a backup
              before switching browsers or devices. This is a portability
              foundation; it does not provide authentication or cloud sync.
            </p>
          </div>
          <h3 className="small-heading">A useful coaching habit</h3>
          <p>
            Export after a reviewed session, keep the profile observations with
            the scenario, and compare the same assumptions when revisiting film.
          </p>
        </aside>
      </div>
    </>
  );
}
