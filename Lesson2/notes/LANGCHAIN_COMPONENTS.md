# Các thành phần LangChain — chi tiết từng phần

> Tài liệu đi sâu vào 5 thành phần dùng trong Lesson 2, theo thứ tự từ viên gạch nhỏ nhất đến tầng bao ngoài cùng.
> Đọc kèm: `intro_to_langchain.ipynb`, `intro_to_groq.ipynb`, `streamlit_app.py`.

**Mục lục**

1. [Chat Model — `ChatOpenAI` / `ChatGroq`](#1-chat-model)
2. [Messages — `SystemMessage` / `HumanMessage` / `AIMessage`](#2-messages)
3. [ChatPromptTemplate — khuôn prompt](#3-chatprompttemplate)
4. [Chain — toán tử `|` và Runnable](#4-chain)
5. [Memory — `RunnableWithMessageHistory`](#5-memory)
6. [Bonus: Output Parser — `StrOutputParser`](#6-bonus-output-parser)

---

# 1. Chat Model

## 1.1. Nó là gì?

Chat model là **object đại diện cho một LLM** — cái "bộ não" sinh ra câu trả lời. Trong LangChain, mỗi hãng có một class riêng nhưng **tất cả dùng chung một interface**:

```python
from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq

llm = ChatOpenAI(model="gpt-5-mini", temperature=0, api_key=os.getenv("OPENAI_API_KEY"))
model = ChatGroq(model="openai/gpt-oss-20b", groq_api_key=os.environ.get("GROQ_API_KEY"))
```

Vì chung interface nên `llm.invoke(...)` và `model.invoke(...)` dùng y hệt nhau. Đây là lý do tồn tại lớn nhất của LangChain: **viết code một lần, chạy với mọi hãng model**.

## 1.2. Các tham số khởi tạo quan trọng

| Tham số | Ý nghĩa |
|---|---|
| `model` | Tên model của hãng đó. OpenAI: `"gpt-5-mini"`, `"gpt-4o-mini"`... Groq: `"openai/gpt-oss-20b"`, `"llama-3.3-70b-versatile"`... |
| `temperature` | Độ "ngẫu hứng", từ 0.0 đến ~2.0. `0` = ổn định, gần như cùng câu hỏi cho cùng câu trả lời (hợp cho dịch thuật, trích xuất dữ liệu). Cao (0.7-1.0) = sáng tạo, đa dạng (hợp cho viết lách, brainstorm). Trong app, slider Temperature ở sidebar chính là tham số này. |
| `api_key` | Key xác thực. Nếu không truyền, LangChain tự đọc từ biến môi trường (`OPENAI_API_KEY` / `GROQ_API_KEY`) — vì vậy trong `streamlit_app.py` hàm `build_model` không cần truyền key, chỉ cần `load_dotenv()` đã chạy trước đó. |

## 1.3. Cách gọi: `.invoke()`

Điều quan trọng cần hiểu trước: `.invoke()` **không phải method riêng của chat model** — nó là method chung của mọi Runnable (template, model, parser, chain... — xem chương 4). Vì vậy **input nhận gì và output trả về gì là tùy vào thành phần đang được gọi**:

| Gọi `.invoke()` trên | Input nhận | Output trả về |
|---|---|---|
| Chat model (`ChatOpenAI`/`ChatGroq`) | string, list messages, hoặc `PromptValue` | `AIMessage` |
| `ChatPromptTemplate` | **dict** (điền biến vào khuôn) | `PromptValue` (list messages đã điền) |
| `StrOutputParser` | `AIMessage` | **string** |
| Chain (`prompt \| model`) | input của mắt xích ĐẦU (dict) | output của mắt xích CUỐI (`AIMessage`) |
| Chain (`prompt \| model \| parser`) | dict | **string** |

Với riêng **chat model**, các dạng input đều hợp lệ:

```python
from langchain_core.messages import SystemMessage, HumanMessage

messages = [
    SystemMessage(content="Bạn là một trợ lý ảo vui tính."),
    HumanMessage(content="Xin chào!"),
]

result = model.invoke("Python là gì?")    # 1 chuỗi → tự bọc thành HumanMessage
result = model.invoke(messages)           # list messages
result = model.invoke(prompt_value)       # PromptValue (output của template) — chính là cách chain hoạt động
```

Còn **dict thì chỉ dành cho template/chain**, không đưa thẳng vào model được:

```python
prompt.invoke({"language": "Tiếng Việt", "input": "Python là gì?"})   # ✅ dict → PromptValue
chain.invoke({"language": "Tiếng Việt", "input": "Python là gì?"})    # ✅ dict vào mắt xích đầu (prompt)
model.invoke({"language": "..."})                                     # ❌ model không hiểu dict
```

Với chat model, `.invoke()` là **một lần gọi API**: gửi input lên server của hãng → model sinh chữ → nhận về kết quả. Mỗi lần invoke là một request độc lập, model **không nhớ** lần invoke trước (đây chính là lý do cần memory ở chương 5).

Kết quả chat model trả về là một `AIMessage`:

```python
result.content            # phần text câu trả lời — dùng nhiều nhất
result.response_metadata  # token đã dùng, tên model, finish_reason...
result.usage_metadata     # input_tokens, output_tokens, total_tokens
```

Trong notebook `intro_to_langchain.ipynb`, bạn thấy khi in nguyên `result` thì ra một cục `AIMessage(content='...', response_metadata={...})` rất dài — còn `result.content` chỉ ra text. Đó là vì `AIMessage` là một object chứa nhiều thứ, `.content` chỉ là một field trong đó.

> 📌 **Chat model có luôn trả `AIMessage` không?** Có — cái "vỏ" luôn là `AIMessage`, nhưng:
> - **Ruột `.content` có thể không phải string**: với nội dung đa phương thức hoặc một số provider, `content` là **list các block** `[{"type": "text", "text": "..."}, ...]`. Vì vậy `streamlit_app.py` mới cần hàm `message_text()` check str/list trước khi hiển thị.
> - **Khi model gọi tool** (bài agent sau này): vẫn `AIMessage`, nhưng `content` có thể rỗng, thông tin nằm ở `result.tool_calls`.
> - **Streaming**: `model.stream()` trả từng mẩu `AIMessageChunk` (class con của `AIMessage`).
> - **Ngoại lệ trả kiểu khác**: `model.with_structured_output(schema)` → dict/Pydantic object; class LLM đời cũ dạng text-completion (`OpenAI` thay vì `ChatOpenAI`) → string thô. Cả hai đều không phải "chat model invoke bình thường".

## 1.4. Ngoài `.invoke()` còn gì?

Cùng interface đó còn có (chưa dùng trong Lesson 2, biết để không bỡ ngỡ):

```python
model.stream(messages)    # trả về từng mẩu chữ một (hiệu ứng gõ chữ như ChatGPT)
model.batch([msgs1, msgs2])  # gọi nhiều request song song
await model.ainvoke(messages)  # bản async
```

## 1.5. Giới thiệu nhanh về Groq

**Groq là gì?** Một công ty hạ tầng AI (thành lập 2016 bởi Jonathan Ross — người từng thiết kế chip TPU của Google). Groq **không làm model** — họ làm **chip chuyên dụng tên LPU** (Language Processing Unit) được thiết kế riêng cho việc chạy LLM, và cho thuê hạ tầng đó qua API.

**Điểm mạnh nhất: tốc độ.** LPU sinh chữ nhanh hơn GPU thông thường nhiều lần (hàng trăm token/giây) — bạn có thể tự cảm nhận: cùng câu hỏi, notebook Groq trả lời gần như tức thì so với OpenAI. Rất hợp cho chatbot cần phản hồi nhanh.

**Chạy model gì?** Các model **mã nguồn mở** của hãng khác: Llama (Meta), gpt-oss (OpenAI), Qwen, Whisper... Vì vậy tên model có dạng `hãng/tên-model` — vd `openai/gpt-oss-20b` = model gpt-oss-20b do OpenAI phát hành mã nguồn mở, chạy trên máy Groq.

**Vì sao khóa học dùng Groq?** Ba lý do thực dụng:
1. **Miễn phí** — có free tier đủ dùng để học (lấy key tại console.groq.com), không cần thẻ tín dụng như OpenAI.
2. **Nhanh** — vòng lặp thử-sai khi học ngắn hơn.
3. **API tương thích chuẩn OpenAI** — nên code gần như y hệt, đổi qua lại dễ (đúng tinh thần bài học về LangChain).

**So sánh nhanh:**

| | OpenAI | Groq |
|---|---|---|
| Vai trò | Làm model (GPT) + bán API | Làm chip (LPU) + cho thuê hạ tầng chạy model mã nguồn mở |
| Model | Độc quyền (gpt-5-mini, gpt-4o...) | Mã nguồn mở của hãng khác (llama-3.3, gpt-oss...) |
| Tốc độ | Bình thường | Rất nhanh |
| Giá | Trả theo token | Có free tier |
| Trong LangChain | `ChatOpenAI` (`langchain-openai`) | `ChatGroq` (`langchain-groq`) |

⚠️ Đừng nhầm **Groq** với **Grok** (chatbot của xAI/Elon Musk) — hai công ty khác nhau, tên chỉ tình cờ giống.

## 1.6. Điểm hay trong `streamlit_app.py`

```python
def build_model(provider, model_name, temperature):
    if provider == "OpenAI":
        return ChatOpenAI(model=model_name, temperature=temperature)
    if provider == "Groq":
        return ChatGroq(model=model_name, temperature=temperature)
    return RunnableLambda(demo_reply)   # Demo mode
```

Hàm này trả về "một cái gì đó gọi được bằng `.invoke()`" — người gọi không cần biết bên trong là OpenAI, Groq hay một hàm Python giả (`demo_reply`). Trong lập trình gọi đây là **polymorphism** (đa hình): cùng interface, nhiều cài đặt.

---

# 2. Messages

## 2.1. Nó là gì?

Message là **đơn vị hội thoại** — một câu nói kèm thông tin "ai nói". Hội thoại với LLM luôn là một **list các message**, và mỗi message có một trong 3 vai (role):

| Class | Role | Ai nói | Dùng để |
|---|---|---|---|
| `SystemMessage` | system | "đạo diễn" | Chỉ dẫn cách model hành xử: tính cách, ngôn ngữ, giới hạn. Thường đứng đầu list, người dùng không nhìn thấy. |
| `HumanMessage` | human (user) | người dùng | Câu hỏi / yêu cầu của người dùng. |
| `AIMessage` | ai (assistant) | model | Câu model đã trả lời trước đó. Xuất hiện trong list khi ta gửi lại lịch sử hội thoại. |

```python
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

messages = [
    SystemMessage(content="Bạn là trợ lý AI, trả lời bằng tiếng Việt"),
    HumanMessage(content="Python là gì?"),
]
result = model.invoke(messages)
```

## 2.2. Hai cách viết tương đương

LangChain chấp nhận cả dạng class lẫn dạng tuple `(role, content)`:

```python
# Dạng class — tường minh, hay dùng khi build list động
messages = [
    SystemMessage(content="Bạn là trợ lý AI"),
    HumanMessage(content="Python là gì?"),
]

# Dạng tuple — gọn, hay dùng trong ChatPromptTemplate
messages = [
    ("system", "Bạn là trợ lý AI"),
    ("human", "Python là gì?"),
]
```

Lưu ý tên role dạng tuple: `"system"`, `"human"`, `"ai"` (LangChain dùng human/ai thay vì user/assistant của OpenAI — LangChain sẽ tự dịch sang đúng format của từng hãng khi gọi API).

## 2.3. Vì sao cần phân vai?

Model đối xử **khác nhau** với từng role:

- Chỉ dẫn trong `system` có "quyền lực" cao hơn — model bám theo nó xuyên suốt hội thoại.
- `human`/`ai` xen kẽ giúp model hiểu diễn biến hội thoại: ai hỏi gì, mình đã trả lời gì.

Vì vậy gán sai role là một bug thật sự chứ không chỉ là chuyện hình thức:

```python
# ⚠️ Trong intro_to_groq.ipynb có chỗ này:
messages = [
    AIMessage(content="Bạn là trợ lý AI"),   # SAI vai!
    HumanMessage(content="Python là gì"),
]
```

"Bạn là trợ lý AI" là **chỉ dẫn**, phải là `SystemMessage`. Để `AIMessage` nghĩa là nói với model rằng *"trước đó chính mày đã thốt ra câu 'Bạn là trợ lý AI'"* — model vẫn chạy, nhưng chỉ dẫn mất hiệu lực "hệ thống", hội thoại dài dễ lệch hành vi.

## 2.4. `AIMessage` — vừa là input, vừa là output

Điểm dễ nhầm: `AIMessage` xuất hiện ở **hai chỗ**:

1. **Output của `.invoke()`** — kết quả model trả về là một `AIMessage` (có `.content`, metadata...).
2. **Input trong lịch sử** — khi gửi lại hội thoại cũ, các câu model từng trả lời được gửi dưới dạng `AIMessage`.

Cùng một class, hai vai trò. Hiểu điều này thì chương 5 (memory) sẽ rất dễ: memory bản chất chỉ là *tự động nhét các `HumanMessage`/`AIMessage` cũ vào đầu list input*.

## 2.5. Nhìn từ ngoài vào: chuyện gì xảy ra khi invoke?

```python
model.invoke([
    SystemMessage(content="Trả lời bằng tiếng Việt"),
    HumanMessage(content="Xin chào"),
    AIMessage(content="Chào bạn!"),
    HumanMessage(content="Python là gì?"),
])
```

LangChain dịch list này sang format JSON của hãng (với OpenAI là `[{"role": "system", ...}, {"role": "user", ...}, ...]`), gửi lên API, nhận JSON về, gói lại thành `AIMessage`. Bạn không phải đụng vào JSON — đó là việc của LangChain.

---

# 3. ChatPromptTemplate

## 3.1. Nó là gì?

`ChatPromptTemplate` là **khuôn prompt có chỗ trống**. Bạn thiết kế khung một lần, mỗi lần dùng chỉ đổ dữ liệu khác nhau vào.

```python
from langchain_core.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_messages([
    ("system", "Bạn là một trợ lý AI, bạn sẽ trả lời bằng {language}"),
    ("human", "{input}"),
])
```

`{language}` và `{input}` là **biến** (variable). Tên biến do bạn tự đặt — sau này điền giá trị bằng dict có key trùng tên.

## 3.2. Điền giá trị vào khuôn

Template cũng có `.invoke()`, nhận **dict** và trả về prompt hoàn chỉnh:

```python
prompt_value = prompt.invoke({"language": "Tiếng Việt", "input": "Python là gì?"})

# Kết quả tương đương:
# [SystemMessage("Bạn là một trợ lý AI, bạn sẽ trả lời bằng Tiếng Việt"),
#  HumanMessage("Python là gì?")]
```

Quy tắc: **mọi biến trong template đều phải có mặt trong dict**, thiếu biến nào là lỗi `KeyError` biến đó. Đây là lỗi hay gặp nhất khi mới học.

## 3.3. Vì sao không dùng f-string cho rồi?

So sánh:

```python
# f-string: điền giá trị NGAY LÚC VIẾT — muốn dùng lại phải viết hàm bao ngoài
text = f"Bạn là trợ lý AI, trả lời bằng {language}"

# Template: định nghĩa khung TRƯỚC, điền giá trị SAU, ở chỗ khác, bao nhiêu lần cũng được
prompt = ChatPromptTemplate.from_messages([("system", "... trả lời bằng {language}"), ...])
```

Lợi ích thực sự của template:

1. **Tách khung khỏi dữ liệu** — khung prompt là "code", dữ liệu là "input". Sửa khung không đụng logic, đổi dữ liệu không đụng khung.
2. **Cắm được vào chain** — template là một Runnable (chương 4), nối được bằng `|`. f-string thì không.
3. **Kiểm tra biến** — template biết nó cần biến gì (`prompt.input_variables`), thiếu là báo lỗi rõ ràng.

## 3.4. `MessagesPlaceholder` — chỗ trống đặc biệt cho cả LIST message

Biến `{input}` chỉ điền được **một chuỗi**. Nhưng lịch sử hội thoại là **một list message** — nhét kiểu gì? Dùng `MessagesPlaceholder`:

```python
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

prompt = ChatPromptTemplate.from_messages([
    ("system", "Bạn là trợ lý AI"),
    MessagesPlaceholder(variable_name="history"),   # cả list chèn vào đây
    ("human", "{input}"),
])

prompt.invoke({
    "history": [HumanMessage("Xin chào"), AIMessage("Chào bạn!")],  # list!
    "input": "Python là gì?",                                        # chuỗi
})
```

Kết quả — list history được "trải phẳng" vào đúng vị trí:

```
[system]  Bạn là trợ lý AI
[human]   Xin chào          ┐ từ history
[ai]      Chào bạn!         ┘
[human]   Python là gì?     ← từ input
```

So sánh nhanh:

| | `{input}` | `MessagesPlaceholder("history")` |
|---|---|---|
| Nhận gì | 1 chuỗi | 1 list messages |
| Thành gì | 1 message theo role khai báo | Nhiều message giữ nguyên role gốc |
| Dùng cho | Câu hỏi mới | Lịch sử hội thoại |

Đây chính là cấu trúc 3 tầng trong `build_chain` của app: `system` (chỉ dẫn cố định) + `history` (quá khứ) + `input` (hiện tại).

## 3.5. Bẫy thường gặp

- **Ngoặc nhọn trong nội dung**: muốn viết `{}` thật (vd ví dụ JSON trong prompt) phải escape thành `{{` `}}`, không thì template tưởng là biến.
- **Tên biến không khớp**: `MessagesPlaceholder(variable_name="history")` mà invoke truyền key `"chat_history"` → lỗi. Tên phải khớp từng ký tự.

---

# 4. Chain

## 4.1. Nó là gì?

Chain là **đường ống nối các bước xử lý**: output bước trước tự động thành input bước sau. Ký hiệu bằng toán tử `|` (pipe — giống pipe trong shell: `cat file | grep abc`).

```python
chain = prompt | model
result = chain.invoke({"language": "english", "input": "What is Python?"})
```

Dòng `chain.invoke(...)` này tương đương viết tay:

```python
prompt_value = prompt.invoke({"language": "english", "input": "What is Python?"})
result = model.invoke(prompt_value)
```

Tức là: **chain không có phép màu gì** — nó chỉ gọi `.invoke()` lần lượt từng mắt xích và chuyền kết quả. Nhưng nhờ đóng gói thành một object, cả pipeline trở thành "một cục" có thể tái sử dụng, truyền vào hàm khác, hoặc bọc thêm tầng khác (như memory ở chương 5).

## 4.2. Runnable — vì sao mọi thứ nối được với nhau?

Mọi thành phần LangChain (`ChatPromptTemplate`, `ChatOpenAI`, `ChatGroq`, và cả chain đã nối) đều là **Runnable** — nghĩa là đều có `.invoke(input) -> output`. Đó là "chuẩn chân cắm" chung:

```
   dict biến           list messages          AIMessage
      │                     │                     │
      ▼                     ▼                     ▼
 ┌──────────┐         ┌──────────┐          ┌──────────┐
 │  prompt  │ ──────► │  model   │ ───────► │  output  │
 └──────────┘         └──────────┘          └──────────┘
      Runnable   |      Runnable    =    chain (cũng là Runnable!)
```

Vì chain cũng là Runnable nên nối tiếp được: `chain2 = chain | parser | gì_đó_nữa`. Cấu trúc này gọi là **LCEL** (LangChain Expression Language).

## 4.3. Kiểu dữ liệu phải "khớp khớp nối"

Điều duy nhất cần để chain chạy: **output bước trước phải là thứ bước sau hiểu được**.

- `prompt` nhận dict → nhả ra list messages ✅ `model` nhận list messages → nhả `AIMessage`.
- Nếu đảo ngược `model | prompt` → lỗi ngay, vì prompt không hiểu `AIMessage`.

Khi chain báo lỗi khó hiểu, cách debug tốt nhất là **tách chain ra chạy từng bước** như đoạn "tương đương viết tay" ở trên, xem output bước nào không như mình tưởng.

## 4.4. Biến một hàm thường thành mắt xích: `RunnableLambda`

Trong `streamlit_app.py`, Demo mode hoạt động không cần API key nhờ:

```python
from langchain_core.runnables import RunnableLambda

def demo_reply(prompt_value):          # hàm Python thường
    ...
    return AIMessage(content=content)

model = RunnableLambda(demo_reply)     # giờ nó có .invoke(), cắm vào chain được!
```

`RunnableLambda` bọc một hàm Python thành Runnable. Chain `prompt | RunnableLambda(demo_reply)` chạy y như chain thật — chỉ khác "model" là hàm giả đếm message và trả lời cứng. Đây là kỹ thuật hay để test pipeline không tốn tiền API.

## 4.5. Chain trong Lesson 2 mới là dạng đơn giản nhất

Lesson 2 chỉ dùng chain thẳng 2 mắt xích. Để biết trước: chain có thể dài hơn (`prompt | model | output_parser`), rẽ nhánh, chạy song song... nhưng nguyên lý không đổi: **các Runnable nối nhau, dữ liệu chảy một chiều**.

---

# 5. Memory

## 5.1. Vấn đề gốc: LLM không có trí nhớ

Mỗi lần `.invoke()` là một request **hoàn toàn độc lập** — server của OpenAI/Groq không lưu gì về bạn giữa hai lần gọi:

```python
model.invoke([HumanMessage("Tôi là Vũ, software developer")])
# → "Chào Vũ!..."

model.invoke([HumanMessage("Tôi là ai?")])
# → "Xin lỗi, tôi không biết bạn là ai" ❌ — model chưa từng "gặp" bạn
```

Muốn model "nhớ", chỉ có một cách: **mỗi lần hỏi, gửi kèm toàn bộ hội thoại cũ**:

```python
model.invoke([
    HumanMessage("Tôi là Vũ, software developer"),   # gửi lại quá khứ
    AIMessage("Chào Vũ!..."),                        # gửi lại quá khứ
    HumanMessage("Tôi là ai?"),                      # câu mới
])
# → "Bạn là Vũ, một software developer" ✅
```

"Trí nhớ" của chatbot = **trò ảo thuật gửi lại lịch sử**. Toàn bộ chương này chỉ là tự động hóa trò đó.

## 5.2. Tự động hóa cần 2 mảnh ghép

Làm tay thì mỗi lượt chat phải: (1) lấy lịch sử ra, (2) ghép vào trước câu mới, (3) gọi model, (4) lưu câu hỏi + câu trả lời vào lịch sử. LangChain tách việc này thành:

- **Kho lịch sử** — nơi cất các message cũ, phân ngăn theo session.
- **`RunnableWithMessageHistory`** — lớp bọc quanh chain, tự làm 4 bước trên.

## 5.3. Mảnh 1 — Kho lịch sử theo session

```python
store = {}   # dict: session_id -> ChatMessageHistory

def get_session_history(session_id: str) -> BaseChatMessageHistory:
    if session_id not in store:
        store[session_id] = ChatMessageHistory()   # session mới → lịch sử rỗng
    return store[session_id]
```

- `ChatMessageHistory` bản chất chỉ là một object bọc quanh `list` message, có `.messages` và `.add_message()`.
- `session_id` là "số phòng": mỗi cuộc hội thoại một id, lịch sử không lẫn nhau. App chat thật thì đây là user id / conversation id.
- Hàm này là **callback**: bạn không tự gọi nó — bạn đưa nó cho `RunnableWithMessageHistory`, và *nó* sẽ gọi mỗi lượt chat với session_id lấy từ config.
- Lưu trong dict = **mất khi tắt chương trình**. Production sẽ thay bằng Redis/database — chỉ cần đổi hàm `get_session_history`, chain không đổi. Đó là lý do LangChain thiết kế nó thành hàm cắm rời.

## 5.4. Mảnh 2 — `RunnableWithMessageHistory`

### Dạng đơn giản nhất (bọc thẳng model — như trong notebook):

```python
with_message_history = RunnableWithMessageHistory(model, get_session_history)

config = {"configurable": {"session_id": "session_1"}}
response = with_message_history.invoke(
    [HumanMessage(content="Xin chào, tôi là Vũ")],
    config=config
)
```

Mỗi lần invoke, lớp bọc làm đúng trình tự này:

```
1. Đọc session_id từ config                     ("session_1")
2. Gọi get_session_history("session_1")         → lịch sử của phòng đó
3. GHÉP: lịch sử + message mới                   → input đầy đủ
4. Gọi chain/model bên trong với input đầy đủ    → AIMessage
5. LƯU: message mới + câu trả lời vào lịch sử
6. Trả kết quả về cho bạn
```

Bạn chỉ viết bước 0 (gọi invoke) — 6 bước kia tự động.

### Vì sao `session_id` nằm trong `config` mà không phải input?

LangChain tách hai loại thông tin: **input** (nội dung xử lý — câu hỏi) và **config** (thông tin điều phối — chạy cho ai, session nào). `{"configurable": {...}}` là cấu trúc chuẩn của LangChain cho các tham số điều phối, cứ nhớ nguyên xi cú pháp này.

### Thí nghiệm chứng minh trong notebook

```python
# Phòng 1: giới thiệu bản thân
with_message_history.invoke([HumanMessage("Xin chào, tôi là Vũ, tôi là một software developer")],
                            config={"configurable": {"session_id": "session_1"}})

# Phòng 1: hỏi lại → NHỚ ✅
with_message_history.invoke([HumanMessage("Tôi là ai, và tôi làm gì?")],
                            config={"configurable": {"session_id": "session_1"}})
# → "Bạn là Vũ, một software developer..."

# Nếu hỏi cùng câu đó ở session_2 → model KHÔNG biết, vì phòng 2 lịch sử rỗng
```

## 5.5. Dạng đầy đủ — bọc chain có template (như trong app)

Khi bên trong là chain có template nhiều biến, lớp bọc cần biết **nhét cái gì vào đâu**:

```python
prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    MessagesPlaceholder(variable_name="history"),   # ◄─┐ khớp tên
    ("human", "{input}"),                           # ◄─┼─┐ khớp tên
])                                                  #   │ │
chain = prompt | model                              #   │ │
                                                    #   │ │
chatbot = RunnableWithMessageHistory(               #   │ │
    chain,                                          #   │ │
    get_history,                                    #   │ │
    history_messages_key="history",  # ─────────────────┘ │  lịch sử đổ vào placeholder này
    input_messages_key="input",      # ───────────────────┘  câu mới nằm ở biến này
)
```

Hai tham số key là **hợp đồng nối tên** giữa lớp bọc và template:

- `input_messages_key="input"` → "trong dict user truyền vào, câu hỏi mới nằm ở key `input`; và cũng chính key đó là chỗ tao lưu vào lịch sử".
- `history_messages_key="history"` → "lịch sử lấy từ kho, tao sẽ đổ vào biến `history` của template" — biến đó phải là `MessagesPlaceholder`.

Sai tên một trong hai chỗ là lỗi hoặc chatbot "mất trí nhớ" một cách khó hiểu. Khi debug memory, **kiểm tra khớp tên là việc đầu tiên**.

### Luồng đầy đủ một lượt chat trong `streamlit_app.py`

```
user gõ: "Python là gì?"  (session_id = "demo-user")
        │
        ▼
chatbot.invoke({"input": "Python là gì?"},
               config={"configurable": {"session_id": "demo-user"}})
        │
        ▼
RunnableWithMessageHistory:
   get_history("demo-user") → [HumanMessage("Xin chào"), AIMessage("Chào bạn!")]
   chuẩn bị biến: history=[...2 msg cũ...], input="Python là gì?"
        │
        ▼
prompt.invoke(...) →  [system]  Bạn là trợ lý AI đang dạy LangChain...
                      [human]   Xin chào
                      [ai]      Chào bạn!
                      [human]   Python là gì?
        │
        ▼
model.invoke(...) → AIMessage("Python là một ngôn ngữ...")
        │
        ▼
RunnableWithMessageHistory lưu vào kho:
   history["demo-user"] += [HumanMessage("Python là gì?"), AIMessage("Python là...")]
        │
        ▼
trả kết quả → hiển thị lên UI
```

## 5.6. Hệ quả thực tế: lịch sử càng dài, prompt càng phình

Vì mỗi lượt đều gửi lại toàn bộ quá khứ, hội thoại dài → tốn token → chậm và tốn tiền, thậm chí vượt giới hạn context của model. App xử lý bằng `trim_history`:

```python
def trim_history(session_id, max_messages):
    history = get_history(session_id)
    if len(history.messages) > max_messages:
        history.messages = history.messages[-max_messages:]   # giữ N message cuối
```

Slider "Giữ tối đa bao nhiêu lượt gần nhất" trong sidebar điều khiển con số này (`max_turns * 2` vì mỗi lượt = 1 human + 1 ai). Đánh đổi: cắt bớt thì model quên chuyện cũ — đó là bản chất của mọi chatbot.

## 5.7. Ghi chú deprecated

Notebook in warning: `RunnableWithMessageHistory is deprecated. Use LangGraph's built-in persistence instead.` — LangChain đang chuyển việc quản lý hội thoại sang **LangGraph** (checkpointer). Khái niệm cốt lõi (lịch sử theo session, tự ghép vào prompt) **không đổi**; chỉ API sẽ khác khi bạn học tiếp. Học `RunnableWithMessageHistory` trước vẫn đúng hướng vì nó lộ rõ cơ chế bên trong.

---

# 6. Bonus: Output Parser

> Lesson 2 chưa dùng đến, nhưng đây là mảnh thứ 6 xuất hiện trong hầu hết tutorial LangChain — biết trước sẽ đỡ bỡ ngỡ.

## 6.1. Vấn đề: cứ phải `.content` mãi

Trong cả notebook lẫn app, sau mỗi lần invoke bạn đều phải viết:

```python
result = chain.invoke({...})
result.content            # ← lần nào cũng phải bóc AIMessage ra lấy text
```

## 6.2. Giải pháp: nối thêm một mắt xích bóc vỏ

```python
from langchain_core.output_parsers import StrOutputParser

chain = prompt | model | StrOutputParser()

result = chain.invoke({"language": "Tiếng Việt", "input": "Python là gì?"})
# result đã là string luôn, không cần .content nữa
```

`StrOutputParser` là một Runnable làm đúng một việc: nhận `AIMessage` → trả về `.content`. Nối nó vào cuối chain là output ra thẳng string. Đây chính là bộ ba "kinh điển" bạn sẽ thấy khắp nơi trong docs:

```
prompt | model | parser
(khuôn)  (não)   (bóc vỏ)
```

## 6.3. Không chỉ bóc string

Họ nhà parser còn nhiều loại — dùng khi muốn model trả về **dữ liệu có cấu trúc** thay vì văn xuôi:

| Parser | Output |
|---|---|
| `StrOutputParser` | string |
| `JsonOutputParser` | dict (ép model trả JSON rồi parse hộ) |
| `PydanticOutputParser` | object Pydantic có schema, validate được |

Chưa cần học sâu — chỉ cần nhớ: **parser = mắt xích cuối chain, biến `AIMessage` thành kiểu dữ liệu bạn muốn**.

---

# Tổng kết — lắp 5 mảnh thành một app chat

```python
# 1. MODEL — bộ não
model = ChatGroq(model="openai/gpt-oss-20b")

# 2+3. MESSAGES + TEMPLATE — khuôn prompt 3 tầng: chỉ dẫn / quá khứ / hiện tại
prompt = ChatPromptTemplate.from_messages([
    ("system", "Bạn là trợ lý AI"),
    MessagesPlaceholder(variable_name="history"),
    ("human", "{input}"),
])

# 4. CHAIN — nối khuôn với não
chain = prompt | model

# 5. MEMORY — bọc chain, tự đọc/ghi lịch sử theo session
chatbot = RunnableWithMessageHistory(
    chain, get_session_history,
    input_messages_key="input", history_messages_key="history",
)

# Dùng:
chatbot.invoke({"input": "Xin chào!"},
               config={"configurable": {"session_id": "user-1"}})
```

Câu hỏi tự kiểm tra (trả lời được hết = nắm bài):

1. Đổi từ OpenAI sang Groq phải sửa những dòng nào? Vì sao ít vậy?
2. `SystemMessage` khác `AIMessage` chỗ nào? Dùng nhầm thì sao?
3. `{input}` và `MessagesPlaceholder` khác nhau thế nào?
4. `chain = prompt | model` — viết lại thành 2 dòng không dùng `|`?
5. Vì sao LLM "quên"? `RunnableWithMessageHistory` giải quyết bằng cách nào — model có thật sự nhớ không?
6. `input_messages_key` và `history_messages_key` phải khớp với cái gì?
7. Nếu 2 người dùng chung một `session_id` thì chuyện gì xảy ra?
