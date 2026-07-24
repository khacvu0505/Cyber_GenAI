import type {
  HealthRead,
  ProblemRead,
  ReasoningPayload,
  ReasoningResponse,
  Subject,
  AuthRead,
  DashboardRead,
  RegisterPayload,
} from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api";
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

async function request<T>(path: string, init?: RequestInit, authenticated = false): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(authenticated && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const body = (await response.json()) as { detail?: string };
      message = body.detail ?? message;
    } catch {
      // Keep the HTTP status when the response is not JSON.
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export function getHealth(): Promise<HealthRead> {
  return request<HealthRead>("/health", { cache: "no-store" });
}

export function getProblems(subject?: Subject): Promise<ProblemRead[]> {
  const query = subject ? `?subject=${encodeURIComponent(subject)}` : "";
  return request<ProblemRead[]>(`/problems${query}`, { cache: "no-store" }, true);
}

export function reasonAboutProblem(payload: ReasoningPayload): Promise<ReasoningResponse> {
  return request<ReasoningResponse>("/reason", {
    method: "POST",
    body: JSON.stringify(payload),
  }, true);
}

export async function login(email: string, password: string): Promise<AuthRead> {
  const result = await request<AuthRead>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setAccessToken(result.access_token);
  return result;
}

export async function register(payload: RegisterPayload): Promise<AuthRead> {
  const result = await request<AuthRead>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setAccessToken(result.access_token);
  return result;
}

export async function refreshSession(): Promise<AuthRead> {
  const result = await request<AuthRead>("/auth/refresh", { method: "POST" });
  setAccessToken(result.access_token);
  return result;
}

export async function logout(): Promise<void> {
  await request<{ message: string }>("/auth/logout", { method: "POST" });
  setAccessToken(null);
}

export function getDashboard(): Promise<DashboardRead> {
  return request<DashboardRead>("/me/dashboard", { cache: "no-store" }, true);
}
