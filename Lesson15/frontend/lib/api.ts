import { getAccessToken } from "./auth";
import { AuthResponse, Proposal, ProposalInput, ProposalSummary, User } from "./types";

const API_BASE = "/api/backend/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `API error ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const authApi = {
  register: (payload: { full_name: string; email: string; password: string }) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (payload: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  me: () => request<User>("/auth/me"),
};

export const proposalApi = {
  list: () => request<ProposalSummary[]>("/proposals"),
  get: (id: string) => request<Proposal>(`/proposals/${id}`),
  create: (payload: ProposalInput) =>
    request<Proposal>("/proposals", { method: "POST", body: JSON.stringify(payload) }),
  retry: (id: string) => request<Proposal>(`/proposals/${id}/run`, { method: "POST" }),
};
