import { supabase } from "./supabase";

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

// ── 타입 정의 ──────────────────────────────────────────────

export type ItemStatus = "pending" | "processing" | "ready" | "failed";

export interface Item {
  id: string;
  status: ItemStatus;
  category: string | null;
  tags: string[] | null;
  summary: string | null;
  place: string | null;
  captured_at: string | null;
  created_at: string;
  original_filename: string | null;
}

export interface IngestResponse {
  item_id: string;
  status: "pending";
}

export interface SignedUrlResponse {
  signed_url: string;
}

export interface SearchEvidence {
  id: string;
  summary: string | null;
  category: string | null;
  place: string | null;
  captured_at: string | null;
}

export interface SearchResponse {
  answer: string;
  evidence: SearchEvidence[];
  query: string;
}

export interface SearchParams {
  query: string;
  category?: string;
  place?: string;
  date_from?: string;
  date_to?: string;
}

// ── 인증 헤더 ──────────────────────────────────────────────

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("로그인이 필요합니다.");
  return { Authorization: `Bearer ${token}` };
}

// ── API 호출 래퍼 ──────────────────────────────────────────

async function apiFetch<T>(
  method: string,
  path: string,
  body?: unknown,
  auth = true,
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const authHeader = await getAuthHeader();
    Object.assign(headers, authHeader);
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API 오류 ${res.status}: ${text}`);
  }
  // 204 No Content
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

// ── 엔드포인트별 함수 ──────────────────────────────────────

export async function ingest(
  storagePath: string,
  originalFilename: string,
): Promise<IngestResponse> {
  return apiFetch<IngestResponse>("POST", "/ingest", {
    storage_path: storagePath,
    original_filename: originalFilename,
  });
}

export async function retryItem(id: string): Promise<void> {
  return apiFetch<void>("POST", `/ingest/${id}/retry`);
}

export async function getItems(): Promise<Item[]> {
  return apiFetch<Item[]>("GET", "/items");
}

export async function getItem(id: string): Promise<Item> {
  return apiFetch<Item>("GET", `/items/${id}`);
}

export async function getSignedUrl(id: string): Promise<SignedUrlResponse> {
  return apiFetch<SignedUrlResponse>("GET", `/items/${id}/signed-url`);
}

export async function deleteItem(id: string): Promise<void> {
  return apiFetch<void>("DELETE", `/items/${id}`);
}

export async function search(params: SearchParams): Promise<SearchResponse> {
  return apiFetch<SearchResponse>("POST", "/search", params);
}
