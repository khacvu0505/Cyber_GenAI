# Lesson 2 — LangChain & Groq

> Tài liệu tổng hợp buổi học, bám theo 3 file:
> `intro_to_langchain.ipynb` → `intro_to_groq.ipynb` → `streamlit_app.py`

---

## 1. LangChain là gì, Groq là gì?

| | Vai trò |
|---|---|
| **LangChain** | Framework Python giúp ghép **prompt + model + memory** thành một luồng (chain) chuẩn hóa. Đổi hãng model không cần viết lại code. |
| **Groq** | **Nhà cung cấp API** chạy LLM (giống vai trò OpenAI), nổi tiếng vì tốc độ inference rất nhanh và có gói miễn phí. Trong bài dùng model mã nguồn mở `openai/gpt-oss-20b`. |

Điểm mấu chốt: **đổi provider chỉ đổi 1 dòng khởi tạo model**, mọi thứ còn lại giữ nguyên.

```python
from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq

llm = ChatOpenAI(model="gpt-5-mini", api_key=...)            # dùng OpenAI
model = ChatGroq(model="openai/gpt-oss-20b", groq_api_key=...) # dùng Groq
```

---

## 2. Notebook 1 — `intro_to_langchain.ipynb`

### 2.1. Gọi model cơ bản: `invoke`

```python
message = [
    ("system", "Bạn là một trợ lý AI, bạn sẽ trả lời bằng tiếng việt"),
    ("human", "Python là gì?")
]

result = llm.invoke(message)
result.content   # câu trả lời dạng string
```

- Mọi chat model trong LangChain đều gọi bằng `.invoke(...)`.
- Kết quả là một `AIMessage` — lấy text bằng `.content` (bên trong còn metadata: số token, model name...).
- Role viết dạng tuple `("system", ...)`, `("human", ...)` — LangChain dùng `human/ai` thay cho `user/assistant`.

### 2.2. `ChatPromptTemplate` — prompt có chỗ trống

```python
from langchain_core.prompts import ChatPromptTemplate

messages = [
    ("system", "Bạn là một trợ lý AI, bạn sẽ trả lời bằng {language}"),
    ("human", "{input}")
]
prompt = ChatPromptTemplate.from_messages(messages)
```

- `{language}`, `{input}` là **biến** — điền giá trị lúc invoke.
- Tách "khung prompt" khỏi "dữ liệu" → tái sử dụng được, dễ bảo trì.

### 2.3. Chain và toán tử `|`

```python
chain = prompt | llm

result = chain.invoke({"language": "english", "input": "What is Python?"})
result.content
```

- `|` = **pipe**: output bước trước là input bước sau (giống pipe trong shell).
- Luồng chạy: dict biến → điền vào template → thành list messages → đưa vào model → `AIMessage`.
- Đây là khái niệm trung tâm — "chain" chính là tên của LangChain.

---

## 3. Notebook 2 — `intro_to_groq.ipynb`

### 3.1. Đổi sang Groq + message dạng class

```python
from langchain_groq import ChatGroq
from langchain_core.messages import AIMessage, HumanMessage

model = ChatGroq(model="openai/gpt-oss-20b", groq_api_key=os.environ.get("GROQ_API_KEY"))

messages = [
    AIMessage(content="Bạn là trợ lý AI"),      # ⚠️ chỗ này nên là SystemMessage
    HumanMessage(content="Python là gì"),
]
result = model.invoke(messages)
```

- Ngoài dạng tuple, message còn viết được dạng class: `HumanMessage`, `AIMessage`, `SystemMessage`.
- ⚠️ **Lưu ý trong notebook**: câu "Bạn là trợ lý AI" là chỉ dẫn hệ thống, đúng ra phải dùng `SystemMessage` chứ không phải `AIMessage` (AIMessage = lời của model nói ra trước đó).

### 3.2. Memory — phần quan trọng nhất buổi học

**Vấn đề:** LLM không có trí nhớ. Mỗi lần gọi API là một lần "gặp người lạ". Muốn model "nhớ" thì phải **gửi lại lịch sử hội thoại** trong mỗi request.

**Bước 1 — Kho lưu lịch sử theo session:**

