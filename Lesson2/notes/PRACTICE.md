# Luyện viết LangChain — từ "đọc hiểu" sang "tự viết"

> Nguyên tắc: **không copy-paste**. Gõ tay từng dòng, kể cả khi phải nhìn mẫu.
> Bí quá 15 phút mới được mở notebook/notes ra xem, xem xong ĐÓNG LẠI rồi viết tiếp từ trí nhớ.
> Mỗi bậc làm xong hãy lên bậc tiếp — đừng nhảy cóc.

---

## Bậc 1 — Chép lại từ trí nhớ (30 phút)

Tạo file mới `practice/b1_basic.py` (đừng làm trong notebook cũ). KHÔNG mở notebook ra nhìn, tự viết:

1. Load `.env`, khởi tạo `ChatGroq`
2. Invoke với 1 câu hỏi bất kỳ, in `result.content`
3. Tạo `ChatPromptTemplate` có 2 biến `{language}` và `{input}`
4. Nối chain, invoke, in kết quả

Chạy được rồi mới đối chiếu với notebook — so xem mình viết khác chỗ nào, vì sao.

**Thước đo đạt:** viết xong không cần mở notebook quá 2 lần.

---

## Bậc 2 — Điền chỗ trống có sẵn: `invoke_template` (45 phút)

Bài tập chính khóa còn bỏ trống trong `streamlit_app.py` (dòng ~301). Spec:

- Nhận: `provider, model_name, temperature, source_lang, target_lang, tone, text`
- Trả về: bản dịch `text` từ `source_lang` sang `target_lang` theo giọng văn `tone`
- Dùng: `build_model` (có sẵn) + `ChatPromptTemplate` + chain

Gợi ý duy nhất: template cần 4 biến, và hàm này KHÔNG cần memory (dịch thuật là việc một phát ăn ngay, không có hội thoại).

Test: chạy `streamlit run streamlit_app.py` → tab "Prompt Template" → thử cả Demo lẫn Groq.

**Thước đo đạt:** tab Prompt Template chạy được với Groq, đổi tone thấy giọng văn đổi theo.

---

## Bậc 3 — Biến tấu trên nền có sẵn (mỗi bài 20-30 phút)

Vẫn file `practice/`, mỗi bài một file. Đây là bậc quan trọng nhất — biến tấu ép bạn hiểu từng mảnh thật sự làm gì:

- **3a.** Lấy chain ở Bậc 1, nối thêm `StrOutputParser` vào cuối. Xác nhận kết quả invoke giờ là string luôn, khỏi `.content`.
- **3b.** Viết chain "thầy giáo chấm bài": template nhận `{code}` (một đoạn Python), system prompt yêu cầu chỉ ra bug và cách sửa. Test với đoạn code có bug thật.
- **3c.** Viết một `RunnableLambda` chen GIỮA prompt và model: nhận `PromptValue`, in ra `"[DEBUG] đang gửi N messages"` rồi trả nguyên `PromptValue` cho model. (Đây là trick debug chain thực dụng!)
- **3d.** Chatbot có memory (chép khung từ notebook 2 được), nhưng: sau mỗi lượt chat, in `len(store[session_id].messages)` để tận mắt thấy lịch sử phình ra. Rồi tự viết hàm `trim` giữ tối đa 6 messages.
- **3e.** Đổi 3b sang `ChatOpenAI`. Đo xem phải sửa mấy dòng (đáp án kỳ vọng: 1-2 dòng).

**Thước đo đạt:** làm 3c và 3d không cần nhìn mẫu.

---

## Bậc 4 — Viết từ trang giấy trắng: CLI chatbot (1-2 buổi)

File `practice/b4_cli_chatbot.py`, KHÔNG nhìn bất cứ mẫu nào (được đọc docs). Spec:

```
$ python b4_cli_chatbot.py
Session ID (enter = tạo mới): ⏎
[phòng: a3f9c2] Bạn: xin chào, tôi là Vũ
[phòng: a3f9c2] Bot: Chào Vũ! ...
[phòng: a3f9c2] Bạn: tôi là ai?
[phòng: a3f9c2] Bot: Bạn là Vũ...        ← memory hoạt động
[phòng: a3f9c2] Bạn: /history            ← in toàn bộ lịch sử phòng
[phòng: a3f9c2] Bạn: /new                ← đổi sang phòng mới, hỏi lại "tôi là ai" phải KHÔNG nhớ
[phòng: 7b1e08] Bạn: /quit
```

Yêu cầu kỹ thuật: ChatGroq + template có system/history/input + `RunnableWithMessageHistory` + vòng lặp `while True` với `input()`.

**Thước đo đạt:** chạy được đúng spec, và giải thích được từng dòng mình viết cho một người khác nghe (nói to lên thật — kỹ thuật rubber duck).

---

## Bậc 5 — Capstone: viết lại ShopAI của Lesson 1 bằng LangChain (2-3 buổi)

Vòng tròn khép kín: lấy `Lesson1/genai-shopai-be/app/services/chat_service.py` — thứ bạn đã hiểu từng dòng — và viết lại bằng LangChain:

| Lesson 1 (tay) | Thay bằng |
|---|---|
| `client.chat.completions.create` | `ChatGroq` / `ChatOpenAI` + chain |
| f-string `build_system_prompt` | `ChatPromptTemplate` (catalog/faq/orders là biến) |
| `conversation_store` + `setdefault` + append tay | `RunnableWithMessageHistory` + `get_session_history` |
| `history` truyền tay vào messages | `MessagesPlaceholder` |
| Bug gán cứng `"role": "user"` cho cả lịch sử | Tự khỏi — placeholder giữ nguyên role gốc |

Giữ nguyên: `fallback_reply` (rule-based vẫn hữu ích khi API chết), FastAPI routes, schemas.
Bonus khó: bọc `call_openai` mới bằng try/except để fallback hoạt động thật (cái bug ta từng mổ xẻ).

**Thước đo đạt:** app FE của Lesson 1 chạy với BE mới mà không biết gì đã đổi.

---

## Checklist "tôi tự viết được rồi"

- [ ] Dựng chain prompt→model→parser từ file rỗng, không nhìn mẫu, dưới 10 phút
- [ ] Gặp `KeyError`/`ValueError` của template thì biết soi chỗ nào trước
- [ ] Lắp memory đúng bộ 3 tên khớp (placeholder / history_messages_key / input_messages_key) không nhìn mẫu
- [ ] Giải thích được cho người khác: vì sao model không thật sự nhớ
- [ ] Hoàn thành Bậc 4 và 5

## Khi bí thì làm gì (theo thứ tự)

1. Đọc message lỗi CHẬM — LangChain báo lỗi khá rõ (nhớ vụ `variable input should be a list...`)
2. Tách chain chạy từng bước, in kết quả trung gian (câu quiz số 4!)
3. `print(prompt.input_variables)` — xem template đang đòi gì
4. 15 phút chưa ra → mở notes/notebook xem, ĐÓNG lại, viết tiếp từ trí nhớ
5. Vẫn bí → hỏi Claude, nhưng hỏi kiểu "vì sao lỗi này" chứ đừng xin code hoàn chỉnh
