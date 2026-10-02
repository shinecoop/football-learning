"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Search,
  BookOpen,
  Waypoints,
  PenTool,
  Target,
  Book,
  LayoutDashboard,
  ArrowUpRight,
  Menu,
  X,
  ArrowRight,
} from "lucide-react";
import { lessons, categories } from "@/domain/curriculum";
import { glossary } from "@/domain/glossary";
import { Dashboard, Curriculum, Glossary } from "./learning";
import { PassingLab } from "./passing-lab";
import { LessonPage } from "./lesson";
import { Designer } from "./designer";
import { Training } from "./training";
const nav = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/simulator", label: "Simulator", icon: Waypoints },
  { href: "/designer", label: "Play designer", icon: PenTool },
  { href: "/training", label: "Training", icon: Target },
  { href: "/glossary", label: "Glossary", icon: Book },
];
export function Application() {
  const path = usePathname();
  const [search, setSearch] = useState("");
  const [mobile, setMobile] = useState(false);
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
  if (active === "overview") content = <Dashboard />;
  else if (active === "learn") content = <Curriculum categoryId={parts[1]} />;
  else if (active === "lesson")
    content = <LessonPage key={parts[1]} id={parts[1]} />;
  else if (active === "simulator") content = <PassingLab />;
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
      <aside className={`sidebar ${mobile ? "mobile-open" : ""}`}>
        <Link className="brand" href="/" onClick={() => setMobile(false)}>
          <span className="brand-mark">
            <i />
            <i />
            <i />
          </span>
          fieldwork<span className="brand-period">.</span>
        </Link>
        <div className="workspace-label">THE FOOTBALL CLASSROOM</div>
        <nav aria-label="Main navigation">
          {nav.map((n) => {
            const selected =
              n.href === "/"
                ? path === "/"
                : path.startsWith(n.href) ||
                  (n.label === "Learn" && active === "lesson");
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                className={`nav-item ${selected ? "selected" : ""}`}
                href={n.href}
                onClick={() => setMobile(false)}
              >
                <Icon size={18} strokeWidth={1.7} />
                {n.label}
                {n.label === "Simulator" && (
                  <span className="nav-new">LAB</span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-divider" />
        <div className="sidebar-section-label">YOUR PLAYBOOK</div>
        <Link className="small-nav" href="/learn/passing">
          <span className="small-dot" />
          Offensive concepts
        </Link>
        <Link className="small-nav" href="/learn/coverage">
          <span className="small-dot muted" />
          Defensive concepts
        </Link>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Waypoints size={23} />
            <strong>See the game differently.</strong>
            <p>
              Understand the space.
              <br />
              Find the advantage.
            </p>
            <Link href="/simulator">
              Enter the lab <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="profile">
            <span className="avatar">Y</span>
            <div>
              <strong>Your workspace</strong>
              <span>Progress saved on this device</span>
            </div>
          </div>
        </div>
        <button
          className="mobile-close icon-button"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        >
          <X size={22} />
        </button>
      </aside>
      {mobile && (
        <button
          className="sidebar-backdrop"
          aria-label="Close menu"
          onClick={() => setMobile(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="mobile-menu icon-button"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={22} />
            </button>
            <span>Workspace</span>
            <span className="breadcrumb-slash">/</span>
            <strong>
              {active === "overview"
                ? "Overview"
                : active === "lesson"
                  ? "Learn"
                  : active === "designer"
                    ? "Play designer"
                    : active[0]?.toUpperCase() + active.slice(1)}
            </strong>
          </div>
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
          <span className="topbar-status">
            <i />
            FOUNDATION EDITION
          </span>
        </header>
        <main id="main" className="page-content">
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
