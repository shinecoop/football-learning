"use client";
import { useState, useRef, useEffect } from "react";
import { useStore, saveFilm } from "@/lib/store";
import { getMedia, putMedia } from "@/lib/media";
import type { LessonFilm, FilmCamera } from "@/domain/workspace-extras";
export function FilmRoom({
  lessonId,
  title,
}: {
  lessonId: string;
  title: string;
}) {
  const { films } = useStore();
  const saved = films.find((f) => f.lessonId === lessonId);
  const film: LessonFilm = saved ?? {
    id: `film-${lessonId}`,
    lessonId,
    title,
    cameras: [],
  };
  const [cameraId, setCameraId] = useState("");
  const camera = film.cameras.find((c) => c.id === cameraId) ?? film.cameras[0];
  const mediaSource = camera?.source;
  const mediaLocal = camera?.local;
  const [mediaRevision, setMediaRevision] = useState(0);
  const [source, setSource] = useState("");
  const [message, setMessage] = useState("");
  const [label, setLabel] = useState("Sideline");
  const [url, setUrl] = useState("");
  const [time, setTime] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [focusLabel, setFocusLabel] = useState("Focus receiver");
  const [duration, setDuration] = useState(3);
  const video = useRef<HTMLVideoElement>(null);
  const pendingSeek = useRef(0);
  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";
    Promise.resolve().then(async () => {
      if (!mediaSource) {
        if (!cancelled) setSource("");
        return;
      }
      if (!mediaLocal) {
        if (!cancelled) setSource(mediaSource);
        return;
      }
      try {
        const blob = await getMedia(mediaSource);
        if (cancelled) return;
        if (blob) {
          objectUrl = URL.createObjectURL(blob);
          setSource(objectUrl);
        } else {
          setSource("");
          setMessage(
            "This camera file is missing on this device. Relink the video below.",
          );
        }
      } catch {
        if (!cancelled) {
          setSource("");
          setMessage(
            "Video storage is unavailable. Try a direct HTTPS video file.",
          );
        }
      }
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [mediaSource, mediaLocal, mediaRevision]);
  const changeCamera = (id: string) => {
    const next = film.cameras.find((c) => c.id === id);
    pendingSeek.current = Math.max(
      0,
      (video.current?.currentTime ?? 0) -
        (camera?.offset ?? 0) +
        (next?.offset ?? 0),
    );
    setCameraId(id);
    setPlacing(false);
  };
  const updateCamera = (next: FilmCamera) =>
    saveFilm({
      ...film,
      cameras: film.cameras.map((c) => (c.id === next.id ? next : c)),
    });
  const addLocal = async (file: File, relink = false) => {
    try {
      if (!file.type.startsWith("video/"))
        throw new Error("Choose a video file supported by your browser.");
      const id = relink && camera ? camera.source : crypto.randomUUID();
      if (!label.trim()) throw new Error("Enter a camera view name.");
      await putMedia(id, file);
      if (relink && camera) {
        setMediaRevision((value) => value + 1);
        setMessage("Camera file relinked.");
        return;
      }
      const c: FilmCamera = {
        id: crypto.randomUUID(),
        label,
        source: id,
        local: true,
        offset: 0,
        focus: [],
      };
      saveFilm({ ...film, cameras: [...film.cameras, c] });
      setCameraId(c.id);
      setMessage(
        "Camera saved on this device. Keep the original video file separately.",
      );
    } catch (e) {
      setMessage((e as Error).message);
    }
  };
  return (
    <section className="film-panel">
      <span className="eyebrow">FILM ROOM / {title}</span>
      <h2>See the concept in the game.</h2>
      <p className="muted-copy">
        Your own clips, native playback, and multiple camera angles. Manual
        focus marks shade a chosen area for a time range; they do not
        automatically track players.
      </p>
      <div className="game-grid">
        <div>
          <label>
            Camera view
            <select
              aria-label="Camera view"
              value={camera?.id ?? ""}
              onChange={(e) => changeCamera(e.target.value)}
            >
              <option value="" disabled>
                No cameras added
              </option>
              {film.cameras.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <div className="film-stage">
            {source ? (
              <>
                <video
                  key={source}
                  ref={video}
                  src={source}
                  controls
                  playsInline
                  preload="metadata"
                  onLoadedMetadata={() => {
                    if (video.current) {
                      video.current.currentTime = Math.min(
                        pendingSeek.current,
                        video.current.duration || 0,
                      );
                      setTime(video.current.currentTime);
                    }
                  }}
                  onTimeUpdate={() => setTime(video.current?.currentTime ?? 0)}
                  onError={() =>
                    setMessage(
                      "This video could not be played. Check the file format or direct video URL.",
                    )
                  }
                />
                {camera?.focus
                  .filter((f) => time >= f.start && time <= f.end)
                  .map((f) => (
                    <div
                      className="film-highlight"
                      key={f.id}
                      style={{ left: `${f.x}%`, top: `${f.y}%` }}
                    >
                      {f.label}
                    </div>
                  ))}
                {placing && (
                  <button
                    className="film-placement"
                    aria-label="Place focus highlight on video"
                    onClick={(e) => {
                      if (!camera) return;
                      if (
                        !focusLabel.trim() ||
                        !Number.isFinite(duration) ||
                        duration <= 0 ||
                        duration > 60
                      ) {
                        setMessage(
                          "Enter a focus label and duration between 0.1 and 60 seconds.",
                        );
                        return;
                      }
                      const bounds = e.currentTarget.getBoundingClientRect();
                      updateCamera({
                        ...camera,
                        focus: [
                          ...camera.focus,
                          {
                            id: crypto.randomUUID(),
                            label: focusLabel,
                            start: time,
                            end: time + duration,
                            x:
                              e.detail === 0
                                ? 50
                                : (100 * (e.clientX - bounds.left)) /
                                  bounds.width,
                            y:
                              e.detail === 0
                                ? 50
                                : (100 * (e.clientY - bounds.top)) /
                                  bounds.height,
                          },
                        ],
                      });
                      setPlacing(false);
                      setMessage(
                        "Timed focus mark saved. This mark stays at its manually chosen position.",
                      );
                    }}
                  />
                )}
              </>
            ) : (
              <div className="film-empty">
                <h3>Your film belongs here.</h3>
                <p>Add a clip from your device or a direct video file URL.</p>
              </div>
            )}
          </div>
          {camera && (
            <>
              <label>
                Camera offset (seconds)
                <input
                  type="number"
                  min={-3600}
                  max={3600}
                  step={0.1}
                  value={camera.offset}
                  onChange={(e) => {
                    try {
                      updateCamera({
                        ...camera,
                        offset: Number(e.target.value),
                      });
                    } catch (err) {
                      setMessage((err as Error).message);
                    }
                  }}
                />
              </label>
              <p className="muted-copy">
                Set the time of the same play moment in each camera. Switching
                views preserves the play time using these offsets.
              </p>
              {camera.local && (
                <label>
                  Relink camera file
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void addLocal(f, true);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </>
          )}
        </div>
        <div>
          <h3>Add a camera</h3>
          <label>
            View name
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={100}
            />
          </label>
          <label>
            Upload game clip
            <input
              aria-label="Upload game clip"
              type="file"
              accept="video/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void addLocal(file);
                e.target.value = "";
              }}
            />
          </label>
          <label>
            Direct HTTPS video URL
            <input
              type="url"
              placeholder="https://…/game-clip.mp4"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </label>
          <button
            className="button secondary"
            onClick={() => {
              try {
                const c: FilmCamera = {
                  id: crypto.randomUUID(),
                  label,
                  source: url,
                  local: false,
                  offset: 0,
                  focus: [],
                };
                saveFilm({ ...film, cameras: [...film.cameras, c] });
                setCameraId(c.id);
                setUrl("");
                setMessage("Camera added.");
              } catch (e) {
                setMessage((e as Error).message);
              }
            }}
          >
            Add video URL
          </button>
          <h3 style={{ marginTop: 30 }}>Highlight the focus</h3>
          <label>
            Focus label
            <input
              value={focusLabel}
              maxLength={100}
              onChange={(e) => setFocusLabel(e.target.value)}
            />
          </label>
          <label>
            Highlight duration (seconds)
            <input
              type="number"
              min={0.1}
              max={60}
              step={0.1}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </label>
          <button
            className="button primary"
            disabled={!source}
            onClick={() => {
              video.current?.pause();
              setPlacing(!placing);
              setMessage(
                "Click the receiver or focus area in the video to place the highlight.",
              );
            }}
          >
            {placing ? "Cancel placement" : "Place timed highlight"}
          </button>
          {camera?.focus.map((f) => (
            <div className="saved-row" key={f.id}>
              <strong>
                {f.label}{" "}
                <small>
                  {f.start.toFixed(1)}–{f.end.toFixed(1)}s
                </small>
              </strong>
              <button
                className="icon-button"
                aria-label={`Delete highlight ${f.label}`}
                onClick={() =>
                  updateCamera({
                    ...camera,
                    focus: camera.focus.filter((x) => x.id !== f.id),
                  })
                }
              >
                ×
              </button>
            </div>
          ))}
          <p className="muted-copy">
            Workspace backups include camera metadata and highlights. Uploaded
            video files remain in this browser’s video storage; keep originals
            and relink after moving devices. Direct links must serve a
            browser-compatible video file.
          </p>
        </div>
      </div>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
