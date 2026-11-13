"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Layers3, LoaderCircle, LockKeyhole, Sparkles } from "lucide-react";
import { authApi } from "@/lib/api";
import { saveAccessToken } from "@/lib/auth";
import { User } from "@/lib/types";

type Mode = "login" | "register";

export function AuthScreen({ onAuthenticated }: { onAuthenticated: (user: User) => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = mode === "login"
        ? await authApi.login({ email, password })
        : await authApi.register({ full_name: fullName, email, password });
      saveAccessToken(result.access_token);
      onAuthenticated(result.user);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể xác thực tài khoản.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setError("");
  };

  return <main className="auth-shell">
    <section className="auth-story">
      <div className="auth-brand"><span><Layers3 size={25}/></span><strong>ProposalOps</strong></div>
      <div className="auth-story-copy">
        <span className="auth-kicker"><Sparkles size={16}/> AI PROPOSAL CREW</span>
        <h1>Proposal tốt bắt đầu từ một đội ngũ hiểu đúng vấn đề.</h1>
        <p>Bốn AI agents phối hợp để phân tích brief, thiết kế giải pháp, rà soát rủi ro và viết proposal B2B hoàn chỉnh.</p>
      </div>
      <div className="auth-agents"><span>01 Requirements</span><span>02 Solution</span><span>03 Risk</span><span>04 Writer</span></div>
    </section>
    <section className="auth-panel">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-icon"><LockKeyhole size={24}/></div>
        <h2>{mode === "login" ? "Chào mừng trở lại" : "Tạo tài khoản mới"}</h2>
        <p className="auth-intro">{mode === "login" ? "Đăng nhập để tiếp tục quản lý proposal của bạn." : "Bắt đầu xây dựng proposal cùng AI Crew."}</p>
        <div className="auth-tabs">
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => switchMode("login")}>Đăng nhập</button>
          <button type="button" className={mode === "register" ? "active" : ""} onClick={() => switchMode("register")}>Đăng ký</button>
        </div>
        <div className="auth-fields">
          {mode === "register" && <label><span>Họ và tên</span><input value={fullName} onChange={event => setFullName(event.target.value)} placeholder="Nguyễn Minh Anh" minLength={2} required/></label>}
          <label><span>Email</span><input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@company.com" autoComplete="email" required/></label>
          <label><span>Mật khẩu</span><input type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Tối thiểu 8 ký tự" minLength={mode === "register" ? 8 : 1} maxLength={72} autoComplete={mode === "login" ? "current-password" : "new-password"} required/></label>
        </div>
        {error && <p className="auth-error">{error}</p>}
        <button className="auth-submit" disabled={loading}>{loading ? <LoaderCircle className="spin" size={20}/> : null}{mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}<ArrowRight size={19}/></button>
      </form>
    </section>
  </main>;
}
