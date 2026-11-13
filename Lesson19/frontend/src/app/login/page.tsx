"use client";

import { ArrowRight, FileArchive, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const demoAccounts = [
  { label: "Tài chính", email: "finance@documind.vn" },
  { label: "Nhân sự", email: "hr@documind.vn" },
  { label: "Pháp lý", email: "legal@documind.vn" },
];

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState("finance@documind.vn");
  const [password, setPassword] = useState("ChangeMe123!");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login(email, password);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Không thể kết nối máy chủ.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-story">
        <div className="login-brand">
          <div className="brand-mark light"><FileArchive size={22} /></div>
          <div><strong>DocuMind</strong><span>Enterprise</span></div>
        </div>
        <div className="story-copy">
          <span className="eyebrow light"><Sparkles size={15} /> Kho tri thức có kiểm soát</span>
          <h1>Công văn rõ ràng.<br />Tri thức trong tầm tay.</h1>
          <p>
            Tập trung tài liệu nội bộ, bảo toàn quyền truy cập phòng ban và tìm câu trả lời
            có dẫn nguồn trong vài giây.
          </p>
          <div className="story-points">
            <div><ShieldCheck size={19} /><span>Phân quyền Tài chính, Nhân sự và Pháp lý</span></div>
            <div><LockKeyhole size={19} /><span>File gốc trên S3, dữ liệu tìm kiếm trong pgvector</span></div>
          </div>
        </div>
        <div className="story-quote">
          <span>“</span>
          <p>Mỗi câu trả lời đều quay về đúng tài liệu, đúng trang và đúng người được phép xem.</p>
        </div>
      </section>

      <section className="login-panel">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-heading">
            <span className="eyebrow">Cổng nội bộ</span>
            <h2>Chào mừng trở lại</h2>
            <p>Đăng nhập bằng tài khoản phòng ban của bạn.</p>
          </div>

          <label>
            Email công việc
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label>
            Mật khẩu
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error && <div className="form-error">{error}</div>}

          <button className="primary-button full" type="submit" disabled={submitting}>
            {submitting ? "Đang đăng nhập…" : "Vào không gian làm việc"}
            {!submitting && <ArrowRight size={18} />}
          </button>

          <div className="demo-divider"><span>Tài khoản dùng thử</span></div>
          <div className="demo-accounts">
            {demoAccounts.map((account) => (
              <button key={account.email} type="button" onClick={() => setEmail(account.email)}>
                <span>{account.label.charAt(0)}</span>{account.label}
              </button>
            ))}
          </div>
          <p className="demo-password">Mật khẩu demo: <code>ChangeMe123!</code></p>
        </form>
      </section>
    </main>
  );
}
