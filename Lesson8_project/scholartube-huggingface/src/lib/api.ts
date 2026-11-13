import type {
  AuthLoginPayload,
  AuthRegisterPayload,
  AuthTokenRead,
  CourseDetailRead,
  CourseListRead,
  EnrollmentRead,
  HealthRead,
  LessonArtifactPayload,
  LessonStudyStateRead,
  LessonSummaryPayload,
  ProgressRead,
  StudyArtifactPayload,
  StudyArtifactRead,
  SummaryPayload,
  SummaryRead,
  TranscriptLoadPayload,
  UserRead,
  VideoDetailRead,
  VideoRead,
} from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

async function request<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const body = (await response.json()) as { detail?: string };
      message = body.detail ?? message;
    } catch {
      message = await response.text();
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function getHealth(): Promise<HealthRead> {
  return request<HealthRead>("/health", { cache: "no-store" });
}

export function login(payload: AuthLoginPayload): Promise<AuthTokenRead> {
  return request<AuthTokenRead>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function register(payload: AuthRegisterPayload): Promise<AuthTokenRead> {
  return request<AuthTokenRead>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMe(token: string): Promise<UserRead> {
  return request<UserRead>("/auth/me", { cache: "no-store" }, token);
}

export function getVideos(): Promise<VideoRead[]> {
  return request<VideoRead[]>("/videos", { cache: "no-store" });
}

export function getVideo(videoId: string): Promise<VideoDetailRead> {
  return request<VideoDetailRead>(`/videos/${videoId}`, { cache: "no-store" });
}

export function loadTranscript(payload: TranscriptLoadPayload): Promise<VideoDetailRead> {
  return request<VideoDetailRead>("/transcripts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createSummary(payload: SummaryPayload): Promise<SummaryRead> {
  return request<SummaryRead>("/summaries", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createStudyArtifact(payload: StudyArtifactPayload): Promise<StudyArtifactRead> {
  return request<StudyArtifactRead>("/study-artifacts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getDemoUsers(token?: string): Promise<UserRead[]> {
  return request<UserRead[]>("/marketplace/users", { cache: "no-store" }, token);
}

export function getCourses(userId?: string, category?: string, query?: string, token?: string): Promise<CourseListRead[]> {
  const params = new URLSearchParams();
  if (userId) params.set("user_id", userId);
  if (category && category !== "all") params.set("category", category);
  if (query) params.set("q", query);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return request<CourseListRead[]>(`/marketplace/courses${suffix}`, { cache: "no-store" }, token);
}

export function getCourse(courseId: string, userId?: string, token?: string): Promise<CourseDetailRead> {
  const suffix = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
  return request<CourseDetailRead>(`/marketplace/courses/${courseId}${suffix}`, { cache: "no-store" }, token);
}

export function enrollCourse(userId: string, courseId: string, token?: string): Promise<EnrollmentRead> {
  return request<EnrollmentRead>("/marketplace/enrollments", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, course_id: courseId }),
  }, token);
}

export function updateLessonProgress(userId: string, lessonId: string, token?: string): Promise<ProgressRead> {
  return request<ProgressRead>("/marketplace/progress", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, lesson_id: lessonId, progress_percent: 100, completed: true }),
  }, token);
}

export function getLessonStudyState(lessonId: string, token?: string): Promise<LessonStudyStateRead> {
  return request<LessonStudyStateRead>(`/marketplace/lessons/${lessonId}/study-state`, { cache: "no-store" }, token);
}

export function createLessonSummary(lessonId: string, payload: LessonSummaryPayload, token?: string): Promise<SummaryRead> {
  return request<SummaryRead>(`/marketplace/lessons/${lessonId}/summary`, {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export function createLessonArtifact(lessonId: string, payload: LessonArtifactPayload, token?: string): Promise<StudyArtifactRead> {
  return request<StudyArtifactRead>(`/marketplace/lessons/${lessonId}/artifacts`, {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}
