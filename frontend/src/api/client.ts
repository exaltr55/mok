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

interface PydanticErrorItem {
  loc?: unknown[];
  msg?: string;
  type?: string;
}

function formatDetail(detail: unknown, status: number): string {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    // FastAPI / Pydantic 422 — list of { loc, msg, type } objects.
    return detail
      .map((item) => {
        const it = item as PydanticErrorItem;
        const field = Array.isArray(it.loc) && it.loc.length > 1 ? String(it.loc.slice(1).join('.')) : '';
        const msg = it.msg ?? 'Invalid value';
        return field ? `${field}: ${msg}` : msg;
      })
      .join('. ');
  }
  if (detail && typeof detail === 'object') {
    const d = detail as { msg?: string };
    if (d.msg) return d.msg;
  }
  return `Request failed (${status})`;
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
    throw new Error(formatDetail((body as { detail?: unknown }).detail, res.status));
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
  /** Set by the employer. When false, the cohort step is skipped during
   *  onboarding and the Connect page shows a "coming when your team enables
   *  it" empty state. */
  cohort_enabled: boolean;
  /** "employee" (default) | "employer_admin" | "platform_admin". Determines
   *  which portal URL space the user belongs in. */
  user_type: string;
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
  cohort_enabled: boolean;
  theme: string;
  // Personalization captured at onboarding.
  stretched_area: 'mind' | 'body' | 'heart' | 'time' | null;
  restore_style: 'solitude' | 'movement' | 'conversation' | 'writing' | null;
  tone_preference: 'quiet' | 'encouraging' | 'reflective' | null;
  here_because: 'burnout' | 'transition' | 'growth' | 'curiosity' | 'recommended' | null;
  onboarded_at?: string;
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

// ── Welcome notes from the employer (HR + CEO) ──────────────────

export interface TenantWelcome {
  organisation_name: string | null;
  hr_head_name: string | null;
  hr_head_title: string | null;
  hr_head_message: string | null;
  ceo_name: string | null;
  ceo_title: string | null;
  ceo_message: string | null;
}

export const getMyTenantWelcome = () => request<TenantWelcome>('/me/tenant/welcome');

// ── Employer portal ─────────────────────────────────────────────

export interface EmployerSignupPayload {
  organisation_name: string;
  contact_name: string;
  contact_email: string;
  password: string;
  employee_count_band?: '1-50' | '51-200' | '201-1000' | '1000+';
}

export interface Tenant {
  id: string;
  slug: string;
  display_name: string;
  description: string | null;
  status: 'pending' | 'invited' | 'active';
  cohort_enabled: boolean;

  website: string | null;
  company_data: string | null;
  // HQ structured address
  hq_street1: string | null;
  hq_street2: string | null;
  hq_city: string | null;
  hq_state: string | null;
  hq_postal_code: string | null;
  hq_country: string | null;
  hq_address: string | null; // legacy single-line

  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;

  billing_contact_name: string | null;
  billing_email: string | null;
  billing_phone: string | null;
  // Billing structured address
  billing_street1: string | null;
  billing_street2: string | null;
  billing_city: string | null;
  billing_state: string | null;
  billing_postal_code: string | null;
  billing_country: string | null;
  billing_address: string | null; // legacy single-line

  hr_head_name: string | null;
  hr_head_title: string | null;
  hr_head_message: string | null;
  ceo_name: string | null;
  ceo_title: string | null;
  ceo_message: string | null;

  employee_count_band: string | null;
}

export interface EmployerMe {
  user: AuthUser;
  tenant: Tenant;
}

export interface TenantUpdate {
  display_name?: string;
  description?: string;
  cohort_enabled?: boolean;
  status?: 'pending' | 'invited' | 'active';

  website?: string;
  company_data?: string;
  hq_street1?: string;
  hq_street2?: string;
  hq_city?: string;
  hq_state?: string;
  hq_postal_code?: string;
  hq_country?: string;
  hq_address?: string; // legacy

  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;

  billing_contact_name?: string;
  billing_email?: string;
  billing_phone?: string;
  billing_street1?: string;
  billing_street2?: string;
  billing_city?: string;
  billing_state?: string;
  billing_postal_code?: string;
  billing_country?: string;
  billing_address?: string; // legacy

  hr_head_name?: string;
  hr_head_title?: string;
  hr_head_message?: string;
  ceo_name?: string;
  ceo_title?: string;
  ceo_message?: string;

  employee_count_band?: '1-50' | '51-200' | '201-1000' | '1000+';
}

// ── Platform admin (Mokshly team) ───────────────────────────────

export interface ProvisionEmployerPayload {
  organisation_name: string;
  website?: string;
  company_data?: string;
  hq_street1?: string;
  hq_street2?: string;
  hq_city?: string;
  hq_state?: string;
  hq_postal_code?: string;
  hq_country?: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  billing_contact_name?: string;
  billing_email?: string;
  billing_phone?: string;
  billing_street1?: string;
  billing_street2?: string;
  billing_city?: string;
  billing_state?: string;
  billing_postal_code?: string;
  billing_country?: string;
  employee_count_band?: '1-50' | '51-200' | '201-1000' | '1000+';
  notes?: string;
}

export interface ProvisionedEmployer {
  tenant: Tenant;
  invite_url: string;
  invite_sent: boolean;
}

export const provisionEmployer = (payload: ProvisionEmployerPayload) =>
  request<ProvisionedEmployer>('/admin/employers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const listEmployers = () => request<Tenant[]>('/admin/employers');

export const updateEmployerAsAdmin = (tenantId: string, patch: TenantUpdate) =>
  request<Tenant>(`/admin/employers/${tenantId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });

// ── Employer invite acceptance ──────────────────────────────────

export interface InvitePreview {
  contact_name: string | null;
  contact_email: string | null;
  organisation_name: string | null;
}

export const previewInvite = (token: string) =>
  request<InvitePreview>(`/employer/invite/preview?token=${encodeURIComponent(token)}`);

export const acceptInvite = (token: string, password: string) =>
  request<AuthResponse>('/employer/accept-invite', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });

export const employerSignup = (payload: EmployerSignupPayload) =>
  request<AuthResponse>('/employer/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getEmployerMe = () => request<EmployerMe>('/employer/me');

export const updateTenant = (patch: TenantUpdate) =>
  request<Tenant>('/employer/tenant', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });

export const completeEmployerOnboarding = () =>
  request<EmployerMe>('/employer/complete-onboarding', { method: 'POST' });
