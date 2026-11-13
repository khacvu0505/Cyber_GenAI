import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API = "http://localhost:8000";
type User = { user_id: string; display_name: string; tenant_id: string; department: string; roles: string[] };
type Candidate = { document_id: string; title: string; score: number; decision: "allowed" | "denied"; reason: string; classification: string; department: string; excerpt?: string };
type Result = { answer: string; sources: string[]; candidates: Candidate[]; audit_event: { timestamp: string; allowed_document_ids: string[]; denied_document_ids: string[] } };

function App() {
  const [users, setUsers] = useState<User[]>([]); const [userId, setUserId] = useState("");
  const [token, setToken] = useState(""); const [active, setActive] = useState<User | null>(null);
  const [question, setQuestion] = useState("Ngân sách thưởng Finance năm 2026 là bao nhiêu?"); const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => { fetch(`${API}/users`).then(r => r.json()).then((data: User[]) => { setUsers(data); setUserId(data[0]?.user_id ?? ""); }); }, []);
  async function login() { const r = await fetch(`${API}/auth/demo-login`, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({user_id:userId})}); const data = await r.json(); setToken(data.token); setActive(data.user); setResult(null); }
  async function ask() { if (!token) return; setLoading(true); const r = await fetch(`${API}/ask`, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({token, question})}); setResult(await r.json()); setLoading(false); }
  return <main><header><p className="eyebrow">RAG SECURITY LAB</p><h1>Access Control Lens</h1><p>Visualize what retrieval is allowed to reach the model.</p></header>
    <section className="panel identity"><h2>1. Demo identity</h2><select value={userId} onChange={e => setUserId(e.target.value)}>{users.map(u => <option key={u.user_id} value={u.user_id}>{u.display_name} — {u.tenant_id}</option>)}</select><button onClick={login}>Sign in as demo user</button>{active && <div className="chips"><span>{active.tenant_id}</span><span>{active.department}</span>{active.roles.map(role => <span key={role}>{role}</span>)}</div>}</section>
    <section className="panel"><h2>2. Ask the secure RAG</h2><textarea value={question} onChange={e => setQuestion(e.target.value)} /><button disabled={!token || loading} onClick={ask}>{loading ? "Checking policy…" : "Retrieve safely"}</button></section>
    {result && <><section className="panel answer"><h2>3. Answer from permitted context</h2><p>{result.answer}</p><small>Sources: {result.sources.join(", ") || "none"}</small></section><section className="panel"><h2>4. Retrieval decision map</h2><div className="grid">{result.candidates.map(c => <article className={c.decision} key={c.document_id}><b>{c.decision === "allowed" ? "ALLOWED" : "DENIED"}</b><h3>{c.title}</h3><p>{c.classification} · {c.department} · score {c.score}</p><code>{c.reason}</code>{c.excerpt && <p className="excerpt">{c.excerpt}</p>}</article>)}</div></section><section className="panel"><h2>5. Audit event</h2><p>{new Date(result.audit_event.timestamp).toLocaleString()} · allowed: {result.audit_event.allowed_document_ids.join(", ") || "none"} · denied: {result.audit_event.denied_document_ids.join(", ") || "none"}</p></section></>}
  </main>;
}
createRoot(document.getElementById("root")!).render(<App />);
