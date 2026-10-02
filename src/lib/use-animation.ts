"use client";
import { useState, useEffect, useRef, useCallback } from "react";
export function useAnimation(duration = 6000) {
  const [time, setTimeState] = useState(0);
  const timeline = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const setTime = useCallback((value: number) => {
    timeline.current = Math.max(0, Math.min(1, value));
    setTimeState(timeline.current);
  }, []);
  useEffect(() => {
    if (!playing) return;
    let frame: number;
    let last: number | undefined;
    const tick = (now: number) => {
      const delta = last === undefined ? 0 : ((now - last) * speed) / duration;
      last = now;
      const next = Math.min(1, timeline.current + delta);
      setTime(next);
      if (next >= 1) {
        setPlaying(false);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed, duration, setTime]);
  return {
    time,
    playing,
    speed,
    setSpeed,
    setTime,
    toggle: () => {
      if (time >= 1) setTime(0);
      setPlaying(!playing);
    },
    restart: () => {
      setTime(0);
      setPlaying(false);
    },
  };
}
