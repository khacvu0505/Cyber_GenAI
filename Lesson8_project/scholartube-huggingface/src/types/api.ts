export type Language = "vi" | "en";
export type DetailLevel = "brief" | "standard" | "deep";
export type ArtifactType = "key_concepts" | "flashcards" | "quiz" | "outline";
export type UserRole = "student" | "instructor" | "admin";

export interface HealthRead {
  status: string;
  app_name: string;
  environment: string;
  database: string;
  ai_provider: "huggingface";
  hf_configured: boolean;
  hf_model: string;
  hf_inference_provider: string;
}

export interface TranscriptChunkRead {
  id: string;
  chunk_index: number;
  start_seconds: number | null;
  end_seconds: number | null;
  text: string;
  extra_metadata: Record<string, unknown>;
  created_at: string;
}

export interface SummaryRead {
  id: string;
  video_id: string;
  language: string;
  detail_level: string;
  content: string;
  model_name: string;
  created_at: string;
}

export interface StudyArtifactRead {
  id: string;
  video_id: string;
  artifact_type: string;
  language: string;
  content: {
    type?: string;
    items?: unknown[];
    [key: string]: unknown;
  };
  model_name: string;
  created_at: string;
}

export interface UserRead {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url: string | null;
}

export interface AuthLoginPayload {
  email: string;
  password: string;
}

export interface AuthRegisterPayload {
  name: string;
  email: string;
  password: string;
  role: "student" | "instructor";
}

export interface AuthTokenRead {
  access_token: string;
  token_type: "bearer";
  user: UserRead;
}

export interface InstructorRead {
  id: string;
  name: string;
  role: string;
  avatar_url: string | null;
}

export interface LessonRead {
  id: string;
  video_id: string;
  title: string;
  description: string;
  position: number;
  duration_minutes: number;
  is_preview: boolean;
  youtube_url: string;
}

export interface SectionRead {
  id: string;
  title: string;
  position: number;
  lessons: LessonRead[];
}

export interface CourseListRead {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  category: string;
  level: string;
  language: string;
  price: number;
  rating: number;
  rating_count: number;
  students_count: number;
  duration_minutes: number;
  thumbnail_url: string;
  instructor: InstructorRead;
  section_count: number;
  lesson_count: number;
  enrolled: boolean;
  progress_percent: number;
}

export interface CourseDetailRead extends CourseListRead {
  description: string;
  sections: SectionRead[];
}

export interface EnrollmentRead {
  id: string;
  user_id: string;
  course_id: string;
  status: string;
  progress_percent: number;
  enrolled_at: string;
}

export interface ProgressRead {
  id: string;
  user_id: string;
  lesson_id: string;
  status: string;
  progress_percent: number;
  completed_at: string | null;
  updated_at: string;
  course_progress_percent: number;
}

export interface LessonStudyStateRead {
  lesson_id: string;
  summary: SummaryRead | null;
  key_concepts: StudyArtifactRead | null;
  flashcards: StudyArtifactRead | null;
}

export interface VideoRead {
  id: string;
  source_url: string;
  title: string | null;
  channel: string | null;
  duration_seconds: number | null;
  language: string | null;
  transcript_status: string;
  created_at: string;
  updated_at: string;
}

export interface VideoDetailRead extends VideoRead {
  chunks: TranscriptChunkRead[];
  summaries: SummaryRead[];
  study_artifacts: StudyArtifactRead[];
}

export interface TranscriptLoadPayload {
  youtube_url: string;
  add_video_info: boolean;
  chunked: boolean;
  chunk_size_seconds: number;
  preferred_languages: Language[];
  translate_to?: Language;
}

export interface SummaryPayload {
  video_id?: string;
  youtube_url?: string;
  language: Language;
  detail_level: DetailLevel;
  temperature: number;
  model_name?: string;
  chunk_size_seconds: number;
  preferred_languages: Language[];
  translate_to?: Language;
}

export interface StudyArtifactPayload {
  video_id?: string;
  youtube_url?: string;
  artifact_type: ArtifactType;
  language: Language;
  temperature: number;
  model_name?: string;
  chunk_size_seconds: number;
  preferred_languages: Language[];
  translate_to?: Language;
}

export interface LessonSummaryPayload {
  language: Language;
  detail_level: DetailLevel;
  temperature: number;
  model_name?: string;
  chunk_size_seconds: number;
  preferred_languages: Language[];
  translate_to?: Language;
}

export interface LessonArtifactPayload {
  artifact_type: "key_concepts" | "flashcards";
  language: Language;
  temperature: number;
  model_name?: string;
  chunk_size_seconds: number;
  preferred_languages: Language[];
  translate_to?: Language;
}
