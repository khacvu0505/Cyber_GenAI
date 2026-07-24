import type {
  AnalysisDetail,
  AnalysisListItem,
  AuthResponse,
  CVProfileListItem,
  DashboardResponse,
  JDProfileListItem,
  RankingResponse,
  UserResponse
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8008";

type ApiErrorPayload = {
  detail?: string | { message?: string; errors?: string[] } | Array<{ msg?: string }>;
};

export type RankingEngine = "heuristic" | "openai";

type RankCandidatesInput = {
  token: string;
  jd: File;
  cvs: File[];
  engine: RankingEngine;
  model?: string;
  analysisTitle?: string;
};

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`
  };
}

function extractErrorMessage(payload: ApiErrorPayload, fallback: string) {
  if (typeof payload.detail === "string") {
    return payload.detail;
  }
  if (Array.isArray(payload.detail)) {
    return payload.detail.map((item) => item.msg ?? "Validation error").join(", ");
  }
  if (payload.detail?.message) {
    return payload.detail.message;
  }
  if (payload.detail?.errors?.length) {
    return payload.detail.errors.join("; ");
  }
  return fallback;
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init);

  if (!response.ok) {
    let message = `Request failed with ${response.status}`;
    try {
      const payload = (await response.json()) as ApiErrorPayload;
      message = extractErrorMessage(payload, message);
    } catch {
      // Keep the fallback message.
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function register(input: {
  email: string;
  password: string;
  full_name: string;
}): Promise<AuthResponse> {
  return requestJson<AuthResponse>("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
}

export async function login(input: { email: string; password: string }): Promise<AuthResponse> {
  return requestJson<AuthResponse>("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
}

export async function fetchMe(token: string): Promise<UserResponse> {
  return requestJson<UserResponse>("/api/auth/me", {
    headers: authHeaders(token)
  });
}

export async function fetchDashboard(token: string): Promise<DashboardResponse> {
  return requestJson<DashboardResponse>("/api/dashboard", {
    headers: authHeaders(token)
  });
}

export async function fetchAnalyses(token: string): Promise<AnalysisListItem[]> {
  return requestJson<AnalysisListItem[]>("/api/analyses", {
    headers: authHeaders(token)
  });
}

export async function fetchAnalysis(token: string, analysisId: string): Promise<AnalysisDetail> {
  return requestJson<AnalysisDetail>(`/api/analyses/${analysisId}`, {
    headers: authHeaders(token)
  });
}

export async function fetchJDProfiles(token: string): Promise<JDProfileListItem[]> {
  return requestJson<JDProfileListItem[]>("/api/library/jds", {
    headers: authHeaders(token)
  });
}

export async function fetchCVProfiles(token: string): Promise<CVProfileListItem[]> {
  return requestJson<CVProfileListItem[]>("/api/library/cvs", {
    headers: authHeaders(token)
  });
}

export async function rankCandidates({
  token,
  jd,
  cvs,
  engine,
  model,
  analysisTitle
}: RankCandidatesInput): Promise<RankingResponse> {
  const formData = new FormData();
  formData.append("jd", jd);
  cvs.forEach((file) => formData.append("cvs", file));
  formData.append("engine", engine);
  if (model) {
    formData.append("model", model);
  }
  if (analysisTitle) {
    formData.append("analysis_title", analysisTitle);
  }

  const response = await fetch(`${API_BASE}/api/rank`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData
  });

  if (!response.ok) {
    let message = `Request failed with ${response.status}`;
    try {
      const payload = (await response.json()) as ApiErrorPayload;
      message = extractErrorMessage(payload, message);
    } catch {
      // Keep the fallback message.
    }
    throw new Error(message);
  }

  return (await response.json()) as RankingResponse;
}
