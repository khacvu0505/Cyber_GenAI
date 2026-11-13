"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Bot, Check, Copy, Download, FileText, RefreshCw, ShieldCheck, Workflow } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { proposalApi } from "@/lib/api";
import { Proposal } from "@/lib/types";
import { StatusBadge } from "./status-badge";

type Tab = "proposal" | "requirements" | "solution" | "risks";

function JsonPanel({ value }: { value: Record<string, unknown> | null }) {
  if (!value) return <EmptyState/>;
  return <pre className="json-panel">{JSON.stringify(value, null, 2)}</pre>;
}

function EmptyState() {
  return <div className="empty-result"><Bot size={28}/><strong>Crew chưa hoàn tất bước này</strong><span>Kết quả sẽ xuất hiện tự động khi workflow hoàn thành.</span></div>;
}

export function ProposalWorkspace({ proposal, onChange }: { proposal: Proposal | null; onChange: (proposal: Proposal) => void }) {
  const [tab, setTab] = useState<Tab>("proposal");
  const [copied, setCopied] = useState(false);
  const refresh = useCallback(async () => { if (proposal) onChange(await proposalApi.get(proposal.id)); }, [proposal, onChange]);

  useEffect(() => {
    if (!proposal || !["queued", "running"].includes(proposal.status)) return;
    const timer = window.setInterval(() => void refresh(), 2500);
    return () => window.clearInterval(timer);
  }, [proposal, refresh]);

  if (!proposal) return <section className="workspace empty-workspace"><div className="crew-orbit"><Bot size={32}/><i/><i/></div><span className="eyebrow">AI PROPOSAL CREW</span><h2>Bốn chuyên gia. Một proposal thống nhất.</h2><p>Tạo cơ hội mới để bắt đầu workflow phân tích yêu cầu, thiết kế giải pháp, rà soát rủi ro và soạn thảo.</p><div className="agent-strip"><span>01 Analyst</span><span>02 Architect</span><span>03 Reviewer</span><span>04 Writer</span></div></section>;

  const retry = async () => onChange(await proposalApi.retry(proposal.id));
  const download = () => {
    if (!proposal.final_markdown) return;
    const url = URL.createObjectURL(new Blob([proposal.final_markdown], { type: "text/markdown" }));
    const link = document.createElement("a"); link.href = url; link.download = `${proposal.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`; link.click(); URL.revokeObjectURL(url);
  };
  const copy = async () => {
    if (!proposal.final_markdown) return;
    await navigator.clipboard.writeText(proposal.final_markdown); setCopied(true); window.setTimeout(() => setCopied(false), 1500);
  };

  return <section className="workspace">
    <header className="workspace-header"><div><div className="title-line"><h2>{proposal.title}</h2><StatusBadge status={proposal.status}/></div><p>{proposal.client_name} · {proposal.current_stage}</p></div><div className="workspace-actions"><button onClick={() => void refresh()} aria-label="Làm mới"><RefreshCw size={16}/></button><button onClick={copy} disabled={!proposal.final_markdown}>{copied ? <Check size={16}/> : <Copy size={16}/>}<span>{copied ? "Đã chép" : "Copy"}</span></button><button onClick={download} disabled={!proposal.final_markdown}><Download size={16}/><span>Tải MD</span></button></div></header>
    {proposal.status === "running" || proposal.status === "queued" ? <div className="running-panel"><div className="running-top"><Workflow size={18}/><div><strong>Multi-agent workflow đang chạy</strong><span>Có thể mất vài phút. Bạn không cần giữ tab này ở foreground.</span></div></div><div className="workflow-steps"><span className="active">Requirements Analyst</span><i/><span>Solution Architect</span><i/><span>Risk Reviewer</span><i/><span>Proposal Writer</span></div></div> : null}
    {proposal.status === "failed" ? <div className="failed-panel"><AlertTriangle size={19}/><div><strong>Crew không hoàn tất</strong><p>{proposal.error_message}</p></div><button onClick={retry}>Chạy lại</button></div> : null}
    <nav className="result-tabs">
      <button className={tab === "proposal" ? "active" : ""} onClick={() => setTab("proposal")}><FileText size={15}/>Proposal</button>
      <button className={tab === "requirements" ? "active" : ""} onClick={() => setTab("requirements")}>Requirements</button>
      <button className={tab === "solution" ? "active" : ""} onClick={() => setTab("solution")}>Solution</button>
      <button className={tab === "risks" ? "active" : ""} onClick={() => setTab("risks")}><ShieldCheck size={15}/>Risks</button>
    </nav>
    <div className="result-body">{tab === "proposal" ? proposal.final_markdown ? <article className="markdown"><ReactMarkdown>{proposal.final_markdown}</ReactMarkdown></article> : <EmptyState/> : null}{tab === "requirements" ? <JsonPanel value={proposal.requirements_analysis}/> : null}{tab === "solution" ? <JsonPanel value={proposal.solution_plan}/> : null}{tab === "risks" ? <JsonPanel value={proposal.risk_review}/> : null}</div>
  </section>;
}
