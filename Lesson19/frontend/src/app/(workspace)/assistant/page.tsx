"use client";

import {
  ArrowUp,
  BotMessageSquare,
  FileSearch,
  FileText,
  Quote,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { FormEvent, useRef, useState } from "react";

import { ApiError, apiFetch } from "@/lib/api";
import type { ChatAnswer, Citation } from "@/lib/types";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
};

const suggestions = [
  "Quy trình phê duyệt một công văn đến gồm những bước nào?",
  "Tóm tắt các chính sách nhân sự mới nhất trong tài liệu của tôi.",
  "Tìm các điều khoản về thời hạn thanh toán trong hợp đồng.",
];

export default function AssistantPage() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const ask = async (event?: FormEvent) => {
    event?.preventDefault();
    const value = question.trim();
    if (!value || submitting) return;
    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: value };
    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setSubmitting(true);
    try {
      const result = await apiFetch<ChatAnswer>("/chat/ask", {
        method: "POST",
        body: JSON.stringify({ question: value, session_id: sessionId }),
      });
      setSessionId(result.session_id);
      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.answer,
        citations: result.citations,
      }]);
    } catch (caught) {
      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: caught instanceof ApiError ? caught.message : "Không thể kết nối trợ lý lúc này.",
      }]);
    } finally {
      setSubmitting(false);
      inputRef.current?.focus();
    }
  };

  const chooseSuggestion = (value: string) => {
    setQuestion(value);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div className="assistant-page">
      <header className="assistant-header">
        <div><span className="eyebrow"><Sparkles size={15} /> Trợ lý RAG nội bộ</span><h1>Hỏi DocuMind</h1><p>Câu trả lời chỉ dựa trên tài liệu bạn được phép truy cập.</p></div>
        <div className="security-pill"><ShieldCheck size={17} /><span>Phạm vi: phòng ban & tài liệu được chia sẻ</span></div>
      </header>

      <div className="chat-surface">
        <div className="chat-scroll">
          {!messages.length ? (
            <div className="assistant-welcome">
              <div className="assistant-symbol"><BotMessageSquare size={31} /></div>
              <span className="eyebrow">Sẵn sàng tra cứu</span>
              <h2>Đặt câu hỏi bằng ngôn ngữ tự nhiên</h2>
              <p>DocuMind sẽ tìm các đoạn liên quan trong kho tài liệu, tổng hợp câu trả lời và hiển thị nguồn để bạn kiểm chứng.</p>
              <div className="suggestion-grid">
                {suggestions.map((suggestion, index) => (
                  <button key={suggestion} onClick={() => chooseSuggestion(suggestion)}>
                    {index === 0 ? <FileSearch size={18} /> : index === 1 ? <Quote size={18} /> : <FileText size={18} />}
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="message-list">
              {messages.map((message) => (
                <article className={`message ${message.role}`} key={message.id}>
                  <div className="message-avatar">{message.role === "assistant" ? <BotMessageSquare size={19} /> : <UserRound size={19} />}</div>
                  <div className="message-body">
                    <span className="message-author">{message.role === "assistant" ? "DocuMind" : "Bạn"}</span>
                    <div className="message-content">{message.content}</div>
                    {!!message.citations?.length && (
                      <div className="citation-list">
                        <strong>Nguồn tham chiếu</strong>
                        {message.citations.map((citation, index) => (
                          <details key={`${citation.document_id}-${citation.chunk_index}`}>
                            <summary><span>{index + 1}</span><div><strong>{citation.title}</strong><small>{citation.document_number || "Tài liệu nội bộ"}{citation.page_number ? ` · Trang ${citation.page_number}` : ""}</small></div><em>{Math.round((1 - citation.distance) * 100)}% phù hợp</em></summary>
                            <p>{citation.excerpt}</p>
                          </details>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
              {submitting && (
                <article className="message assistant"><div className="message-avatar"><BotMessageSquare size={19} /></div><div className="message-body"><span className="message-author">DocuMind</span><div className="thinking"><i /><i /><i /><span>Đang tìm trong kho tài liệu…</span></div></div></article>
              )}
            </div>
          )}
        </div>

        <form className="chat-composer" onSubmit={ask}>
          <textarea ref={inputRef} value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); ask(); } }} placeholder="Hỏi về công văn, chính sách, hợp đồng…" rows={1} />
          <button type="submit" disabled={!question.trim() || submitting} aria-label="Gửi câu hỏi"><ArrowUp size={19} /></button>
          <span>Enter để gửi · Shift + Enter để xuống dòng</span>
        </form>
      </div>
    </div>
  );
}
