import type { CopilotResponse, DashboardResponse, MetaResponse } from "./types";


const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail ?? `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  overview: () => request<DashboardResponse>("/api/dashboard/overview"),
  meta: () => request<MetaResponse>("/api/meta"),
  copilot: (prompt: string) =>
    request<CopilotResponse>("/api/copilot/query", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),
};
