/**
 * Mokshly HTTP client — single source of truth for backend calls.
 *
 * Token storage lives in localStorage; `authHeaders()` injects it on protected
 * requests. Every helper returns a typed response and surfaces backend `detail`
 * fields as the thrown error message.
 */

const BASE = '/api/v1';
const TOKEN_KEY = 'mok_token';

// ── Auth token helpers ──────────────────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string): void {
  localStorage.setItem(TOKEN_KEY, t);
}
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { detail?: string }).detail || `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ── Auth ────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  phase: string;
  onboarded: boolean;
}

export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

export const loginApi = (email: string, password: string) =>
  request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const registerApi = (email: string, password: string, name: string) =>
  request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });

export const getMe = () => request<AuthUser>('/auth/me');

export const changePassword = (currentPassword: string, newPassword: string) =>
  request<{ message: string }>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });

export const forgotPassword = (email: string) =>
  request<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

export const resetPassword = (token: string, newPassword: string) =>
  request<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, new_password: newPassword }),
  });

// ── Profile ─────────────────────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: string;
  phase: string;
  onboarded: boolean;
  pronouns: string | null;
  timezone: string;
  intention: string | null;
  career_stage: string | null;
  preferred_time_of_day: string;
  preferred_days_per_week: number;
  cohort_preference: string;
  cohort_meeting_day: string | null;
  cohort_meeting_window: string | null;
  theme: string;
}

export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'email' | 'role'>>;

export const getProfile = () => request<Profile>('/me/profile');
export const updateProfile = (patch: ProfileUpdate) =>
  request<Profile>('/me/profile', { method: 'PATCH', body: JSON.stringify(patch) });

// ── Practices ───────────────────────────────────────────────────

export interface PracticeSummary {
  key: string;
  name: string;
  short_name: string;
  format: string;
  session_min: number;
  session_max: number;
  daily_log_limit: number;
  description: string;
}

export interface PracticeDetail extends PracticeSummary {
  content: string;
}

export interface PracticeLog {
  id: string;
  practice_key: string;
  practice_day: string;
  source: 'guided' | 'self_log';
  duration_minutes: number | null;
  mood: 'lighter' | 'same' | 'heavier' | null;
  note: string | null;
}

export const listPractices = () => request<PracticeSummary[]>('/practices');
export const getPractice = (key: string) => request<PracticeDetail>(`/practices/${key}`);

export const logPractice = (
  key: string,
  body: {
    source?: 'guided' | 'self_log';
    duration_minutes?: number | null;
    mood?: 'lighter' | 'same' | 'heavier' | null;
    note?: string | null;
    practice_day?: string;
  } = {},
) =>
  request<PracticeLog>(`/practices/${key}/log`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

// ── Today screen ────────────────────────────────────────────────

export interface MciOut {
  mci: number;
  milestone: string;
  practice_days: number;
  window_days: number;
}

export interface TodayScreen {
  user_name: string;
  phase: string;
  today: string;
  recommended_practice: {
    key: string;
    name: string;
    short_name: string;
    format: string;
    session_min: number;
    session_max: number;
  };
  practiced_today: string[];
  mci: MciOut;
}

export const getTodaySummary = () =>
  request<TodayScreen>('/practices/today/summary');

// ── MCI / History ───────────────────────────────────────────────

export const getMci = () => request<MciOut>('/me/mci');

export interface HistoryDay {
  day: string;
  practiced: boolean;
}

export const getHistory = (days = 30) =>
  request<{ days: HistoryDay[] }>(`/me/history?days=${days}`);

// ── Journal ─────────────────────────────────────────────────────

export type JournalStyle = 'expressive' | 'reflective' | 'gratitude';

export interface JournalEntry {
  id: string;
  entry_day: string;
  style: JournalStyle;
  body: string;
  created_at: string;
}

export const createJournal = (style: JournalStyle, body: string) =>
  request<JournalEntry>('/me/journal', {
    method: 'POST',
    body: JSON.stringify({ style, body }),
  });

export const listJournal = (limit = 30) =>
  request<JournalEntry[]>(`/me/journal?limit=${limit}`);

export const getTodaysJournal = () =>
  request<JournalEntry | null>('/me/journal/today');

// ── Learn (5S) ──────────────────────────────────────────────────

export interface LearnModuleSummary {
  slug: string;
  title: string;
  subtitle: string;
  order: number;
}

export interface LearnModule extends LearnModuleSummary {
  content: string;
}

export const listLearnModules = () => request<LearnModuleSummary[]>('/learn');
export const getLearnModule = (slug: string) => request<LearnModule>(`/learn/${slug}`);

// ── Contact ─────────────────────────────────────────────────────

export interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const submitContact = (payload: ContactPayload) =>
  request<{ message: string }>('/contact', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// ── Dashboard ───────────────────────────────────────────────────

export interface PracticeBreakdown {
  key: string;
  name: string;
  short_name: string;
  count_30d: number;
  count_90d: number;
  last_practiced: string | null;
  daily_30d: number[];
}

export interface DashboardDay {
  day: string;
  count: number;
}

export interface DashboardData {
  total_sessions: number;
  days_practiced_30d: number;
  days_practiced_90d: number;
  by_practice: PracticeBreakdown[];
  last_30_days: DashboardDay[];
  last_practice_key: string | null;
  last_practice_day: string | null;
}

export const getDashboard = () => request<DashboardData>('/me/dashboard');
