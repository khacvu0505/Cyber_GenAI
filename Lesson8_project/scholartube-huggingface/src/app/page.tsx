"use client";

import {
  AlertCircle,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock3,
  Database,
  GraduationCap,
  Layers3,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  PlayCircle,
  Search,
  Sparkles,
  Star,
  UserPlus,
  UserRound,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { LessonPlayer } from "@/components/LessonPlayer";
import {
  createLessonArtifact,
  createLessonSummary,
  enrollCourse,
  getCourse,
  getCourses,
  getHealth,
  getLessonStudyState,
  getMe,
  login as loginRequest,
  register as registerRequest,
  updateLessonProgress,
} from "@/lib/api";
import type {
  CourseDetailRead,
  CourseListRead,
  HealthRead,
  Language,
  LessonRead,
  LessonStudyStateRead,
  StudyArtifactRead,
  SummaryRead,
  UserRead,
} from "@/types/api";

type BusyState = "idle" | "loading" | "auth" | "enrolling" | "progress" | "summary" | "concepts" | "flashcards";

const categories = ["all", "Python cơ bản", "Toán học cho AI", "ML/DL", "Computer Vision", "NLP"];

export default function Home() {
  const [health, setHealth] = useState<HealthRead | null>(null);
  const [activeUser, setActiveUser] = useState<UserRead | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("student@scholartube.edu");
  const [authPassword, setAuthPassword] = useState("Demo@12345");
  const [authRole, setAuthRole] = useState<"student" | "instructor">("student");
  const [courses, setCourses] = useState<CourseListRead[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseDetailRead | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<LessonRead | null>(null);
  const [studyState, setStudyState] = useState<LessonStudyStateRead | null>(null);
  const [summary, setSummary] = useState<SummaryRead | null>(null);
  const [concepts, setConcepts] = useState<StudyArtifactRead | null>(null);
  const [flashcards, setFlashcards] = useState<StudyArtifactRead | null>(null);
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [transcriptPriority, setTranscriptPriority] = useState<"vi-first" | "en-first">("vi-first");
  const [translationTarget, setTranslationTarget] = useState<Language | "none">("vi");
  const [busy, setBusy] = useState<BusyState>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void bootstrap();
  }, []);

  useEffect(() => {
    if (activeUser && authToken) {
      void refreshCourses(activeUser.id, category, query, authToken);
    }
  }, [activeUser, authToken, category, query]);

  useEffect(() => {
    if (selectedLesson && authToken) {
      void refreshStudyState(selectedLesson.id, authToken);
    }
  }, [selectedLesson, authToken]);

  const courseLessons = useMemo(
    () => selectedCourse?.sections.flatMap((section) => section.lessons) ?? [],
    [selectedCourse],
  );

  const activeUserCourses = useMemo(
    () => courses.filter((course) => course.instructor.id === activeUser?.id),
    [courses, activeUser],
  );

  async function bootstrap() {
    setBusy("loading");
    try {
      const nextHealth = await getHealth();
      const storedToken = typeof window !== "undefined" ? window.localStorage.getItem("scholartube_edu_token") : null;
      let restoredUser: UserRead | null = null;
      if (storedToken) {
        try {
          restoredUser = await getMe(storedToken);
          setAuthToken(storedToken);
        } catch {
          window.localStorage.removeItem("scholartube_edu_token");
        }
      }
      setHealth(nextHealth);
      setActiveUser(restoredUser);
      if (restoredUser) {
        const nextCourses = await getCourses(restoredUser.id, undefined, undefined, storedToken ?? undefined);
        setCourses(nextCourses);
        const firstCourse = nextCourses[0];
        if (firstCourse) {
          await openCourse(firstCourse.id, restoredUser.id, storedToken ?? undefined);
        }
      }
    } catch (exception) {
      setError(toErrorMessage(exception));
    } finally {
      setBusy("idle");
    }
  }

  async function refreshCourses(userId?: string, nextCategory = category, nextQuery = query, token = authToken) {
    if (!token) return;
    try {
      setCourses(await getCourses(userId, nextCategory, nextQuery, token));
    } catch (exception) {
      setError(toErrorMessage(exception));
    }
  }

  async function openCourse(courseId: string, userId = activeUser?.id, token = authToken) {
    if (!token) return;
    setError(null);
    try {
      const course = await getCourse(courseId, userId, token);
      setSelectedCourse(course);
      const firstLesson = course.sections[0]?.lessons[0] ?? null;
      setSelectedLesson(firstLesson);
    } catch (exception) {
      setError(toErrorMessage(exception));
    }
  }

  async function refreshStudyState(lessonId: string, token = authToken) {
    if (!token) return;
    try {
      const nextState = await getLessonStudyState(lessonId, token);
      setStudyState(nextState);
      setSummary(nextState.summary);
      setConcepts(nextState.key_concepts);
      setFlashcards(nextState.flashcards);
    } catch {
      setStudyState(null);
      setSummary(null);
      setConcepts(null);
      setFlashcards(null);
    }
  }

  async function handleEnroll() {
    if (!activeUser || !authToken || !selectedCourse) return;
    setError(null);
    setBusy("enrolling");
    try {
      await enrollCourse(activeUser.id, selectedCourse.id, authToken);
      await refreshCourses(activeUser.id);
      await openCourse(selectedCourse.id, activeUser.id);
    } catch (exception) {
      setError(toErrorMessage(exception));
    } finally {
      setBusy("idle");
    }
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy("auth");
    try {
      const response =
        authMode === "login"
          ? await loginRequest({ email: authEmail, password: authPassword })
          : await registerRequest({
              name: authName,
              email: authEmail,
              password: authPassword,
              role: authRole,
            });

      window.localStorage.setItem("scholartube_edu_token", response.access_token);
      setAuthToken(response.access_token);
      setActiveUser(response.user);
      const nextCourses = await getCourses(response.user.id, undefined, undefined, response.access_token);
      setCourses(nextCourses);
      const nextCourseId = selectedCourse?.id ?? nextCourses[0]?.id;
      if (nextCourseId) {
        await openCourse(nextCourseId, response.user.id, response.access_token);
      }
    } catch (exception) {
      setError(toErrorMessage(exception));
    } finally {
      setBusy("idle");
    }
  }

  function handleLogout() {
    window.localStorage.removeItem("scholartube_edu_token");
    setAuthToken(null);
    setActiveUser(null);
    setCourses([]);
    setSelectedCourse(null);
    setSelectedLesson(null);
    setStudyState(null);
    setSummary(null);
    setConcepts(null);
    setFlashcards(null);
  }

  async function handleCompleteLesson() {
    if (!activeUser || !authToken || !selectedCourse || !selectedLesson) return;
    setError(null);
    setBusy("progress");
    try {
      await updateLessonProgress(activeUser.id, selectedLesson.id, authToken);
      await refreshCourses(activeUser.id, category, query, authToken);
      await openCourse(selectedCourse.id, activeUser.id, authToken);
    } catch (exception) {
      setError(toErrorMessage(exception));
    } finally {
      setBusy("idle");
    }
  }

  async function handleSummary() {
    if (!selectedLesson || !authToken) return;
    setError(null);
    setBusy("summary");
    try {
      const result = await createLessonSummary(
        selectedLesson.id,
        {
          language: "vi",
          detail_level: "standard",
          temperature: 0.2,
          chunk_size_seconds: 120,
          preferred_languages: transcriptPriority === "vi-first" ? ["vi", "en"] : ["en", "vi"],
          translate_to: translationTarget === "none" ? undefined : translationTarget,
        },
        authToken,
      );
      setSummary(result);
    } catch (exception) {
      setError(toErrorMessage(exception));
    } finally {
      setBusy("idle");
    }
  }

  async function handleArtifact(kind: "key_concepts" | "flashcards") {
    if (!selectedLesson || !authToken) return;
    setError(null);
    setBusy(kind === "key_concepts" ? "concepts" : "flashcards");
    try {
      const result = await createLessonArtifact(
        selectedLesson.id,
        {
          artifact_type: kind,
          language: "vi",
          temperature: 0.2,
          chunk_size_seconds: 120,
          preferred_languages: transcriptPriority === "vi-first" ? ["vi", "en"] : ["en", "vi"],
          translate_to: translationTarget === "none" ? undefined : translationTarget,
        },
        authToken,
      );
      if (kind === "key_concepts") {
        setConcepts(result);
      } else {
        setFlashcards(result);
      }
    } catch (exception) {
      setError(toErrorMessage(exception));
    } finally {
      setBusy("idle");
    }
  }

  const isStudent = activeUser?.role === "student";
  const isBusy = busy !== "idle";

  if (!activeUser) {
    return (
      <main className="authShell">
        <section className="authHero">
          <div className="authHeader">
            <p className="eyebrow">AI-powered course marketplace</p>
            <h1>ScholarTube Edu</h1>
            <p>
              Đăng nhập để vào lớp học, theo dõi progress, xem video học thuật và dùng AI tạo summary,
              key concepts, flashcards theo từng bài giảng.
            </p>
            <div className="heroStats authStats">
              <Metric icon={<BookOpen size={16} />} label="Catalog" value="Python, ML/DL, CV, NLP" />
              <Metric icon={<Brain size={16} />} label="AI Study" value="Summary + Concepts" />
              <Metric icon={<GraduationCap size={16} />} label="Progress" value="Enrollment tracking" />
            </div>
          </div>

          <div className="authCard panel">
            <div className="authCardHeader">
              <span className="authIcon">
                <UserRound size={22} />
              </span>
              <div>
                <p className="eyebrow">Account</p>
                <h2>{authMode === "login" ? "Login to continue" : "Create your account"}</h2>
              </div>
            </div>
            <AuthForm
              authMode={authMode}
              setAuthMode={setAuthMode}
              authName={authName}
              setAuthName={setAuthName}
              authEmail={authEmail}
              setAuthEmail={setAuthEmail}
              authPassword={authPassword}
              setAuthPassword={setAuthPassword}
              authRole={authRole}
              setAuthRole={setAuthRole}
              busy={busy}
              onSubmit={handleAuthSubmit}
            />
            <div className="authDemoBox">
              <strong>Demo accounts</strong>
              <span>student@scholartube.edu / Demo@12345</span>
              <span>admin@scholartube.edu / Demo@12345</span>
              <span>khoa.pham@scholartube.edu / Demo@12345</span>
            </div>
          </div>
        </section>

        {error ? (
          <div className="notice errorNotice authNotice">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        ) : null}
      </main>
    );
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Marketplace for academic AI learning</p>
          <h1>ScholarTube Edu</h1>
        </div>
        <div className="topbarActions">
          <StatusPill
            label={health?.database ?? "offline"}
            tone={health ? "ok" : "warn"}
            icon={<Database size={15} />}
          />
          <StatusPill
            label={health?.hf_configured ? "Hugging Face ready" : "Hugging Face missing"}
            tone={health?.hf_configured ? "ok" : "warn"}
            icon={health?.hf_configured ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          />
          <div className="accountPill">
            <UserRound size={16} />
            <span>
              {activeUser.name} <small>{activeUser.role}</small>
            </span>
            <button type="button" onClick={handleLogout} title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {error ? (
        <div className="notice errorNotice">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      ) : null}

      <section className="marketLayout">
        <aside className="panel catalogPanel">
          <div className="panelHeader compact">
            <div>
              <p className="eyebrow">Catalog</p>
              <h2>Explore courses</h2>
            </div>
            <BookOpen size={20} />
          </div>

          <label className="searchBox">
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ML, Python, NLP..." />
          </label>

          <div className="categoryRow">
            {categories.map((item) => (
              <button
                className={`chip ${category === item ? "active" : ""}`}
                type="button"
                key={item}
                onClick={() => setCategory(item)}
              >
                {item === "all" ? "All" : item}
              </button>
            ))}
          </div>

          <div className="courseList">
            {courses.map((course) => (
              <button
                className={`courseCard ${selectedCourse?.id === course.id ? "active" : ""}`}
                key={course.id}
                type="button"
                onClick={() => void openCourse(course.id)}
              >
                <img src={course.thumbnail_url} alt="" />
                <div>
                  <strong>{course.title}</strong>
                  <p>{course.subtitle}</p>
                  <div className="courseMeta">
                    <span>
                      <Star size={13} /> {course.rating}
                    </span>
                    <span>{formatCurrency(course.price)}</span>
                    <span>{course.lesson_count} lessons</span>
                  </div>
                  {course.enrolled ? <ProgressBar value={course.progress_percent} /> : null}
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="learningPanel">
          <div className="courseHero panel">
            <div className="courseIntro">
              <p className="eyebrow">{selectedCourse?.category ?? "Course"}</p>
              <h2>{selectedCourse?.title ?? "Loading courses..."}</h2>
              <p>{selectedCourse?.description ?? "Đang chuẩn bị dữ liệu khóa học."}</p>
              <div className="heroStats">
                <Metric icon={<Star size={16} />} label="Rating" value={selectedCourse?.rating ?? "-"} />
                <Metric icon={<GraduationCap size={16} />} label="Students" value={compactNumber(selectedCourse?.students_count ?? 0)} />
                <Metric icon={<Clock3 size={16} />} label="Duration" value={`${selectedCourse?.duration_minutes ?? 0}m`} />
                <Metric icon={<Layers3 size={16} />} label="Level" value={selectedCourse?.level ?? "-"} />
              </div>
            </div>
            <div className="enrollBox">
              <strong>{selectedCourse ? formatCurrency(selectedCourse.price) : "$0"}</strong>
              <span>{selectedCourse?.instructor.name}</span>
              <button className="primaryButton" type="button" onClick={handleEnroll} disabled={!isStudent || isBusy || selectedCourse?.enrolled}>
                {busy === "enrolling" ? <Loader2 className="spin" size={18} /> : <GraduationCap size={18} />}
                {selectedCourse?.enrolled ? "Enrolled" : "Enroll"}
              </button>
            </div>
          </div>

          <div className="watchGrid">
            <section className="panel playerPanel">
              <div className="lessonHeader">
                <div>
                  <p className="eyebrow">Now watching</p>
                  <h2>{selectedLesson?.title ?? "Choose a lesson"}</h2>
                </div>
                <button className="secondaryButton fit" type="button" onClick={handleCompleteLesson} disabled={!isStudent || !selectedLesson || isBusy}>
                  {busy === "progress" ? <Loader2 className="spin" size={18} /> : <CheckCircle2 size={18} />}
                  Mark complete
                </button>
              </div>
              {selectedLesson ? (
                <LessonPlayer url={selectedLesson.youtube_url} title={selectedLesson.title} />
              ) : (
                <EmptyState title="No lesson selected" description="Pick a lesson from the curriculum." />
              )}
            </section>

            <aside className="panel curriculumPanel">
              <div className="panelHeader compact">
                <div>
                  <p className="eyebrow">Curriculum</p>
                  <h2>{courseLessons.length} lessons</h2>
                </div>
                {selectedCourse?.enrolled ? <span className="progressBadge">{selectedCourse.progress_percent}%</span> : <Lock size={18} />}
              </div>
              <div className="sectionList">
                {selectedCourse?.sections.map((section) => (
                  <div className="sectionBlock" key={section.id}>
                    <h3>{section.title}</h3>
                    {section.lessons.map((lesson) => (
                      <button
                        className={`lessonItem ${selectedLesson?.id === lesson.id ? "active" : ""}`}
                        type="button"
                        key={lesson.id}
                        onClick={() => setSelectedLesson(lesson)}
                      >
                        <PlayCircle size={17} />
                        <span>{lesson.title}</span>
                        <small>{lesson.duration_minutes}m</small>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <aside className="panel aiPanel">
          <div className="panelHeader compact">
            <div>
              <p className="eyebrow">AI study</p>
              <h2>Lesson companion</h2>
            </div>
            <Brain size={20} />
          </div>

          <div className="aiActions">
            <button className="secondaryButton" type="button" onClick={handleSummary} disabled={!selectedLesson || isBusy}>
              {busy === "summary" ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
              Summary
            </button>
            <button className="secondaryButton" type="button" onClick={() => void handleArtifact("key_concepts")} disabled={!selectedLesson || isBusy}>
              {busy === "concepts" ? <Loader2 className="spin" size={18} /> : <Brain size={18} />}
              Concepts
            </button>
            <button className="secondaryButton" type="button" onClick={() => void handleArtifact("flashcards")} disabled={!selectedLesson || isBusy}>
              {busy === "flashcards" ? <Loader2 className="spin" size={18} /> : <BookOpen size={18} />}
              Flashcards
            </button>
          </div>

          <div className="providerBox">
            <span>AI provider</span>
            <strong>Hugging Face</strong>
          </div>
          <label className="providerBox">
            <span>Transcript priority</span>
            <select value={transcriptPriority} onChange={(event) => setTranscriptPriority(event.target.value as "vi-first" | "en-first")}>
              <option value="vi-first">Vietnamese → English</option>
              <option value="en-first">English → Vietnamese</option>
            </select>
          </label>
          <label className="providerBox">
            <span>Translate subtitles</span>
            <select value={translationTarget} onChange={(event) => setTranslationTarget(event.target.value as Language | "none")}>
              <option value="vi">To Vietnamese</option>
              <option value="en">To English</option>
              <option value="none">Keep original</option>
            </select>
          </label>
          <p className="modelHint">
            Model: {health?.hf_model ?? "Qwen/Qwen2.5-7B-Instruct"} · HF route: {health?.hf_inference_provider ?? "auto"}
          </p>

          <StudyBlock title="Tóm tắt bài học" empty="Nhấn Summary để tạo bản tóm tắt từ transcript.">
            {summary ? <div className="markdownLike">{summary.content}</div> : null}
          </StudyBlock>

          <StudyBlock title="Key concepts" empty="Nhấn Concepts để trích xuất thuật ngữ và ý nghĩa.">
            {concepts ? renderArtifactItems(concepts) : null}
          </StudyBlock>

          <StudyBlock title="Flashcards" empty="Nhấn Flashcards để tạo thẻ ôn tập.">
            {flashcards ? renderArtifactItems(flashcards) : null}
          </StudyBlock>

          {activeUser && activeUser.role !== "student" ? (
            <div className="rolePanel">
              <strong>{activeUser?.role === "admin" ? "Admin console" : "Instructor console"}</strong>
              <p>
                {activeUser?.role === "admin"
                  ? "Admin có thể quản lý marketplace trong các bước mở rộng."
                  : `Bạn đang phụ trách ${activeUserCourses.length} course trong catalog.`}
              </p>
            </div>
          ) : null}

          {studyState ? <span className="tinyNote">Study state loaded for lesson {studyState.lesson_id.slice(0, 8)}.</span> : null}
        </aside>
      </section>
    </main>
  );
}

function StatusPill({
  label,
  icon,
  tone,
}: {
  label: string;
  icon: React.ReactNode;
  tone: "ok" | "warn";
}) {
  return (
    <span className={`statusPill ${tone}`}>
      {icon}
      {label}
    </span>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="metric">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="progressTrack" aria-label={`Progress ${value}%`}>
      <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

function AuthForm({
  authMode,
  setAuthMode,
  authName,
  setAuthName,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authRole,
  setAuthRole,
  busy,
  onSubmit,
}: {
  authMode: "login" | "register";
  setAuthMode: (mode: "login" | "register") => void;
  authName: string;
  setAuthName: (value: string) => void;
  authEmail: string;
  setAuthEmail: (value: string) => void;
  authPassword: string;
  setAuthPassword: (value: string) => void;
  authRole: "student" | "instructor";
  setAuthRole: (value: "student" | "instructor") => void;
  busy: BusyState;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const isRegistering = authMode === "register";

  return (
    <form className="authBox authBoxLarge" onSubmit={onSubmit}>
      <div className="authModeRow">
        <button
          className={authMode === "login" ? "active" : ""}
          type="button"
          onClick={() => setAuthMode("login")}
        >
          <LogIn size={15} />
          Login
        </button>
        <button
          className={authMode === "register" ? "active" : ""}
          type="button"
          onClick={() => setAuthMode("register")}
        >
          <UserPlus size={15} />
          Register
        </button>
      </div>

      <div className="authFields authFieldsLarge">
        {isRegistering ? (
          <input
            value={authName}
            onChange={(event) => setAuthName(event.target.value)}
            placeholder="Full name"
            required
          />
        ) : null}
        <input
          value={authEmail}
          onChange={(event) => setAuthEmail(event.target.value)}
          placeholder="Email"
          type="email"
          required
        />
        <input
          value={authPassword}
          onChange={(event) => setAuthPassword(event.target.value)}
          placeholder="Password"
          type="password"
          minLength={8}
          required
        />
        {isRegistering ? (
          <select
            value={authRole}
            onChange={(event) => setAuthRole(event.target.value as "student" | "instructor")}
            aria-label="Account role"
          >
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
          </select>
        ) : null}
        <button className="primaryButton small" type="submit" disabled={busy === "auth"}>
          {busy === "auth" ? <Loader2 className="spin" size={17} /> : isRegistering ? <UserPlus size={17} /> : <LogIn size={17} />}
          {isRegistering ? "Create account" : "Login"}
        </button>
      </div>
    </form>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="emptyState">
      <p>{title}</p>
      <span>{description}</span>
    </div>
  );
}

function StudyBlock({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <section className="studyBlock">
      <h3>{title}</h3>
      {children ? children : <p className="mutedCopy">{empty}</p>}
    </section>
  );
}

function renderArtifactItems(artifact: StudyArtifactRead) {
  const items = Array.isArray(artifact.content.items) ? artifact.content.items : [];
  if (!items.length) {
    return <pre className="jsonBlock">{JSON.stringify(artifact.content, null, 2)}</pre>;
  }

  return (
    <div className="artifactList">
      {items.slice(0, 12).map((item, index) => {
        const record = item && typeof item === "object" ? (item as Record<string, unknown>) : { value: item };
        const title = String(record.term ?? record.front ?? record.question ?? record.title ?? `Item ${index + 1}`);
        const body = record.explanation ?? record.back ?? record.why_it_matters ?? record.value ?? record.answer;
        return (
          <article className="artifactItem" key={`${artifact.id}-${index}`}>
            <strong>{title}</strong>
            <p>{String(body ?? "")}</p>
          </article>
        );
      })}
    </div>
  );
}

function toErrorMessage(exception: unknown): string {
  return exception instanceof Error ? exception.message : "Unexpected error";
}

function compactNumber(value: number): string {
  return new Intl.NumberFormat("en", { notation: "compact" }).format(value);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en", { style: "currency", currency: "USD" }).format(value);
}
