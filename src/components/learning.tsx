"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Clock,
  BookOpen,
  Target,
  Waypoints,
  Check,
  Search,
  Layers,
} from "lucide-react";
import { categories, lessons, getLesson } from "@/domain/curriculum";
import { concepts } from "@/domain/concepts";
import { formations } from "@/domain/formations";
import { coverages } from "@/domain/coverage";
import { glossary } from "@/domain/glossary";
import { useStore } from "@/lib/store";
import { FootballField } from "./field";
import { PageHeading, CategoryIcon, ArrowLink, Tag, EmptyState } from "./ui";
export function Dashboard() {
  const { progress } = useStore();
  const [side, setSide] = useState<"offense" | "defense">("offense");
  const complete = Object.values(progress.lessons).filter(
    (l) => l.completed,
  ).length;
  const studied = Object.keys(progress.lessons).length;
  const current = progress.recent
    .map(getLesson)
    .find(
      (l) => l && l.status === "ready" && !progress.lessons[l.id]?.completed,
    );
  const recent = progress.recent
    .map(getLesson)
    .filter((l) => l?.status === "ready");
  const preview = concepts.find((c) => c.id === "smash")!;
  return (
    <>
      <PageHeading
        eyebrow="YOUR FOOTBALL WORKSPACE"
        title="Understand the game."
        description="Go beyond the play call. Learn why it works."
        action={
          <Link className="button secondary" href="/learn">
            Explore curriculum
            <ArrowUpRight size={16} />
          </Link>
        }
      />
      <section className="sandbox-dashboard-callout">
        <div>
          <Tag green>NEW FOUNDATION</Tag>
          <h2>Test your idea in seven-on-seven.</h2>
          <p>
            Draw routes, configure an opponent, and compare timed responses.
          </p>
        </div>
        <Link href="/sandbox" className="button primary">
          Open the sandbox
          <ArrowRight size={16} />
        </Link>
      </section>
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-eyebrow">
            <span />
            THE INTERACTIVE LAB
          </span>
          <h2>
            Don’t just see the play.
            <br />
            <em>See the advantage.</em>
          </h2>
          <p>
            Change the coverage. Follow the routes.
            <br />
            Discover the defender caught in the middle.
          </p>
          <Link className="button hero-button" href="/simulator">
            Open simulator
            <ArrowRight size={17} />
          </Link>
          <span className="hero-footnote">
            6 passing concepts <i /> 9 defensive looks
          </span>
        </div>
        <div className="hero-field">
          <div className="hero-field-label">
            <span>
              SMASH <small>vs.</small> COVER 2
            </span>
            <span className="live-tag">
              <i />
              CONCEPT PREVIEW
            </span>
          </div>
          <FootballField
            preview
            players={formations[0].players}
            routes={preview.routes.filter((r) =>
              ["Y", "Z"].includes(r.playerId),
            )}
            coverage={coverages.find((c) => c.id === "cover2")}
            labels
            highlight="CBR"
            stress={{ x: 88, y: 41 }}
          />
          <div className="hero-callout">
            <span className="callout-number">01</span>
            <div>
              <strong>One corner. Two depths.</strong>
              <span>
                A hitch and a corner route create a high–low conflict.
              </span>
            </div>
            <ArrowUpRight size={19} />
          </div>
        </div>
      </section>
      <div className="stat-row">
        <div className="stat">
          <span className="stat-icon">
            <BookOpen size={19} />
          </span>
          <div>
            <strong>
              {studied}
              <small>concepts studied</small>
            </strong>
            <p>
              {studied
                ? "Keep building your understanding"
                : "Your playbook starts here"}
            </p>
          </div>
        </div>
        <div className="stat">
          <span className="stat-icon">
            <Check size={19} />
          </span>
          <div>
            <strong>
              {complete}
              <small>lessons completed</small>
            </strong>
            <p>Completion is yours to record</p>
          </div>
        </div>
        <div className="stat">
          <span className="stat-icon">
            <Target size={19} />
          </span>
          <div>
            <strong>
              {progress.training.correct}
              <small>correct training answers</small>
            </strong>
            <p>
              {progress.training.attempts
                ? `${progress.training.attempts} attempts across both exercises`
                : "Turn recognition into understanding"}
            </p>
          </div>
        </div>
      </div>
      <div className="section-header">
        <div>
          <h2>Build your football IQ</h2>
          <p>Start with a concept. Connect it to the bigger picture.</p>
        </div>
        <div className="segmented">
          <button
            className={side === "offense" ? "active" : ""}
            onClick={() => setSide("offense")}
          >
            Offense
          </button>
          <button
            className={side === "defense" ? "active" : ""}
            onClick={() => setSide("defense")}
          >
            Defense
          </button>
        </div>
      </div>
      <div className="category-grid">
        {categories
          .filter((c) => c.side === side)
          .map((c) => {
            const ready = lessons.filter(
              (l) => l.categoryId === c.id && l.status === "ready",
            );
            const done = ready.filter(
              (l) => progress.lessons[l.id]?.completed,
            ).length;
            return (
              <Link
                key={c.id}
                className="category-card"
                href={`/learn/${c.id}`}
              >
                <div className="category-card-top">
                  <span className="category-icon">
                    <CategoryIcon name={c.icon} />
                  </span>
                  <ArrowUpRight size={17} />
                </div>
                <h3>{c.name}</h3>
                <p>{c.description}</p>
                <div className="category-card-bottom">
                  <span>
                    {ready.length
                      ? `${ready.length} lessons`
                      : "Curriculum planned"}
                  </span>
                  {done > 0 ? (
                    <span>{done} completed</span>
                  ) : (
                    ready.length > 0 && (
                      <span className="category-start">
                        Start learning
                        <ArrowRight size={12} />
                      </span>
                    )
                  )}
                </div>
                {ready.length > 0 && (
                  <div className="mini-progress">
                    <span
                      style={{ width: `${(done / ready.length) * 100}%` }}
                    />
                  </div>
                )}
              </Link>
            );
          })}
      </div>
      <div className="dashboard-bottom">
        <section className="panel continue-panel">
          <div className="section-header compact">
            <h2>{current ? "Continue learning" : "Your starting point"}</h2>
            <BookOpen size={18} />
          </div>
          <span className="eyebrow">
            {current
              ? categories.find((c) => c.id === current.categoryId)?.name
              : "PASSING CONCEPTS"}
          </span>
          <h3>{current?.title ?? "Start with the defender in conflict."}</h3>
          <p>
            {current?.summary ??
              "Smash is a clear introduction to how routes work together. Learn to read the corner, then check the safety."}
          </p>
          <ArrowLink href={`/lesson/${current?.id ?? "smash"}`}>
            {current ? "Resume lesson" : "Learn Smash"}{" "}
            <span className="muted-inline">· {current?.minutes ?? 8} min</span>
          </ArrowLink>
        </section>
        <section className="panel practice-panel">
          <div className="section-header compact">
            <h2>Put it into practice</h2>
            <Target size={18} />
          </div>
          <div className="practice-row">
            <span className="practice-icon">
              <Layers size={21} />
            </span>
            <div>
              <h3>Read the defense</h3>
              <p>Identify coverage from post-snap structure.</p>
            </div>
            <Link aria-label="Start coverage training" href="/training">
              <ArrowUpRight size={19} />
            </Link>
          </div>
          <div className="practice-row">
            <span className="practice-icon">
              <Waypoints size={21} />
            </span>
            <div>
              <h3>Make it your own</h3>
              <p>Build and save a play in the designer.</p>
            </div>
            <Link aria-label="Open play designer" href="/designer">
              <ArrowUpRight size={19} />
            </Link>
          </div>
        </section>
      </div>
      {recent.length > 0 && (
        <section className="recent-section">
          <div className="section-header">
            <h2>Recently viewed</h2>
          </div>
          <div className="recent-list">
            {recent.slice(0, 4).map(
              (l) =>
                l && (
                  <Link href={`/lesson/${l.id}`} key={l.id}>
                    <BookOpen size={16} />
                    <strong>{l.title}</strong>
                    <ArrowRight size={15} />
                  </Link>
                ),
            )}
          </div>
        </section>
      )}
    </>
  );
}
export function Curriculum({ categoryId }: { categoryId?: string }) {
  const { progress } = useStore();
  const [filter, setFilter] = useState("");
  const [side, setSide] = useState<"offense" | "defense">("offense");
  const category = categories.find((c) => c.id === categoryId);
  const filtered = lessons.filter(
    (l) =>
      (!category || l.categoryId === category.id) &&
      l.title.toLowerCase().includes(filter.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow={
          category
            ? `${category.side.toUpperCase()} / CURRICULUM`
            : "THE CURRICULUM"
        }
        title={category?.name ?? "Learn the game, one layer at a time."}
        description={
          category?.description ??
          "A connected curriculum. Real lessons today, a clear path for what comes next."
        }
      />
      {category ? (
        <Link className="back-link" href="/learn">
          ← All categories
        </Link>
      ) : (
        <>
          <div className="segmented curriculum-segment">
            <button
              className={side === "offense" ? "active" : ""}
              onClick={() => setSide("offense")}
            >
              Offense
            </button>
            <button
              className={side === "defense" ? "active" : ""}
              onClick={() => setSide("defense")}
            >
              Defense
            </button>
          </div>
          <div className="category-grid curriculum-categories">
            {categories
              .filter((c) => c.side === side)
              .map((c) => (
                <Link
                  key={c.id}
                  href={`/learn/${c.id}`}
                  className="category-card"
                >
                  <span className="category-icon">
                    <CategoryIcon name={c.icon} />
                  </span>
                  <h3>{c.name}</h3>
                  <p>{c.description}</p>
                  <div className="category-card-bottom">
                    <span>
                      {
                        lessons.filter(
                          (l) => l.categoryId === c.id && l.status === "ready",
                        ).length
                      }{" "}
                      available lessons
                    </span>
                    <ArrowRight size={15} />
                  </div>
                </Link>
              ))}
          </div>
        </>
      )}
      {category && (
        <>
          <div className="section-header">
            <h2>
              Available lessons{" "}
              <span className="count-badge">
                {filtered.filter((l) => l.status === "ready").length}
              </span>
            </h2>
            <label className="filter-input">
              <Search size={15} />
              <input
                placeholder="Find a lesson…"
                aria-label="Filter lessons"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </label>
          </div>
          <div className="lesson-list">
            {filtered
              .filter((l) => l.status === "ready")
              .map((l, i) => (
                <Link
                  key={l.id}
                  className="lesson-row"
                  href={`/lesson/${l.id}`}
                >
                  <span className="lesson-number">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="lesson-row-copy">
                    <h3>
                      {l.title}
                      {progress.lessons[l.id]?.completed && <Check size={16} />}
                    </h3>
                    <p>{l.summary}</p>
                  </div>
                  <div className="lesson-row-meta">
                    <Tag>{l.level}</Tag>
                    <span>
                      <Clock size={13} />
                      {l.minutes} min
                    </span>
                  </div>
                  <ArrowRight size={18} />
                </Link>
              ))}
          </div>
          {!filtered.some((l) => l.status === "ready") && (
            <EmptyState
              title={
                filter
                  ? "No available matches"
                  : "This curriculum is taking shape."
              }
              body={
                filter
                  ? "Try a different lesson title."
                  : "These topics are mapped for future development. Explore the passing and coverage foundations available now."
              }
              href="/learn/passing"
            />
          )}
          {filtered.some((l) => l.status === "planned") && (
            <section className="planned-section">
              <div className="section-header">
                <h2>On the roadmap</h2>
                <Tag>Not yet available</Tag>
              </div>
              <p className="subtle">
                Mapped curriculum entries. No placeholder lessons or simulated
                progress.
              </p>
              <div className="planned-grid">
                {filtered
                  .filter((l) => l.status === "planned")
                  .map((l) => (
                    <div key={l.id}>
                      <BookOpen size={15} />
                      {l.title}
                      <span>Planned</span>
                    </div>
                  ))}
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
export function Glossary() {
  const params = useSearchParams();
  const initial = params.get("q") ?? "";
  return <GlossaryContents key={initial} initial={initial} />;
}
function GlossaryContents({ initial }: { initial: string }) {
  const [query, setQuery] = useState(initial);
  const filtered = glossary.filter((t) =>
    `${t.term} ${t.definition}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="THE SHARED LANGUAGE"
        title="Football, in plain language."
        description="A reference for the terms behind the diagrams. Definitions can vary by coaching system."
      />
      <label className="filter-input glossary-search">
        <Search size={18} />
        <input
          aria-label="Search glossary"
          placeholder="Search a term or definition…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <p className="subtle">{filtered.length} terms</p>
      <div className="glossary-grid">
        {filtered.map((t) => (
          <article className="panel glossary-term" key={t.term}>
            <h3>{t.term}</h3>
            <p>{t.definition}</p>
          </article>
        ))}
      </div>
      {!filtered.length && (
        <EmptyState
          title="No matching terms"
          body="Try “shell”, “leverage”, or “Mike”."
        />
      )}
    </>
  );
}
