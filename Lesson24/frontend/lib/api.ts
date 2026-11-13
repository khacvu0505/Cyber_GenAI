import type {
  DashboardResponse,
  DataSourceConnectInput,
  DataSourceConnectResponse,
  MetaResponse,
} from "@/lib/types";
import type { SecureDashboardResponse } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? `Request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  meta: () => request<MetaResponse>("/api/meta"),
  connect: (payload: DataSourceConnectInput) =>
    request<DataSourceConnectResponse>("/api/datasources/connect", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  dashboard: (connectionId: string, objective?: string) =>
    request<DashboardResponse>("/api/dashboard/generate", {
      method: "POST",
      body: JSON.stringify({ connection_id: connectionId, objective }),
    }),
  copilot: (connectionId: string, prompt: string) =>
    request<DashboardResponse>("/api/copilot/query", {
      method: "POST",
      body: JSON.stringify({ connection_id: connectionId, prompt }),
    }),
  login: (email: string, password: string) => request<AuthResponse>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (companyName: string, displayName: string, email: string, password: string) => request<AuthResponse>("/api/auth/register", { method: "POST", body: JSON.stringify({ company_name: companyName, display_name: displayName, email, password }) }),
  me: (token: string) => request<User>("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } }),
  users: (token: string) => request<TenantUser[]>("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } }),
  invite: (token: string, payload: { email: string; display_name: string; role: string; password: string }) => request<{ status: string }>("/api/admin/users", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) }),
  secureQuery: (token: string, prompt: string) =>
    request<SecureDashboardResponse>("/api/secure/query", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ prompt }),
    }),
};

type User = { email: string; role: string; tenant_id: string };
type AuthResponse = { access_token: string; user: User };
type TenantUser = { email: string; display_name: string; status: string; role_name: string };
