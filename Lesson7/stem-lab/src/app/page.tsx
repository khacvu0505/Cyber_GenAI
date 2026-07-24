"use client";

import {
  Atom,
  Beaker,
  BookOpenCheck,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleAlert,
  FlaskConical,
  Gauge,
  GraduationCap,
  Lightbulb,
  LoaderCircle,
  LogOut,
  Menu,
  Microscope,
  Orbit,
  PencilLine,
  RefreshCcw,
  Send,
  Sigma,
  Sparkles,
  Target,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  getDashboard,
  getHealth,
  getProblems,
  login,
  logout,
  reasonAboutProblem,
  refreshSession,
  register,
} from "@/lib/api";
import type {
  DashboardRead,
  HealthRead,
  ProblemRead,
  ReasoningMode,
  ReasoningResponse,
  Subject,
  UserRead,
} from "@/types/api";

const subjectMeta: Record<Subject, { label: string; short: string; icon: typeof Sigma }> = {
  math: { label: "Toán học", short: "Toán", icon: Sigma },
  physics: { label: "Vật lý", short: "Lý", icon: Orbit },
  chemistry: { label: "Hóa học", short: "Hóa", icon: FlaskConical },
};

const modes: Array<{
  id: ReasoningMode;
  title: string;
  description: string;
  icon: typeof Zap;
}> = [
  {
    id: "direct",
    title: "Nhanh",
    description: "Một lời giải ngắn",
    icon: Zap,
  },
  {
    id: "guided",
    title: "Có hướng dẫn",
    description: "Checkpoint từng bước",
    icon: Lightbulb,
  },
  {
    id: "self_consistency",
    title: "Kiểm chứng sâu",
    description: "Nhiều lời giải độc lập",
    icon: BrainCircuit,
  },
];

