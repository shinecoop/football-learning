"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Clock,
  Check,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Lightbulb,
  ExternalLink,
} from "lucide-react";
import { getLesson, categories } from "@/domain/curriculum";
import { useStore, markLesson, viewLesson, blankMastery } from "@/lib/store";
import { PassingLab } from "./passing-lab";
import { FoundationLab } from "./foundation-lab";
import { PageHeading, Tag, CheckLabel } from "./ui";
interface VideoPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  destroy: () => void;
}
interface YouTubeAPI {
  ready: (callback: () => void) => void;
  Player: new (element: HTMLElement, options: {
    host: string;
    videoId: string;
    width: string;
    height: string;
    playerVars: Record<string, string | number>;
    events: { onReady: (event: { target: VideoPlayer }) => void };
  }) => VideoPlayer;
}

const lessonFilms: Partial<Record<string, { videoId: string; prompt: string }>> = {
  "four-verticals": {
    videoId: "HH5_pZqMGbE",
    prompt:
      "Look for the four vertical lanes, then follow the inside receivers and the safeties. Who carries each seam, and where does help come from? Use the diagram next to compare the spacing against different coverages.",
  },
  sail: {
    videoId: "K_3kxjsMiyQ",
    prompt:
      "Find the deep route, the intermediate sail, and the flat route on the same side. Watch how the defense rotates after the snap and how the underneath defender responds to the two shorter routes. Use the diagram next to compare the three-level spacing against different coverages.",
  },
};

function LessonVideo({ videoId, title }: { videoId: string; title: string }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    let player: VideoPlayer | undefined;
    let ready = false;
    let visible = false;
    let disposed = false;
    let started = false;
    const syncPlayback = () => {
      if (!ready || !player) return;
      if (visible && !document.hidden) player.playVideo();
      else player.pauseVideo();
    };
    const initialize = () => {
      const api = (window as Window & { YT?: YouTubeAPI }).YT;
      api?.ready(() => {
        if (disposed || started) return;
        started = true;
        const target = document.createElement("div");
        element.appendChild(target);
        player = new api.Player(target, {
          host: "https://www.youtube-nocookie.com",
          videoId,
          width: "100%",
          height: "100%",
          playerVars: {
            controls: 0,
            playsinline: 1,
            disablekb: 1,
            fs: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: ({ target }) => {
              player = target;
              ready = true;
              target.mute();
              const iframe = element.querySelector("iframe");
              if (iframe) iframe.title = `${title} — muted video study`;
              syncPlayback();
            },
          },
        });
      });
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= 0.5;
      if (visible) {
        let script = document.getElementById("youtube-iframe-api") as HTMLScriptElement | null;
        if (!script) {
          script = document.createElement("script");
          script.id = "youtube-iframe-api";
          script.src = "https://www.youtube.com/iframe_api";
          script.async = true;
          document.head.appendChild(script);
        }
        script.addEventListener("load", initialize, { once: true });
        initialize();
      }
      syncPlayback();
    }, { threshold: [0, 0.5] });
    observer.observe(element);
    document.addEventListener("visibilitychange", syncPlayback);
    return () => {
      disposed = true;
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      document.getElementById("youtube-iframe-api")?.removeEventListener("load", initialize);
      player?.destroy();
      element.replaceChildren();
    };
  }, [videoId, title]);

  return <div ref={container} className="lesson-film-player" />;
}

