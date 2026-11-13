"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api";

export default function LoginPage() {
  const [email, setEmail] = useState("lan.procurement@acme.example");
  const [password, setPassword] = useState("demo-password");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const data = await response.json();
    if (!response.ok) return setError(data.detail || "Đăng nhập thất bại");
    localStorage.setItem("procurement_token", data.token);
    localStorage.setItem("procurement_user", JSON.stringify(data.user));
    location.assign("/dashboard");
  }

  return <main className="auth"><aside><b>PROCUREMENT COMPLIANCE</b><h1>Procure with confidence.</h1><p>Policy search, supplier compliance và approval workflow cho doanh nghiệp.</p></aside><section><div><b>SECURE WORKSPACE</b><h2>Đăng nhập</h2><p>Truy cập workspace của công ty bạn.</p><form onSubmit={submit}><label>Email công ty<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Mật khẩu<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{error && <em>{error}</em>}<button>Đăng nhập</button></form><small>Chưa có workspace? <Link href="/register">Đăng ký tổ chức</Link></small><small>Demo: lan.procurement@acme.example / demo-password</small></div></section></main>;
}