export default function Home() {
  const [health, setHealth] = useState<HealthRead | null>(null);
  const [problems, setProblems] = useState<ProblemRead[]>([]);
  const [subject, setSubject] = useState<Subject>("math");
  const [selectedId, setSelectedId] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const [customProblem, setCustomProblem] = useState("");
  const [studentAnswer, setStudentAnswer] = useState("");
  const [mode, setMode] = useState<ReasoningMode>("guided");
  const [samples, setSamples] = useState(5);
  const [result, setResult] = useState<ReasoningResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [user, setUser] = useState<UserRead | null>(null);
  const [dashboard, setDashboard] = useState<DashboardRead | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authGrade, setAuthGrade] = useState(10);

  useEffect(() => {
    void bootstrap();
  }, []);

  const filteredProblems = useMemo(
    () => problems.filter((problem) => problem.subject === subject),
    [problems, subject],
  );

  const selectedProblem = useMemo(
    () => problems.find((problem) => problem.id === selectedId) ?? filteredProblems[0] ?? null,
    [filteredProblems, problems, selectedId],
  );

  async function bootstrap() {
    setLoading(true);
    setError(null);
    try {
      const nextHealth = await getHealth();
      setHealth(nextHealth);
      let session;
      try {
        session = await refreshSession();
      } catch {
        return;
      }
      setUser(session.user);
      const [nextProblems, nextDashboard] = await Promise.all([getProblems(), getDashboard()]);
      setProblems(nextProblems);
      setDashboard(nextDashboard);
      const firstMath = nextProblems.find((problem) => problem.subject === "math");
      if (firstMath) setSelectedId(firstMath.id);
    } catch (exception) {
      setError(toError(exception));
    } finally {
      setLoading(false);
    }
  }

  async function handleAuth(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const session = authMode === "login"
        ? await login(authEmail, authPassword)
        : await register({
            email: authEmail,
            name: authName,
            password: authPassword,
            role: "student",
            grade: authGrade,
          });
      setUser(session.user);
      const [nextProblems, nextDashboard] = await Promise.all([getProblems(), getDashboard()]);
      setProblems(nextProblems);
      setDashboard(nextDashboard);
      const firstMath = nextProblems.find((problem) => problem.subject === "math");
      if (firstMath) setSelectedId(firstMath.id);
    } catch (exception) {
      setError(toError(exception));
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
    } finally {
      setUser(null);
      setDashboard(null);
      setProblems([]);
      setResult(null);
    }
  }

  function selectSubject(nextSubject: Subject) {
    setSubject(nextSubject);
    const first = problems.find((problem) => problem.subject === nextSubject);
    setSelectedId(first?.id ?? "");
    setCustomMode(false);
    setResult(null);
    setStudentAnswer("");
    setMobileNav(false);
  }

  function selectProblem(problem: ProblemRead) {
    setSubject(problem.subject);
    setSelectedId(problem.id);
    setCustomMode(false);
    setResult(null);
    setStudentAnswer("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const problemText = customMode ? customProblem.trim() : selectedProblem?.prompt ?? "";
    if (!problemText) {
      setError("Hãy chọn hoặc nhập một đề bài.");
      return;
    }

    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const response = await reasonAboutProblem({
        problem_id: customMode ? undefined : selectedProblem?.id,
        problem: problemText,
        subject,
        grade: selectedProblem?.grade ?? 10,
        difficulty: selectedProblem?.difficulty ?? "intermediate",
        mode,
        student_answer: studentAnswer.trim() || undefined,
        samples: mode === "self_consistency" ? samples : undefined,
      });
      setResult(response);
      setDashboard(await getDashboard());
    } catch (exception) {
      setError(toError(exception));
    } finally {
      setBusy(false);
    }
  }

  const SubjectIcon = subjectMeta[subject].icon;
  const modelReady = health?.model_ready ?? false;
  const masteryScore = Math.round(dashboard?.mastery_score ?? 0);
  const initials = user?.name.split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase() || "ST";

  if (loading) {
    return <div className="authShell"><LoaderCircle className="spin" size={30} /><span>Đang khởi động STEM Reasoning Lab…</span></div>;
  }

  if (!user) {
    return (
      <main className="authShell">
        <section className="authCard">
          <div className="authBrand"><Atom size={26} /><span>STEM Reasoning Lab</span></div>
          <span className="eyebrow">AI STEM COACH</span>
          <h1>{authMode === "login" ? "Tiếp tục hành trình học" : "Tạo hồ sơ học tập"}</h1>
          <p>Kết quả, chuỗi ngày học và mức thành thạo của em sẽ được lưu an toàn.</p>
          {error ? <div className="errorBanner"><CircleAlert size={18} /><span>{error}</span></div> : null}
          <form className="authForm" onSubmit={handleAuth}>
            {authMode === "register" ? (
              <>
                <label>Họ và tên<input value={authName} onChange={(event) => setAuthName(event.target.value)} required minLength={2} /></label>
                <label>Khối lớp
                  <select value={authGrade} onChange={(event) => setAuthGrade(Number(event.target.value))}>
                    {[6, 7, 8, 9, 10, 11, 12].map((grade) => <option key={grade} value={grade}>Lớp {grade}</option>)}
                  </select>
                </label>
              </>
            ) : null}
            <label>Email<input type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} required autoComplete="email" /></label>
            <label>Mật khẩu<input type="password" value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} required minLength={8} autoComplete={authMode === "login" ? "current-password" : "new-password"} /></label>
            <button className="reasonButton" type="submit" disabled={busy}>
              {busy ? <LoaderCircle className="spin" size={20} /> : <GraduationCap size={20} />}
              {authMode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
            </button>
          </form>
          <button className="authSwitch" type="button" onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setError(null); }}>
            {authMode === "login" ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}
          </button>
        </section>
      </main>
    );
  }

  return (
    <div className="appShell">
      <aside className={`sideRail ${mobileNav ? "sideRailOpen" : ""}`}>
        <div className="brandBlock">
          <div className="brandMark">
            <Atom size={25} />
          </div>
          <div>
            <strong>Reasoning Lab</strong>
            <span>STEM learning system</span>
          </div>
          <button className="mobileClose" type="button" onClick={() => setMobileNav(false)} aria-label="Đóng menu">
            <X size={20} />
          </button>
        </div>

        <nav className="sideNav" aria-label="Điều hướng chính">
          <button className="navItem navItemActive" type="button">
            <Microscope size={19} />
            Phòng học AI
          </button>
          <button className="navItem" type="button">
            <Target size={19} />
            Lộ trình của tôi
          </button>
          <button className="navItem" type="button">
            <BookOpenCheck size={19} />
            Sổ tay kiến thức
          </button>
          <button className="navItem" type="button">
            <Trophy size={19} />
            Thành tích
          </button>
        </nav>

        <div className="railSection">
          <span className="railLabel">Môn học</span>
          {(Object.keys(subjectMeta) as Subject[]).map((item) => {
            const meta = subjectMeta[item];
            const Icon = meta.icon;
            return (
              <button
                key={item}
                className={`subjectNav ${subject === item ? "subjectNavActive" : ""}`}
                type="button"
                onClick={() => selectSubject(item)}
              >
                <span className={`subjectDot subjectDot-${item}`}>
                  <Icon size={16} />
                </span>
                {meta.label}
                <ChevronRight size={15} />
              </button>
            );
          })}
        </div>

        <div className="masteryCard">
          <div className="masteryTop">
            <Gauge size={18} />
            <span>Tuần này</span>
            <strong>{masteryScore}%</strong>
          </div>
          <div className="progressTrack">
            <span style={{ width: `${masteryScore}%` }} />
          </div>
          <p>{dashboard?.verified_attempts ?? 0}/{dashboard?.total_attempts ?? 0} lượt đã kiểm chứng</p>
        </div>

        <div className="studentCard">
          <div className="avatar">{initials}</div>
          <div>
            <strong>{user.name}</strong>
            <span>{user.role === "student" ? "Học sinh" : "Giáo viên"}{user.grade ? ` · Lớp ${user.grade}` : ""}</span>
          </div>
          <button className="logoutButton" type="button" onClick={() => void handleLogout()} aria-label="Đăng xuất"><LogOut size={17} /></button>
        </div>
      </aside>

      {mobileNav ? <button className="navScrim" type="button" onClick={() => setMobileNav(false)} aria-label="Đóng menu" /> : null}

      <main className="mainCanvas">
        <header className="topBar">
          <button className="mobileMenu" type="button" onClick={() => setMobileNav(true)} aria-label="Mở menu">
            <Menu size={22} />
          </button>
          <div className="crumb">
            <span>Phòng học AI</span>
            <ChevronRight size={14} />
            <strong>{subjectMeta[subject].label}</strong>
          </div>
          <div className="topActions">
            <div className={`modelStatus ${modelReady ? "modelStatusReady" : ""}`}>
              <span />
              {health ? (modelReady ? "Hugging Face sẵn sàng" : "Cần HF token") : "Backend offline"}
            </div>
            <div className="streak">
              <Sparkles size={16} />
              {dashboard?.current_streak ?? 0} ngày
            </div>
          </div>
        </header>

        <div className="contentWrap">
          <section className="heroStrip">
            <div>
              <span className="eyebrow">AI STEM COACH</span>
              <h1>Đừng chỉ tìm đáp án.<br />Hãy hiểu vì sao.</h1>
              <p>
                Tự giải trước, nhận gợi ý đúng lúc và để AI kiểm chứng từng bước suy luận.
              </p>
            </div>
            <div className="heroOrbit" aria-hidden="true">
              <div className="orbitRing orbitRingOne" />
              <div className="orbitRing orbitRingTwo" />
              <div className="orbitCore">
                <SubjectIcon size={32} />
              </div>
              <span className="particle particleOne" />
              <span className="particle particleTwo" />
              <span className="particle particleThree" />
            </div>
          </section>

          {error ? (
            <div className="errorBanner" role="alert">
              <CircleAlert size={19} />
              <span>{error}</span>
              <button type="button" onClick={() => setError(null)} aria-label="Đóng thông báo">
                <X size={17} />
              </button>
            </div>
          ) : null}

          <div className="workspaceGrid">
            <section className="problemColumn">
              <div className="sectionHeading">
                <div>
                  <span className="sectionKicker">Bước 1</span>
                  <h2>Chọn thử thách</h2>
                </div>
                <button
                  className={`customToggle ${customMode ? "customToggleActive" : ""}`}
                  type="button"
                  onClick={() => {
                    setCustomMode((value) => !value);
                    setResult(null);
                  }}
                >
                  <PencilLine size={16} />
                  {customMode ? "Dùng bài có sẵn" : "Nhập đề riêng"}
                </button>
              </div>

              {loading ? (
                <div className="loadingCard">
                  <LoaderCircle className="spin" size={24} />
                  Đang tải phòng học…
                </div>
              ) : customMode ? (
                <div className="customProblemCard">
                  <label htmlFor="custom-problem">Đề bài của em</label>
                  <textarea
                    id="custom-problem"
                    value={customProblem}
                    onChange={(event) => setCustomProblem(event.target.value)}
                    placeholder="Ví dụ: Một vật được ném thẳng đứng với vận tốc ban đầu…"
                    rows={7}
                  />
                  <span>Bài tự nhập được kiểm tra bằng self-consistency, chưa có đáp án chuẩn.</span>
                </div>
              ) : (
                <div className="challengeList">
                  {filteredProblems.map((problem, index) => (
                    <button
                      className={`challengeCard ${selectedProblem?.id === problem.id ? "challengeCardActive" : ""}`}
                      key={problem.id}
                      type="button"
                      onClick={() => selectProblem(problem)}
                    >
                      <span className="challengeIndex">{String(index + 1).padStart(2, "0")}</span>
                      <span className="challengeBody">
                        <span className="challengeMeta">
                          {problem.topic} · Lớp {problem.grade} · {difficultyLabel(problem.difficulty)}
                        </span>
                        <strong>{problem.title}</strong>
                        <span>{problem.prompt}</span>
                        <span className="skillRow">
                          {problem.skills.slice(0, 3).map((skill) => <em key={skill}>{skill}</em>)}
                        </span>
                      </span>
                      <span className="timeBadge">{problem.estimated_minutes} phút</span>
                    </button>
                  ))}
                </div>
              )}

              <form className="answerPanel" onSubmit={handleSubmit}>
                <div className="sectionHeading compactHeading">
                  <div>
                    <span className="sectionKicker">Bước 2</span>
                    <h2>Trình bày cách làm</h2>
                  </div>
                  <span className="optionalLabel">Không bắt buộc</span>
                </div>
                <textarea
                  value={studentAnswer}
                  onChange={(event) => setStudentAnswer(event.target.value)}
                  placeholder="Viết đáp án hoặc các bước em đã thử. AI sẽ tìm đúng điểm em đang vướng…"
                  rows={5}
                />

                <div className="modeHeader">
                  <span>Chế độ suy luận</span>
                  {mode === "self_consistency" ? (
                    <label>
                      {samples} mẫu
                      <input
                        type="range"
                        min={3}
                        max={9}
                        step={2}
                        value={samples}
                        onChange={(event) => setSamples(Number(event.target.value))}
                      />
                    </label>
                  ) : null}
                </div>
                <div className="modeGrid">
                  {modes.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        className={`modeCard ${mode === item.id ? "modeCardActive" : ""}`}
                        type="button"
                        key={item.id}
                        onClick={() => setMode(item.id)}
                      >
                        <Icon size={19} />
                        <span>
                          <strong>{item.title}</strong>
                          <small>{item.description}</small>
                        </span>
                        {mode === item.id ? <Check size={15} /> : null}
                      </button>
                    );
                  })}
                </div>

                <button className="reasonButton" type="submit" disabled={busy || loading || !health}>
                  {busy ? <LoaderCircle className="spin" size={20} /> : <BrainCircuit size={20} />}
                  {busy ? "AI đang đối chiếu các hướng giải…" : "Phân tích bài làm"}
                  {!busy ? <Send size={17} /> : null}
                </button>
              </form>
            </section>

            <aside className="labColumn">
              <div className="labHeader">
                <div>
                  <span className="sectionKicker">Bước 3</span>
                  <h2>Kết quả phòng lab</h2>
                </div>
                {result ? (
                  <button type="button" onClick={() => setResult(null)} aria-label="Làm lại">
                    <RefreshCcw size={17} />
                  </button>
                ) : null}
              </div>

              {!result ? (
                <div className="emptyLab">
                  <div className="emptyLabIcon">
                    <Beaker size={34} />
                    <span />
                  </div>
                  <strong>Chưa có phân tích</strong>
                  <p>Chọn bài, thử giải và để AI kiểm tra reasoning của em.</p>
                  <div className="labPromise">
                    <span><Check size={14} /> Gợi ý tăng dần</span>
                    <span><Check size={14} /> Kiểm chứng đáp án</span>
                    <span><Check size={14} /> Chẩn đoán lỗi tư duy</span>
                  </div>
                </div>
              ) : (
                <ResultPanel
                  result={result}
                  onFollowUp={(question) => {
                    setCustomMode(true);
                    setCustomProblem(question);
                    setStudentAnswer("");
                    setResult(null);
                    window.scrollTo({ top: 240, behavior: "smooth" });
                  }}
                />
              )}
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