export function LessonPage({ id }: { id: string }) {
  const lesson = getLesson(id);
  const { progress } = useStore();
  const [tab, setTab] = useState("overview");
  const [answer, setAnswer] = useState<number>();
  useEffect(() => {
    if (lesson?.status === "ready") viewLesson(id);
  }, [id, lesson]);
  if (!lesson || lesson.status === "planned")
    return (
      <div className="empty-state">
        <BookOpen size={30} />
        <h1>
          {lesson ? "This lesson is on the roadmap." : "Lesson not found."}
        </h1>
        <p>Available lessons include teaching content and working diagrams.</p>
        <Link className="button primary" href="/learn">
          Explore the curriculum
        </Link>
      </div>
    );
  const mastery = progress.lessons[id] ?? blankMastery;
  const interactive = !["strategy", "article"].includes(lesson.kind);
  const category = categories.find((c) => c.id === lesson.categoryId);
  const film = lessonFilms[lesson.id];
  return (
    <>
      <Link href={`/learn/${lesson.categoryId}`} className="back-link">
        <ArrowLeft size={14} />
        {category?.name}
      </Link>
      <PageHeading
        eyebrow={`${category?.side.toUpperCase()} / ${category?.name.toUpperCase()}`}
        title={lesson.title}
        description={lesson.summary}
        action={
          <button
            className={`button ${mastery.completed ? "secondary" : "primary"}`}
            onClick={() => markLesson(id, { completed: !mastery.completed })}
          >
            <Check size={16} />
            {mastery.completed ? "Completed · undo" : "Mark complete"}
          </button>
        }
      />
      <div className="lesson-meta">
        <Tag>{lesson.level}</Tag>
        <span>
          <Clock size={14} />
          {lesson.minutes} min
        </span>
        <span>
          <Lightbulb size={14} />
          System-aware teaching
        </span>
      </div>
      <div className="lesson-tabs" role="tablist" aria-label="Lesson sections">
        {[
          { id: "overview", label: "Overview" },
          ...(interactive
            ? [{ id: "diagram", label: "Interactive diagram" }]
            : []),
          { id: "ideas", label: "Key ideas & mistakes" },
          ...(lesson.quiz ? [{ id: "quiz", label: "Knowledge check" }] : []),
        ].map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? "active" : ""}
            onClick={() => {
              setTab(t.id);
              if (t.id === "ideas") markLesson(id, { understanding: true });
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === "overview" && (
          <div className="lesson-overview">
            <div className="lesson-reading">
              {lesson.sections.map((s, i) => (
                <section key={s.title}>
                  <span className="eyebrow">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2>{s.title}</h2>
                  <p>{s.body}</p>
                </section>
              ))}
              {film && (
                <section className="panel lesson-film" aria-labelledby="lesson-film-title">
                  <span className="eyebrow">WATCH & RECOGNIZE</span>
                  <h2 id="lesson-film-title">Take the concept to film.</h2>
                  <p>{film.prompt}</p>
                  <LessonVideo
                    key={film.videoId}
                    videoId={film.videoId}
                    title={lesson.title}
                  />
                  <div className="lesson-film-footer">
                    <span>Plays muted while in view. For sound or playback controls, watch on YouTube.</span>
                    <a
                      className="arrow-link"
                      href={`https://www.youtube.com/watch?v=${film.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Watch on YouTube
                      <ExternalLink size={14} aria-hidden="true" />
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </div>
                </section>
              )}
              {interactive && (
                <button
                  className="button primary"
                  onClick={() => setTab("diagram")}
                >
                  Explore the diagram
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
            <aside className="panel mastery-panel">
              <span className="eyebrow">YOUR UNDERSTANDING</span>
              <h3>Build it in layers.</h3>
              <p>
                Recorded from your learning activity. Completion is a separate
                choice.
              </p>
              <CheckLabel done={mastery.completed}>Lesson completed</CheckLabel>
              <CheckLabel done={mastery.understanding}>
                Key ideas explored
              </CheckLabel>
              {interactive && (
                <CheckLabel done={mastery.interaction}>
                  Coverage or look changed
                </CheckLabel>
              )}
              {lesson.kind === "passing" && (
                <CheckLabel done={mastery.qbReads}>
                  QB teaching explored
                </CheckLabel>
              )}
              {lesson.quiz && (
                <CheckLabel done={mastery.quiz}>
                  Knowledge check passed
                </CheckLabel>
              )}
              <small>
                These are activity milestones, not a certification of coaching
                competence.
              </small>
            </aside>
          </div>
        )}
        {tab === "diagram" &&
          (lesson.kind === "passing" ? (
            <PassingLab
              key={lesson.id}
              initialConcept={lesson.entityId}
              lessonId={lesson.id}
              embedded
            />
          ) : (
            <FoundationLab key={lesson.id} lesson={lesson} />
          ))}
        {tab === "ideas" && (
          <div className="ideas-grid">
            <section className="panel">
              <span className="eyebrow">TAKEAWAYS</span>
              <h2>Keep these in mind.</h2>
              {lesson.sections.map((s) => (
                <div className="idea-point" key={s.title}>
                  <Check size={17} />
                  <div>
                    <h3>{s.title}</h3>
                    <p>{s.body}</p>
                  </div>
                </div>
              ))}
            </section>
            <section className="panel">
              <span className="eyebrow">COMMON MISTAKES</span>
              <h2>Where the picture can break.</h2>
              {lesson.mistakes.map((m) => (
                <p key={m}>{m}</p>
              ))}
              <div className="note-box">
                <p>
                  “One common implementation” is intentional. Staffs use
                  different terminology, techniques, and progression rules.
                </p>
              </div>
            </section>
          </div>
        )}
        {tab === "quiz" && lesson.quiz && (
          <section className="panel quiz-panel">
            <span className="eyebrow">KNOWLEDGE CHECK</span>
            <h2>{lesson.quiz.prompt}</h2>
            <div className="quiz-options">
              {lesson.quiz.options.map((o, i) => (
                <button
                  key={o}
                  disabled={answer !== undefined}
                  className={
                    answer !== undefined
                      ? i === lesson.quiz!.answer
                        ? "correct"
                        : answer === i
                          ? "incorrect"
                          : ""
                      : ""
                  }
                  onClick={() => {
                    setAnswer(i);
                    if (i === lesson.quiz!.answer)
                      markLesson(id, { quiz: true, recognition: true });
                  }}
                >
                  <span>{String.fromCharCode(65 + i)}</span>
                  {o}
                </button>
              ))}
            </div>
            {answer !== undefined && (
              <div className="quiz-feedback">
                <h3>
                  {answer === lesson.quiz.answer
                    ? "Correct."
                    : "Keep the responsibilities in view."}
                </h3>
                <p>{lesson.quiz.explanation}</p>
                <button
                  className="button secondary"
                  onClick={() => setAnswer(undefined)}
                >
                  Try again
                </button>
              </div>
            )}
          </section>
        )}
      </div>
      {lesson.related.some((r) => getLesson(r)?.status === "ready") && (
        <section className="related-section">
          <div className="section-header">
            <h2>Connect the concepts</h2>
          </div>
          <div className="recent-list">
            {[...new Set(lesson.related)]
              .filter((r) => r !== id && getLesson(r)?.status === "ready")
              .map((r) => (
                <Link key={r} href={`/lesson/${r}`}>
                  <BookOpen size={16} />
                  <strong>{getLesson(r)?.title}</strong>
                  <ArrowRight size={15} />
                </Link>
              ))}
          </div>
        </section>
      )}
    </>
  );
}
