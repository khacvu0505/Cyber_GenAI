"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api";

export default function RegisterPage() {
  const [form, setForm] = useState({ organization_name: "", name: "", email: "", password: "" });
  const [error, setError] = useState("");

  function change(field: keyof typeof form) {
    return (event: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [field]: event.target.value });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch(`${API}/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json();
    if (!response.ok) return setError(data.detail || "Đăng ký thất bại");
    localStorage.setItem("procurement_token", data.token);
    localStorage.setItem("procurement_user", JSON.stringify(data.user));
    location.assign("/dashboard");
  }

  return <main className="auth"><aside><b>PROCUREMENT COMPLIANCE</b><h1>Tạo procurement workspace.</h1><p>Thiết lập tổ chức và bắt đầu chuẩn hóa kiểm soát chi tiêu.</p></aside><section><div><b>NEW ORGANIZATION</b><h2>Đăng ký</h2><p>Tài khoản đầu tiên sẽ là workspace owner.</p><form onSubmit={submit}><label>Tên công ty<input value={form.organization_name} onChange={change("organization_name")} required /></label><label>Họ và tên<input value={form.name} onChange={change("name")} required /></label><label>Email công ty<input type="email" value={form.email} onChange={change("email")} required /></label><label>Mật khẩu<input type="password" minLength={8} value={form.password} onChange={change("password")} required /></label>{error && <em>{error}</em>}<button>Tạo workspace</button></form><small>Đã có tài khoản? <Link href="/login">Đăng nhập</Link></small></div></section></main>;
}
