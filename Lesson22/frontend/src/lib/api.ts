export type DocumentItem = {
  id: string; matter_code: string | null; title: string; filename: string;
  size_bytes: number; status: string; page_count: number | null;
  chunk_count: number | null; error_message: string | null; created_at: string;
};
export type User = { id: string; email: string; full_name: string };
export type Citation = { document_id: string; title: string; page: number; score: number };

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const response = await fetch(`/api/v1${path}`, { ...init, headers });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail || `HTTP ${response.status}`);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export const api = {
  auth: (mode: "login" | "register", payload: object) => request<{ access_token: string; user: User }>(`/auth/${mode}`, { method: "POST", body: JSON.stringify(payload) }),
  documents: (token: string) => request<DocumentItem[]>("/documents", {}, token),
  upload: (token: string, data: FormData) => request<DocumentItem>("/documents", { method: "POST", body: data }, token),
  remove: (token: string, id: string) => request<void>(`/documents/${id}`, { method: "DELETE" }, token),
  ask: (token: string, payload: object) => request<{ answer: string; citations: Citation[] }>("/query", { method: "POST", body: JSON.stringify(payload) }, token),
};
