"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Building2, LoaderCircle, Sparkles } from "lucide-react";
import { proposalApi } from "@/lib/api";
import { Proposal, ProposalInput } from "@/lib/types";

const initial: ProposalInput = {
  title: "",
  client_name: "",
  company_name: "",
  client_brief: "",
  service_description: "",
  budget: "",
  timeline: "",
  constraints: "",
  language: "Tiếng Việt",
  auto_run: true,
};

export function ProposalForm({ onCreated }: { onCreated: (proposal: Proposal) => void }) {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const update = <Key extends keyof ProposalInput>(key: Key, value: ProposalInput[Key]) =>
    setForm(current => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true); setError("");
    try {
      const proposal = await proposalApi.create(form);
      onCreated(proposal);
      setForm(initial);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể tạo proposal.");
    } finally { setLoading(false); }
  };

  return (
    <form className="proposal-form" onSubmit={submit}>
      <div className="form-heading">
        <div className="form-icon"><Building2 size={18}/></div>
        <div><h2>Cơ hội mới</h2><p>Cung cấp context thật để Crew làm việc chính xác.</p></div>
      </div>
      <div className="field-grid">
        <label className="full"><span>Tên proposal</span><input value={form.title} onChange={e => update("title", e.target.value)} placeholder="CRM Transformation 2026" minLength={3} required/></label>
        <label><span>Khách hàng</span><input value={form.client_name} onChange={e => update("client_name", e.target.value)} placeholder="Acme Retail" required/></label>
        <label><span>Công ty của bạn</span><input value={form.company_name} onChange={e => update("company_name", e.target.value)} placeholder="Nova Consulting" required/></label>
        <label className="full"><span>Client brief</span><textarea value={form.client_brief} onChange={e => update("client_brief", e.target.value)} placeholder="Mục tiêu, pain points, yêu cầu bắt buộc và tiêu chí thành công..." rows={5} minLength={30} required/></label>
        <label className="full"><span>Năng lực & dịch vụ cung cấp</span><textarea value={form.service_description} onChange={e => update("service_description", e.target.value)} placeholder="Những gì đội ngũ có thể triển khai, phạm vi năng lực và điểm khác biệt..." rows={4} minLength={20} required/></label>
        <label><span>Ngân sách</span><input value={form.budget} onChange={e => update("budget", e.target.value)} placeholder="500–700 triệu VNĐ"/></label>
        <label><span>Timeline</span><input value={form.timeline} onChange={e => update("timeline", e.target.value)} placeholder="12–16 tuần"/></label>
        <label className="full"><span>Ràng buộc</span><textarea value={form.constraints} onChange={e => update("constraints", e.target.value)} placeholder="Bảo mật, công nghệ bắt buộc, phạm vi loại trừ..." rows={3}/></label>
        <label className="full"><span>Ngôn ngữ</span><select value={form.language} onChange={e => update("language", e.target.value as ProposalInput["language"])}><option>Tiếng Việt</option><option>English</option></select></label>
      </div>
      {error && <p className="form-error">{error}</p>}
      <button className="primary-action" disabled={loading}>{loading ? <LoaderCircle className="spin" size={17}/> : <Sparkles size={17}/>}Khởi chạy Proposal Crew<ArrowRight size={16}/></button>
    </form>
  );
}
