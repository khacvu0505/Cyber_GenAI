"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bot, FileCheck2, FilePlus2, History, Layers3, LogOut, Sparkles, UserCircle2 } from "lucide-react";
import { AuthScreen } from "@/components/auth-screen";
import { ProposalForm } from "@/components/proposal-form";
import { ProposalWorkspace } from "@/components/proposal-workspace";
import { StatusBadge } from "@/components/status-badge";
import { authApi, proposalApi } from "@/lib/api";
import { clearAccessToken, getAccessToken } from "@/lib/auth";
import { Proposal, ProposalSummary, User } from "@/lib/types";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [proposals, setProposals] = useState<ProposalSummary[]>([]);
  const [selected, setSelected] = useState<Proposal | null>(null);
  const [mode, setMode] = useState<"create" | "workspace">("create");
  const [connected, setConnected] = useState(true);

  const loadList = useCallback(async () => {
    try { setProposals(await proposalApi.list()); setConnected(true); }
    catch { setConnected(false); }
  }, []);
  useEffect(() => {
    if (!getAccessToken()) {
      queueMicrotask(() => setCheckingSession(false));
      return;
    }
    authApi.me()
      .then(async currentUser => {
        setUser(currentUser);
        const items = await proposalApi.list();
        setProposals(items);
        setConnected(true);
      })
      .catch(() => clearAccessToken())
      .finally(() => setCheckingSession(false));
  }, []);

  const openProposal = async (id: string) => {
    try { setSelected(await proposalApi.get(id)); setMode("workspace"); setConnected(true); }
    catch { setConnected(false); }
  };
  const onCreated = (proposal: Proposal) => {
    setSelected(proposal); setMode("workspace"); void loadList();
  };
  const completed = useMemo(() => proposals.filter(item => item.status === "completed").length, [proposals]);

  const logout = () => {
    clearAccessToken();
    setUser(null);
    setProposals([]);
    setSelected(null);
    setMode("create");
  };

  const authenticated = (currentUser: User) => {
    setUser(currentUser);
    void loadList();
  };

  if (checkingSession) return <main className="session-loading"><LoaderMark/></main>;
  if (!user) return <AuthScreen onAuthenticated={authenticated}/>;

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-symbol"><Layers3 size={20}/></div><div><strong>ProposalOps</strong><span>AI DEAL STUDIO</span></div></div>
      <nav><button className={mode === "create" ? "active" : ""} onClick={() => setMode("create")}><FilePlus2 size={17}/>Tạo proposal mới</button><button className={mode === "workspace" ? "active" : ""} onClick={() => setMode("workspace")}><Sparkles size={17}/>Crew workspace</button></nav>
      <div className="history-heading"><span><History size={14}/>Gần đây</span><em>{proposals.length}</em></div>
      <div className="history-list">{proposals.map(item => <button key={item.id} className={selected?.id === item.id ? "selected" : ""} onClick={() => void openProposal(item.id)}><span>{item.title}</span><small>{item.client_name}</small><StatusBadge status={item.status}/></button>)}</div>
      <div className="sidebar-profile"><UserCircle2 size={20}/><div><strong>{user.full_name}</strong><span>{user.email}</span></div><button onClick={logout} aria-label="Đăng xuất" title="Đăng xuất"><LogOut size={17}/></button></div>
      <div className="sidebar-foot"><div className="mini-bot"><Bot size={17}/></div><div><strong>4-agent crew</strong><span>Requirements → Proposal</span></div></div>
    </aside>
    <section className="main-area">
      <header className="topbar"><div><span className="eyebrow">PROPOSAL OPERATIONS</span><h1>{mode === "create" ? "Biến client brief thành proposal thuyết phục." : "Proposal workspace"}</h1></div><div className="top-metrics"><div><FileCheck2 size={17}/><span><strong>{completed}</strong> hoàn tất</span></div><div className={connected ? "connection online" : "connection"}><i/>{connected ? "API connected" : "Backend offline"}</div></div></header>
      {!connected && <div className="offline-banner">Không kết nối được backend. Hãy kiểm tra FastAPI tại cổng 8000.</div>}
      {mode === "create" ? <div className="create-layout"><ProposalForm onCreated={onCreated}/><ProposalWorkspace proposal={selected} onChange={proposal => { setSelected(proposal); void loadList(); }}/></div> : <ProposalWorkspace proposal={selected} onChange={proposal => { setSelected(proposal); void loadList(); }}/>} 
    </section>
  </main>;
}

function LoaderMark() {
  return <div className="loader-mark"><Layers3 size={28}/><span>Đang tải workspace…</span></div>;
}
