"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, Save, Trash2, ArrowRight } from "lucide-react";
import { newProfile } from "@/domain/sandbox";
import type { OpponentProfile } from "@/domain/sandbox";
import { useStore, saveProfile, deleteProfile } from "@/lib/store";
import { PageHeading, Tag } from "./ui";
import { ProfileEditor } from "./profile-editor";
export function Profiles() {
  const { profiles, scenarios } = useStore();
  const [edited, setDraft] = useState<OpponentProfile>();
  const draft =
    edited ?? profiles.find((p) => p.id === "default") ?? newProfile();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const save = () => {
    try {
      saveProfile({
        ...draft,
        name: draft.name.trim(),
        updatedAt: new Date().toISOString(),
      });
      setError("");
      setMessage("Profile saved. Open the sandbox to test these assumptions.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Profile could not be saved.");
    }
  };
  return (
    <>
      <PageHeading
        eyebrow="OBSERVATION BEFORE PREDICTION"
        title="Describe the opponent."
        description="Record what you see on film, separate technique from alignment, and keep uncertainty visible."
        action={
          <button className="button primary" onClick={save}>
            <Save size={15} />
            Save profile
          </button>
        }
      />
      <div className="notice-banner">
        <strong>Film-informed, not film-calibrated.</strong> Ratings steer the
        illustrative movement engine. No profile can establish accurate outcome
        probabilities without validation against held-out examples.
      </div>
      <div className="profiles-layout">
        <aside className="panel profile-library">
          <div className="section-header compact">
            <h3>Your profiles</h3>
            <button
              className="icon-button"
              aria-label="Create opponent profile"
              onClick={() => {
                setDraft({
                  ...newProfile(),
                  id: crypto.randomUUID(),
                  name: "New opponent",
                  notes: "",
                });
                setMessage("New profile draft. Save when ready.");
                setError("");
              }}
            >
              <Plus size={19} />
            </button>
          </div>
          {profiles.map((p) => {
            const count = scenarios.filter((s) => s.profileId === p.id).length;
            return (
              <div
                key={p.id}
                className={`profile-library-row ${draft.id === p.id ? "active" : ""}`}
              >
                <button
                  onClick={() => {
                    setDraft(structuredClone(p));
                    setMessage("");
                    setError("");
                  }}
                >
                  <strong>{p.name}</strong>
                  <small>
                    {p.confidence} · {p.observations.length} observations
                  </small>
                </button>
                {p.id !== "default" && (
                  <button
                    className="icon-button"
                    aria-label={`Delete profile ${p.name}`}
                    disabled={count > 0}
                    title={count ? "Used by saved scenarios" : ""}
                    onClick={() => {
                      try {
                        deleteProfile(p.id);
                        if (draft.id === p.id) setDraft(undefined);
                        setMessage("Profile deleted.");
                      } catch (e) {
                        setError(
                          e instanceof Error
                            ? e.message
                            : "Could not delete profile.",
                        );
                      }
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                {count > 0 && (
                  <small className="profile-in-use">
                    Used by {count} saved{" "}
                    {count === 1 ? "scenario" : "scenarios"}
                  </small>
                )}
              </div>
            );
          })}
          <div className="note-box">
            <p>
              Save profiles and scenarios locally. Use Workspace Data to export
              them before changing devices.
            </p>
          </div>
          <Link className="arrow-link" href="/sandbox">
            Explore in the sandbox
            <ArrowRight size={14} />
          </Link>
        </aside>
        <section className="panel profile-workspace">
          <div className="section-header compact">
            <h2>Opponent assumptions</h2>
            <Tag>
              {draft.id === "default" ? "Editable baseline" : "Custom profile"}
            </Tag>
          </div>
          <ProfileEditor
            value={draft}
            onChange={(value) => {
              setDraft(value);
              setMessage("Unsaved changes.");
            }}
          />
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          <div className="form-footer">
            <span role="status">{message}</span>
            <button className="button primary" onClick={save}>
              <Save size={15} />
              Save profile
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
