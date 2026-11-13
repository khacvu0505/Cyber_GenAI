import type {
  DashboardResponse,
  DataSourceConnectInput,
  DataSourceConnectResponse,
  MetaResponse,
} from "@/lib/types";

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
};
