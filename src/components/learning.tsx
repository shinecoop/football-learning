"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Clock, BookOpen, Check, Search } from "lucide-react";
import { categories, lessons } from "@/domain/curriculum";
import { glossary } from "@/domain/glossary";
import { useStore } from "@/lib/store";
import { PageHeading, CategoryIcon, Tag, EmptyState } from "./ui";
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
