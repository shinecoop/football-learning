"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Search, BookOpen, Waypoints, Book, X, ArrowRight } from "lucide-react";
import { lessons, categories } from "@/domain/curriculum";
import { glossary } from "@/domain/glossary";
import { Curriculum, Glossary } from "./learning";
import { PassingLab } from "./passing-lab";
import { LessonPage } from "./lesson";
import { Designer } from "./designer";
import { Training } from "./training";
import { Sandbox } from "./sandbox";
import { Profiles } from "./profiles";
import { WorkspaceDataPage } from "./workspace-data";
import { useStore } from "@/lib/store";
const nav = [
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/sandbox", label: "Sandbox", icon: Waypoints },
  { href: "/glossary", label: "Glossary", icon: Book },
];
export function Application() {
  const { storageError } = useStore();
  const path = usePathname();
  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();
  const matches = query
    ? lessons
        .filter(
          (l) =>
            l.title.toLowerCase().includes(query) ||
            l.summary.toLowerCase().includes(query),
        )
        .slice(0, 7)
    : [];
  const terms = query
    ? glossary.filter((t) => t.term.toLowerCase().includes(query)).slice(0, 3)
    : [];
  const parts = path.split("/").filter(Boolean);
  const active = parts[0] ?? "overview";
  let content: React.ReactNode;
  if (active === "overview") content = <Curriculum />;
  else if (active === "learn") content = <Curriculum categoryId={parts[1]} />;
  else if (active === "lesson")
    content = <LessonPage key={parts[1]} id={parts[1]} />;
  else if (active === "simulator") content = <PassingLab />;
  else if (active === "sandbox") content = <Sandbox />;
  else if (active === "profiles") content = <Profiles />;
  else if (active === "workspace") content = <WorkspaceDataPage />;
  else if (active === "designer") content = <Designer />;
  else if (active === "training") content = <Training />;
  else if (active === "glossary") content = <Glossary />;
  else
    content = (
      <div className="empty-state">
        <h1>Page not found</h1>
        <Link href="/">Return to overview</Link>
      </div>
    );
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="main-shell">
        <header className="topbar">
          <Link className="brand" href="/">
            fieldwork<span className="brand-period">.</span>
          </Link>
          <nav className="primary-tabs" aria-label="Main navigation">
            {nav.map((n) => {
              const section =
                active === "glossary"
                  ? "Glossary"
                  : [
                        "sandbox",
                        "simulator",
                        "profiles",
                        "designer",
                        "workspace",
                      ].includes(active)
                    ? "Sandbox"
                    : "Learn";
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={section === n.label ? "selected" : ""}
                  aria-current={section === n.label ? "page" : undefined}
                >
                  <n.icon size={16} />
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="search-container">
            <Search size={16} />
            <input
              aria-label="Search concepts, coverages, and terms"
              placeholder="Search the playbook…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setSearch("");
              }}
            />
            {search ? (
              <button
                className="icon-button"
                aria-label="Clear search"
                onClick={() => setSearch("")}
              >
                <X size={14} />
              </button>
            ) : (
              <span className="search-key">⌕</span>
            )}
            {query && (
              <div
                className="search-results"
                role="region"
                aria-label="Search results"
              >
                <div className="search-caption">CURRICULUM & TERMS</div>
                {matches.map((l) =>
                  l.status === "ready" ? (
                    <Link
                      key={l.id}
                      href={`/lesson/${l.id}`}
                      onClick={() => setSearch("")}
                    >
                      <div>
                        <strong>{l.title}</strong>
                        <small>
                          {categories.find((c) => c.id === l.categoryId)?.name}
                        </small>
                      </div>
                      <ArrowRight size={15} />
                    </Link>
                  ) : (
                    <div className="planned-result" key={l.id}>
                      <strong>{l.title}</strong>
                      <small>Planned · not yet available</small>
                    </div>
                  ),
                )}
                {terms.map((t) => (
                  <Link
                    key={t.term}
                    href={`/glossary?q=${encodeURIComponent(t.term)}`}
                    onClick={() => setSearch("")}
                  >
                    <div>
                      <strong>{t.term}</strong>
                      <small>Glossary</small>
                    </div>
                    <ArrowRight size={15} />
                  </Link>
                ))}
                {!matches.length && !terms.length && (
                  <p className="no-results">
                    No matches. Try “Mesh”, “Cover 3”, or “Half Slide”.
                  </p>
                )}
              </div>
            )}
          </div>
        </header>
        <nav className="section-nav" aria-label="Workspace tools">
          {([
            "sandbox",
            "simulator",
            "profiles",
            "designer",
            "workspace",
          ].includes(active)
            ? [
                ["/sandbox", "Game simulator"],
                ["/profiles", "Opponent profiles"],
                ["/designer", "Play designer"],
                ["/simulator", "Concept lab"],
                ["/workspace", "Import / export"],
              ]
            : active === "glossary"
              ? []
              : [
                  ["/learn", "Curriculum"],
                  ["/training", "Practice"],
                ]
          ).map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className={path === href ? "active" : ""}
            >
              {label}
            </Link>
          ))}
        </nav>
        <main id="main" className="page-content">
          {storageError && (
            <div className="storage-warning" role="alert">
              {storageError} <Link href="/workspace">Open Workspace Data</Link>
            </div>
          )}
          {content}
        </main>
        <footer className="app-footer">
          <span>
            FIELDWORK <span>·</span> Football, understood.
          </span>
          <span>Learn the concept. See the conflict.</span>
        </footer>
      </div>
    </div>
  );
}