```python
store = {}  # dict: session_id -> lịch sử hội thoại

def get_session_history(session_id: str) -> BaseChatMessageHistory:
    if session_id not in store:
        store[session_id] = ChatMessageHistory()  # session mới -> lịch sử rỗng
    return store[session_id]
```

Pattern quen thuộc: *"có rồi thì lấy ra, chưa có thì khởi tạo"* (giống `dict.setdefault`).

**Bước 2 — Bọc model bằng `RunnableWithMessageHistory`:**

```python
with_message_history = RunnableWithMessageHistory(model, get_session_history)
```

Lớp bọc này **tự động** làm 2 việc mỗi lượt chat:
1. Trước khi gọi model: lấy lịch sử của session, ghép vào trước tin nhắn mới.
2. Sau khi model trả lời: lưu cả câu hỏi lẫn câu trả lời vào lịch sử.

**Bước 3 — Chat kèm `session_id`:**

```python
config = {"configurable": {"session_id": "session_1"}}

response = with_message_history.invoke(
    [HumanMessage(content="Xin chào, tôi là Vũ, tôi là một software developer")],
    config=config
)

# Lượt sau, cùng session_id:
response = with_message_history.invoke(
    [HumanMessage(content="Tôi là ai, và tôi làm gì?")],
    config=config
)
# -> "Bạn là Vũ, một software developer..."  ✅ model "nhớ" nhờ lịch sử được gửi kèm
```

- Cùng `session_id` → chung lịch sử → có ngữ cảnh.
- Khác `session_id` → hội thoại độc lập, model không biết gì về session kia.

### 3.3. Ghép memory với prompt template

Khi chain có template (nhiều biến input), phải chỉ cho `RunnableWithMessageHistory` biết **biến nào chứa tin nhắn người dùng**:

```python
prompt = ChatPromptTemplate.from_messages([
    ("system", "Bạn là trợ lý AI, bạn sẽ trả lời bằng {language}"),
    MessagesPlaceholder(variable_name="input")
])
chain = prompt | model

chain_message_history = RunnableWithMessageHistory(
    chain,
    get_session_history,
    input_messages_key="input"   # <- tin nhắn user nằm ở key "input"
)
```

> 📌 Ghi chú: notebook in warning `RunnableWithMessageHistory is deprecated` — LangChain mới khuyên dùng LangGraph cho memory. Khái niệm vẫn đúng, chỉ là API sẽ đổi khi bạn học sâu hơn.

---

## 4. `streamlit_app.py` — ghép tất cả thành app chat

### 4.1. Khái niệm mới: `MessagesPlaceholder` cho lịch sử

```python
prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    MessagesPlaceholder(variable_name="history"),  # cả LIST tin nhắn cũ chèn vào đây
    ("human", "{input}"),                          # 1 chuỗi: câu hỏi mới
])
```

- `{input}` chỉ nhận **một chuỗi**.
- `MessagesPlaceholder` nhận **một danh sách messages** — đúng chỗ để nhét lịch sử hội thoại.

Prompt thực tế gửi lên model mỗi lượt sẽ có dạng:

```
[system]  Bạn là trợ lý AI...
[human]   (tin nhắn cũ 1)      ┐
[ai]      (trả lời cũ 1)       ├ <- history chèn vào placeholder
[human]   (tin nhắn cũ 2)      │
[ai]      (trả lời cũ 2)       ┘
[human]   (câu hỏi mới - {input})
```

### 4.2. `build_chain` — trái tim của app

```python
def build_chain(provider, model_name, temperature, system_prompt, context_enabled=True):
    model = build_model(provider, model_name, temperature)   # 1. chọn model theo provider

    prompt = ChatPromptTemplate.from_messages([              # 2. khung prompt
        ("system", system_prompt),
        MessagesPlaceholder(variable_name="history"),
        ("human", "{input}"),
    ])

    chain = prompt | model                                   # 3. nối thành chain

    return RunnableWithMessageHistory(                       # 4. bọc thêm memory
        chain,
        get_history,
        input_messages_key="input",       # câu hỏi mới nằm ở biến "input"
        history_messages_key="history",   # lịch sử chèn vào placeholder "history"
    )
```

