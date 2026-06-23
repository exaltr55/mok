/**
 * Client-side progress for the Learn flow.
 *
 * Tracks which Learn modules (welcome, source, seed, soil, season, sowing,
 * bridge) and which practice teachings (Part 1 of each practice) the user
 * has read on this device. Persisted in localStorage — promote to a
 * server-side learn_progress table when cross-device continuity is needed.
 */

import { getCurrentUserId } from '../api/client';

const KEY_BASE = 'mok.learn.progress.v1';
const LEGACY_KEY = KEY_BASE; // pre-namespacing storage key

/** Storage key, namespaced by the signed-in user id so two accounts
 *  sharing the same browser don't see each other's read-state.
 *  Falls back to an anonymous key when no user is signed in. */
function storageKey(): string {
  const uid = getCurrentUserId();
  return uid ? `${KEY_BASE}.${uid}` : `${KEY_BASE}.anon`;
}

/** One-time migration: copy progress from the legacy un-namespaced key
 *  into the current user's namespaced key, then delete the legacy key.
 *  The first signed-in user inherits any pre-namespacing reading state
 *  so their progress isn't silently lost. Idempotent — once the legacy
 *  key is gone this is a no-op. */
function migrateLegacyIfNeeded(): void {
  try {
    const uid = getCurrentUserId();
    if (!uid) return;
    const target = storageKey();
    if (localStorage.getItem(target)) return; // already populated
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (!legacy) return;
    localStorage.setItem(target, legacy);
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // ignore
  }
}

interface Progress {
  modules: string[];
  practiceLearn: string[];
  practiceDaily: string[];
  /** Per-module slide position the user reached last time. Lets us
   *  surface a "continue where you left off" pointer without forcing a
   *  re-read from slide 1. */
  modulePositions?: Record<string, { idx: number; total: number; ts: number }>;
}

function read(): Progress {
  try {
    migrateLegacyIfNeeded();
    const raw = localStorage.getItem(storageKey());
    if (!raw) return { modules: [], practiceLearn: [], practiceDaily: [] };
    const parsed = JSON.parse(raw);
    return {
      modules: Array.isArray(parsed.modules) ? parsed.modules : [],
      practiceLearn: Array.isArray(parsed.practiceLearn) ? parsed.practiceLearn : [],
      practiceDaily: Array.isArray(parsed.practiceDaily) ? parsed.practiceDaily : [],
      modulePositions:
        parsed.modulePositions && typeof parsed.modulePositions === 'object'
          ? parsed.modulePositions
          : undefined,
    };
  } catch {
    return { modules: [], practiceLearn: [], practiceDaily: [] };
  }
}

function write(p: Progress) {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(p));
  } catch {
    // localStorage disabled or full — silent no-op
  }
}

export function markModuleRead(slug: string): void {
  const p = read();
  if (!p.modules.includes(slug)) {
    p.modules.push(slug);
    write(p);
  }
}

export function isModuleRead(slug: string): boolean {
  return read().modules.includes(slug);
}

export function getReadModules(): string[] {
  return read().modules;
}

export function markPracticeLearnRead(key: string): void {
  const p = read();
  if (!p.practiceLearn.includes(key)) {
    p.practiceLearn.push(key);
    write(p);
  }
}

export function getReadPracticeLearn(): string[] {
  return read().practiceLearn;
}

export function markPracticeDailyRead(key: string): void {
  const p = read();
  if (!p.practiceDaily.includes(key)) {
    p.practiceDaily.push(key);
    write(p);
  }
}

export function getReadPracticeDaily(): string[] {
  return read().practiceDaily;
}

/** Save the user's current slide index in a Learn module so they can
 *  pick up where they left off. Called on every slide change. */
export function saveModulePosition(slug: string, idx: number, total: number): void {
  const p = read();
  const positions = { ...(p.modulePositions ?? {}) };
  positions[slug] = { idx, total, ts: Date.now() };
  write({ ...p, modulePositions: positions });
}

/** Return the saved position for a module, or null if none. */
export function getModulePosition(
  slug: string,
): { idx: number; total: number; ts: number } | null {
  return read().modulePositions?.[slug] ?? null;
}

/** Drop the saved position — called when the user finishes a module. */
export function clearModulePosition(slug: string): void {
  const p = read();
  if (!p.modulePositions || !(slug in p.modulePositions)) return;
  const positions = { ...p.modulePositions };
  delete positions[slug];
  write({ ...p, modulePositions: positions });
}

/** All in-progress positions (slug + position) for modules that
 *  aren't yet marked complete. Used by the Learn landing to show
 *  "continue where you left off" cards. */
export function getInProgressPositions(): Array<{ slug: string; idx: number; total: number }> {
  const p = read();
  const positions = p.modulePositions ?? {};
  const completed = new Set(p.modules);
  return Object.entries(positions)
    .filter(([slug, pos]) => !completed.has(slug) && pos.idx > 0)
    .map(([slug, pos]) => ({ slug, idx: pos.idx, total: pos.total }));
}
