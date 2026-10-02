"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  Check,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Lightbulb,
} from "lucide-react";
import { getLesson, categories } from "@/domain/curriculum";
import { useStore, markLesson, viewLesson, blankMastery } from "@/lib/store";
import { PassingLab } from "./passing-lab";
import { FoundationLab } from "./foundation-lab";
import { PageHeading, Tag, CheckLabel } from "./ui";
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
