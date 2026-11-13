-- ScholarTube Edu PostgreSQL schema
-- Run this inside the target database before importing sample_data.sql.
--
-- Optional local PostgreSQL setup:
--   CREATE DATABASE scholartube_edu;
--   \connect scholartube_edu

BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  role VARCHAR(32) NOT NULL DEFAULT 'student',
  avatar_url VARCHAR(1024),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS videos (
  id VARCHAR(36) PRIMARY KEY,
  source_url VARCHAR(1024) NOT NULL UNIQUE,
  title VARCHAR(512),
  channel VARCHAR(256),
  duration_seconds INTEGER,
  language VARCHAR(32),
  transcript_status VARCHAR(32) NOT NULL DEFAULT 'loaded',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS courses (
  id VARCHAR(36) PRIMARY KEY,
  instructor_id VARCHAR(36) NOT NULL REFERENCES users(id),
  title VARCHAR(240) NOT NULL,
  slug VARCHAR(260) NOT NULL UNIQUE,
  subtitle VARCHAR(360) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(80) NOT NULL,
  level VARCHAR(80) NOT NULL,
  language VARCHAR(40) NOT NULL DEFAULT 'Vietnamese',
  price DOUBLE PRECISION NOT NULL DEFAULT 0,
  rating DOUBLE PRECISION NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  students_count INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  thumbnail_url VARCHAR(1024) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS course_sections (
  id VARCHAR(36) PRIMARY KEY,
  course_id VARCHAR(36) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(240) NOT NULL,
  position INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS lessons (
  id VARCHAR(36) PRIMARY KEY,
  section_id VARCHAR(36) NOT NULL REFERENCES course_sections(id) ON DELETE CASCADE,
  video_id VARCHAR(36) NOT NULL REFERENCES videos(id),
  title VARCHAR(240) NOT NULL,
  description TEXT NOT NULL,
  position INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  is_preview BOOLEAN NOT NULL DEFAULT FALSE,
  youtube_url VARCHAR(1024) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS enrollments (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id VARCHAR(36) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  progress_percent DOUBLE PRECISION NOT NULL DEFAULT 0,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_enrollment_user_course UNIQUE (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id VARCHAR(36) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  rating DOUBLE PRECISION NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_review_user_course UNIQUE (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS lesson_progress (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id VARCHAR(36) NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  status VARCHAR(32) NOT NULL DEFAULT 'not_started',
  progress_percent DOUBLE PRECISION NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_progress_user_lesson UNIQUE (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS transcript_chunks (
  id VARCHAR(36) PRIMARY KEY,
  video_id VARCHAR(36) NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  start_seconds DOUBLE PRECISION,
  end_seconds DOUBLE PRECISION,
  text TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS summaries (
  id VARCHAR(36) PRIMARY KEY,
  video_id VARCHAR(36) NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  language VARCHAR(32) NOT NULL,
  detail_level VARCHAR(32) NOT NULL,
  content TEXT NOT NULL,
  model_name VARCHAR(128) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS study_artifacts (
  id VARCHAR(36) PRIMARY KEY,
  video_id VARCHAR(36) NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  artifact_type VARCHAR(32) NOT NULL,
  language VARCHAR(32) NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  model_name VARCHAR(128) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);
CREATE INDEX IF NOT EXISTS ix_videos_source_url ON videos(source_url);
CREATE INDEX IF NOT EXISTS ix_courses_instructor_id ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS ix_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS ix_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS ix_course_sections_course_id ON course_sections(course_id);
CREATE INDEX IF NOT EXISTS ix_lessons_section_id ON lessons(section_id);
CREATE INDEX IF NOT EXISTS ix_lessons_video_id ON lessons(video_id);
CREATE INDEX IF NOT EXISTS ix_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS ix_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS ix_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS ix_reviews_course_id ON reviews(course_id);
CREATE INDEX IF NOT EXISTS ix_lesson_progress_user_id ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS ix_lesson_progress_lesson_id ON lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS ix_transcript_chunks_video_id ON transcript_chunks(video_id);
CREATE INDEX IF NOT EXISTS ix_summaries_video_id ON summaries(video_id);
CREATE INDEX IF NOT EXISTS ix_study_artifacts_video_id ON study_artifacts(video_id);

COMMIT;