Hai tham số key phải **khớp tên** với biến trong template:
- `input_messages_key="input"` ↔ `("human", "{input}")`
- `history_messages_key="history"` ↔ `MessagesPlaceholder(variable_name="history")`

### 4.3. Gọi chain: `invoke_chat`

```python
response = chain.invoke(
    {"input": user_input},
    config={"configurable": {"session_id": session_id}}
)
```

Mỗi lượt chat: build chain → invoke với `session_id` → memory tự đọc/ghi lịch sử.

### 4.4. Multi-provider

`build_model` trả về object khác nhau tùy lựa chọn sidebar, chain **không cần biết** đang chạy hãng nào:

```python
if provider == "OpenAI":  return ChatOpenAI(model=model_name, temperature=temperature)
if provider == "Groq":    return ChatGroq(model=model_name, temperature=temperature)
return RunnableLambda(demo_reply)   # Demo mode: hàm Python giả làm model, không cần API key
```

`RunnableLambda` biến một hàm Python thường thành một "mắt xích" cắm được vào chain — nên mode Demo chạy được cả khi chưa có API key.

### 4.5. Các chi tiết phụ trong app

| Hàm | Làm gì |
|---|---|
| `get_history` | Kho lịch sử theo session, lưu trong `st.session_state` (mất khi restart app) |
| `trim_history` | Cắt bớt, chỉ giữ N tin nhắn gần nhất → tránh prompt phình to, tốn token |
| `provider_is_ready` | Check API key trong `.env` trước khi gọi |
| `invoke_template` | **Bài tập — đang bỏ trống** (xem mục 6) |

---

## 5. Tóm tắt — 5 khái niệm phải nhớ

1. **Chat model** (`ChatOpenAI` / `ChatGroq`): interface chung, gọi bằng `.invoke()`, đổi hãng đổi 1 dòng.
2. **Messages**: `SystemMessage` / `HumanMessage` / `AIMessage` (hoặc tuple `("system", ...)`).
3. **`ChatPromptTemplate`**: prompt có biến `{...}`, điền giá trị lúc invoke.
4. **Chain** (`prompt | model`): pipe nối các bước, dữ liệu chảy từ trái sang phải.
5. **Memory** (`RunnableWithMessageHistory` + `MessagesPlaceholder`): tự động ghép lịch sử vào prompt và lưu lại sau mỗi lượt, phân biệt hội thoại bằng `session_id`.

Luồng đầy đủ của một lượt chat trong app:

```
user gõ câu hỏi
   ↓
RunnableWithMessageHistory: lấy lịch sử theo session_id
   ↓
ChatPromptTemplate: điền system + history + input thành list messages
   ↓
Model (OpenAI / Groq / Demo): sinh câu trả lời
   ↓
RunnableWithMessageHistory: lưu (câu hỏi + trả lời) vào lịch sử
   ↓
hiển thị lên UI
```

---

## 6. Bài tập còn lại: `invoke_template`

Hàm `invoke_template` trong `streamlit_app.py` (tab "Prompt Template") đang trống. Yêu cầu: build chain dịch thuật dùng đúng 3 khái niệm template + chain + invoke.

Gợi ý khung (tự điền phần `...`):

```python
def invoke_template(provider, model_name, temperature,
                    source_lang, target_lang, tone, text) -> str:
    model = build_model(provider, model_name, temperature)

    prompt = ChatPromptTemplate.from_messages([
        ("system", "Bạn là dịch giả. Dịch từ {source_lang} sang {target_lang}, giọng văn {tone}."),
        ("human", "..."),        # <- biến nào chứa nội dung cần dịch?
    ])

    chain = ...                  # <- nối prompt với model bằng gì?

    result = chain.invoke({...}) # <- truyền dict gồm những key nào?
    return message_text(result.content)
```

Chạy app để thử: `streamlit run streamlit_app.py`

---

## 7. Chạy lại bài học

```bash
cd Lesson2
source myenv/bin/activate
jupyter lab                          # mở 2 notebook
streamlit run streamlit_app.py      # chạy app chat
```

File `.env` cần có:

```
OPENAI_API_KEY=sk-...
GROQ_API_KEY=gsk_...
```
