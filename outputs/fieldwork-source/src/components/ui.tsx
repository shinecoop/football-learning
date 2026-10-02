"use client";
import {
  ArrowRight,
  Route as RouteIcon,
  Shield,
  Users,
  Waypoints,
  MoveRight,
  BookOpen,
  Layers,
  Zap,
  Target,
  Compass,
  Check,
  Play,
  Pause,
  RotateCcw,
  FlipHorizontal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
const icons: Record<string, LucideIcon> = {
  route: RouteIcon,
  shield: Shield,
  users: Users,
  formation: Waypoints,
  motion: MoveRight,
  book: BookOpen,
  coverage: Layers,
  bolt: Zap,
  run: ArrowRight,
  strategy: Compass,
};
export function CategoryIcon({
  name,
  size = 22,
}: {
  name: string;
  size?: number;
}) {
  const Icon = icons[name] ?? Target;
  return <Icon size={size} strokeWidth={1.6} />;
}
export function ArrowLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link className="arrow-link" href={href}>
      {children}
      <ArrowRight size={15} />
    </Link>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function Tag({
  children,
  green = false,
}: {
  children: React.ReactNode;
  green?: boolean;
}) {
  return <span className={`tag ${green ? "tag-green" : ""}`}>{children}</span>;
}
export function EmptyState({
  title,
  body,
  href,
  label,
}: {
  title: string;
  body: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="empty-state">
      <BookOpen size={25} />
      <h3>{title}</h3>
      <p>{body}</p>
      {href && <ArrowLink href={href}>{label ?? "Explore lessons"}</ArrowLink>}
    </div>
  );
}
export function CheckLabel({
  done,
  children,
}: {
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <span className={`check-label ${done ? "done" : ""}`}>
      <span>{done && <Check size={11} />}</span>
      {children}
    </span>
  );
}
export interface AnimationControls {
  time: number;
  playing: boolean;
  speed: number;
  setTime: (n: number) => void;
  setSpeed: (n: number) => void;
  toggle: () => void;
  restart: () => void;
}
export function FieldControls({
  animation,
  flipped,
  onFlip,
  labels,
  onLabels,
  routes,
  onRoutes,
  zones,
  onZones,
  assignments,
  onAssignments,
}: {
  animation: AnimationControls;
  flipped: boolean;
  onFlip: () => void;
  labels: boolean;
  onLabels: () => void;
  routes: boolean;
  onRoutes?: () => void;
  zones?: boolean;
  onZones?: () => void;
  assignments?: boolean;
  onAssignments?: () => void;
}) {
  return (
    <div className="field-controls">
      <div className="transport">
        <button
          className="play-button"
          aria-label={animation.playing ? "Pause play" : "Play animation"}
          onClick={animation.toggle}
        >
          {animation.playing ? (
            <Pause size={16} />
          ) : (
            <Play size={16} fill="currentColor" />
          )}
          {animation.playing ? "Pause" : "Play"}
        </button>
        <button
          className="icon-button"
          aria-label="Restart play"
          onClick={animation.restart}
        >
          <RotateCcw size={16} />
        </button>
        <input
          aria-label="Play timeline"
          type="range"
          min="0"
          max="1"
          step=".01"
          value={animation.time}
          onChange={(e) => animation.setTime(Number(e.target.value))}
        />
        <select
          aria-label="Animation speed"
          value={animation.speed}
          onChange={(e) => animation.setSpeed(Number(e.target.value))}
        >
          <option value={0.5}>0.5×</option>
          <option value={1}>1×</option>
          <option value={1.5}>1.5×</option>
          <option value={2}>2×</option>
        </select>
        <button
          className={`icon-button ${flipped ? "active" : ""}`}
          aria-label="Flip play"
          aria-pressed={flipped}
          onClick={onFlip}
        >
          <FlipHorizontal size={17} />
        </button>
      </div>
      <div className="field-toggles">
        {[
          { label: "Labels", on: labels, change: onLabels },
          ...(onRoutes
            ? [{ label: "Routes", on: routes, change: onRoutes }]
            : []),
          ...(onZones ? [{ label: "Zones", on: zones, change: onZones }] : []),
          ...(onAssignments
            ? [{ label: "Assignments", on: assignments, change: onAssignments }]
            : []),
        ].map((t) => (
          <button
            key={t.label}
            className={t.on ? "toggle on" : "toggle"}
            aria-pressed={Boolean(t.on)}
            onClick={t.change}
          >
            <span />
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
