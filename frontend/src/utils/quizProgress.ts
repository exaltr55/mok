/**
 * Client-side state for the practice review quizzes.
 *
 * Each practice has a short 5-question quiz that fires once, when the
 * user opens the next practice's Learn (Part A) for the first time —
 * a gentle review of what they just absorbed. After the quiz runs it
 * is recorded so it does not fire again for the same practice.
 *
 * Persisted in localStorage — promote to a server-side table when
 * cross-device continuity matters.
 */

import { getCurrentUserId } from '../api/client';

const KEY_BASE = 'mok.quiz.progress.v1';
const LEGACY_KEY = KEY_BASE; // pre-namespacing storage key

/** Storage key, namespaced by the signed-in user id so two accounts
 *  sharing the same browser don't share quiz state. */
function storageKey(): string {
  const uid = getCurrentUserId();
  return uid ? `${KEY_BASE}.${uid}` : `${KEY_BASE}.anon`;
}

/** One-time migration of any pre-namespacing legacy state into the
 *  current user's namespace. Idempotent. */
function migrateLegacyIfNeeded(): void {
  try {
    const uid = getCurrentUserId();
    if (!uid) return;
    const target = storageKey();
    if (localStorage.getItem(target)) return;
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (!legacy) return;
    localStorage.setItem(target, legacy);
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // ignore
  }
}

interface QuizProgress {
  /** Practice keys whose quiz has already been shown to the user. */
  completed: string[];
  /** Practice key whose quiz is queued — fires on the next
   *  *different* practice's Part A open. Null when nothing queued. */
  pending: string | null;
}

function read(): QuizProgress {
  try {
    migrateLegacyIfNeeded();
    const raw = localStorage.getItem(storageKey());
    if (!raw) return { completed: [], pending: null };
    const parsed = JSON.parse(raw);
    return {
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      pending: typeof parsed.pending === 'string' ? parsed.pending : null,
    };
  } catch {
    return { completed: [], pending: null };
  }
}

function write(p: QuizProgress): void {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(p));
  } catch {
    // localStorage disabled or full — silent no-op
  }
}

/** Queue a practice's quiz to run on the next *different* practice's
 *  Part A open. Idempotent — calling twice with the same key is a
 *  no-op. Won't queue if the quiz has already been shown. */
export function setQuizPending(key: string): void {
  const p = read();
  if (p.completed.includes(key)) return;
  if (p.pending === key) return;
  write({ ...p, pending: key });
}

/** Return the queued practice key whose quiz should fire when the
 *  user opens a *different* practice's Part A for the first time.
 *  Returns null if nothing is queued, or if `currentKey` matches the
 *  pending key (re-reading the same practice — no quiz). */
export function getQuizPendingFor(currentKey: string): string | null {
  const p = read();
  if (!p.pending) return null;
  if (p.pending === currentKey) return null;
  if (p.completed.includes(p.pending)) return null;
  return p.pending;
}

/** Mark a quiz as completed and clear the pending slot. */
export function markQuizCompleted(key: string): void {
  const p = read();
  const completed = p.completed.includes(key) ? p.completed : [...p.completed, key];
  const pending = p.pending === key ? null : p.pending;
  write({ completed, pending });
}

export function isQuizCompleted(key: string): boolean {
  return read().completed.includes(key);
}

/** Clear all quiz progress — useful for a "reset" affordance later. */
export function resetQuizProgress(): void {
  write({ completed: [], pending: null });
}