function ResultPanel({
  result,
  onFollowUp,
}: {
  result: ReasoningResponse;
  onFollowUp: (question: string) => void;
}) {
  const confidence = Math.round(result.confidence * 100);
  const verified = result.verification.passed === true;

  return (
    <div className="resultStack">
      <div className={`verificationCard ${verified ? "verificationPassed" : "verificationCaution"}`}>
        <div className="verificationIcon">
          {verified ? <Check size={22} /> : <CircleAlert size={22} />}
        </div>
        <div>
          <span>{verified ? "ĐÃ KIỂM CHỨNG" : "CẦN ĐỐI CHIẾU"}</span>
          <strong>{result.final_answer}</strong>
          <p>{result.verification.message}</p>
        </div>
        <div className="confidenceRing" style={{ "--confidence": `${confidence * 3.6}deg` } as React.CSSProperties}>
          <span>{confidence}%</span>
        </div>
      </div>

      <div className="conceptBlock">
        <span className="resultLabel">Khái niệm trọng tâm</span>
        <div className="conceptChips">
          {result.concepts.map((concept) => <span key={concept}>{concept}</span>)}
        </div>
      </div>

      {result.hints.length ? (
        <div className="hintsBlock">
          <span className="resultLabel">Gợi ý mở dần</span>
          {result.hints.map((hint, index) => (
            <details key={`${hint}-${index}`}>
              <summary>
                <span>{index + 1}</span>
                Mở gợi ý {index + 1}
              </summary>
              <p>{hint}</p>
            </details>
          ))}
        </div>
      ) : null}

      <div className="stepsBlock">
        <span className="resultLabel">Lộ trình lời giải</span>
        <div className="timeline">
          {result.solution_steps.map((step, index) => (
            <article key={`${step.title}-${index}`} className="stepCard">
              <span className="stepNumber">{index + 1}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.explanation}</p>
                <span className="checkpoint">
                  <Lightbulb size={14} />
                  {step.checkpoint}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="feedbackCard">
        <GraduationCap size={20} />
        <div>
          <span className="resultLabel">Phản hồi cho em</span>
          <p>{result.student_feedback}</p>
        </div>
      </div>

      {result.misconception ? (
        <div className="misconceptionCard">
          <CircleAlert size={19} />
          <div>
            <span className="resultLabel">Điểm dễ nhầm</span>
            <p>{result.misconception}</p>
          </div>
        </div>
      ) : null}

      {result.candidates.length > 1 ? (
        <div className="consensusCard">
          <div className="consensusHeading">
            <BrainCircuit size={18} />
            <span>Self-consistency · {result.candidates.length} mẫu</span>
          </div>
          <div className="candidateList">
            {result.candidates.map((candidate, index) => (
              <span key={`${candidate.answer}-${index}`} className={candidate.verified ? "candidateVerified" : ""}>
                #{index + 1} {candidate.answer}
                {candidate.verified ? <Check size={12} /> : null}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="followUpBlock">
        <span className="resultLabel">Thử thách tiếp theo</span>
        {result.follow_up_questions.map((question, index) => (
          <button type="button" key={`${question}-${index}`} onClick={() => onFollowUp(question)}>
            <span>{index + 1}</span>
            {question}
            <ChevronRight size={15} />
          </button>
        ))}
      </div>
    </div>
  );
}

function difficultyLabel(value: ProblemRead["difficulty"]): string {
  return {
    foundation: "Nền tảng",
    intermediate: "Vận dụng",
    advanced: "Nâng cao",
  }[value];
}

function toError(exception: unknown): string {
  return exception instanceof Error ? exception.message : "Đã xảy ra lỗi không xác định.";
}
