import { loadPersonalGeminiConfig } from "@/lib/geminiSettings";
import type {
  CreateSessionResponse,
  DistractorExplanationResponse,
  ListeningTestDetail,
  ListeningTestSummary,
  ProgressSummaryResponse,
  RandomDrillsResponse,
  ReadingTestDetail,
  ReadingTestSummary,
  StrategyNoteItem,
  SubmitSessionResponse,
  TestGeminiKeyResponse,
} from "@/types/reading";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function personalGeminiHeaders(): Record<string, string> {
  const cfg = loadPersonalGeminiConfig();
  const headers: Record<string, string> = {};
  if (cfg.apiKey) {
    headers["X-Gemini-Api-Key"] = cfg.apiKey;
  }
  if (cfg.model) {
    headers["X-Gemini-Model"] = cfg.model;
  }
  return headers;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

// ==================== READING ====================

export function fetchReadingTests(): Promise<ReadingTestSummary[]> {
  return apiFetch<ReadingTestSummary[]>("/api/reading/tests");
}

export function fetchRandomReadingDrills(excludeIds: string[] = []): Promise<RandomDrillsResponse> {
  const qs = excludeIds.length > 0 ? `?exclude=${encodeURIComponent(excludeIds.join(","))}` : "";
  return apiFetch<RandomDrillsResponse>(`/api/reading/drills/random${qs}`);
}

export function fetchReadingTestDetail(
  testId: string,
  passageIndex?: number | null
): Promise<ReadingTestDetail> {
  const qs = passageIndex ? `?passage_index=${passageIndex}` : "";
  return apiFetch<ReadingTestDetail>(`/api/reading/tests/${testId}${qs}`);
}

export function createReadingSession(payload: {
  test_id: string;
  mode: "drill" | "section_mock";
  passage_index?: number | null;
}): Promise<CreateSessionResponse> {
  return apiFetch<CreateSessionResponse>("/api/reading/sessions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function submitReadingSession(
  sessionId: string,
  answers: Record<string, string>,
  durationSec: number
): Promise<SubmitSessionResponse> {
  return apiFetch<SubmitSessionResponse>(`/api/reading/sessions/${sessionId}/submit`, {
    method: "POST",
    body: JSON.stringify({ answers, duration_sec: durationSec }),
  });
}

export function explainReadingDistractor(payload: {
  item_id: string;
  user_answer: string;
  failure_reason?: string | null;
}): Promise<DistractorExplanationResponse> {
  return apiFetch<DistractorExplanationResponse>("/api/reading/explain", {
    method: "POST",
    headers: personalGeminiHeaders(),
    body: JSON.stringify(payload),
  });
}

// ==================== LISTENING ====================

export function fetchListeningTests(): Promise<ListeningTestSummary[]> {
  return apiFetch<ListeningTestSummary[]>("/api/listening/tests");
}

export function fetchListeningTestDetail(
  testId: string,
  partIndex?: number | null
): Promise<ListeningTestDetail> {
  const qs = partIndex ? `?part_index=${partIndex}` : "";
  return apiFetch<ListeningTestDetail>(`/api/listening/tests/${testId}${qs}`);
}

export function createListeningSession(payload: {
  test_id: string;
  mode: "drill" | "section_mock";
  passage_index?: number | null;
}): Promise<CreateSessionResponse> {
  return apiFetch<CreateSessionResponse>("/api/listening/sessions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function submitListeningSession(
  sessionId: string,
  answers: Record<string, string>,
  durationSec: number
): Promise<SubmitSessionResponse> {
  return apiFetch<SubmitSessionResponse>(`/api/listening/sessions/${sessionId}/submit`, {
    method: "POST",
    body: JSON.stringify({ answers, duration_sec: durationSec }),
  });
}

export function explainListeningDistractor(payload: {
  item_id: string;
  user_answer: string;
  failure_reason?: string | null;
}): Promise<DistractorExplanationResponse> {
  return apiFetch<DistractorExplanationResponse>("/api/listening/explain", {
    method: "POST",
    headers: personalGeminiHeaders(),
    body: JSON.stringify(payload),
  });
}

export function synthesizeListeningPartAudio(
  testId: string,
  partIndex: number
): Promise<{ audio_url: string; bytes: number; model: string }> {
  return apiFetch(`/api/listening/tests/${testId}/parts/${partIndex}/synthesize`, {
    method: "POST",
    headers: personalGeminiHeaders(),
  });
}

// ==================== UNIFIED PROGRESS, PAST SESSIONS, RESETS & SETTINGS ====================

export function fetchUnifiedProgress(moduleName?: string): Promise<ProgressSummaryResponse> {
  const qs = moduleName ? `?module=${encodeURIComponent(moduleName)}` : "";
  return apiFetch<ProgressSummaryResponse>(`/api/progress${qs}`);
}

export function fetchCompletedSession(sessionId: string): Promise<SubmitSessionResponse> {
  return apiFetch<SubmitSessionResponse>(`/api/sessions/${sessionId}`);
}

export function resetRecentSessions(moduleName?: string): Promise<{ deleted_count: number; scope: string }> {
  const qs = moduleName ? `?module=${encodeURIComponent(moduleName)}` : "";
  return apiFetch(`/api/sessions${qs}`, { method: "DELETE" });
}

export function resetSkillProfile(moduleName?: string): Promise<{ deleted_count: number; scope: string }> {
  const qs = moduleName ? `?module=${encodeURIComponent(moduleName)}` : "";
  return apiFetch(`/api/skills${qs}`, { method: "DELETE" });
}

export function fetchStrategyNotes(moduleName?: string): Promise<StrategyNoteItem[]> {
  const qs = moduleName ? `?module=${encodeURIComponent(moduleName)}` : "";
  return apiFetch<StrategyNoteItem[]>(`/api/notes${qs}`);
}

export function testPersonalGeminiKey(apiKey: string, model: string): Promise<TestGeminiKeyResponse> {
  return apiFetch<TestGeminiKeyResponse>("/api/settings/test-gemini", {
    method: "POST",
    body: JSON.stringify({ api_key: apiKey, model }),
  });
}
