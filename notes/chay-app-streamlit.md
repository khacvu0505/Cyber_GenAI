# Cách chạy app Streamlit

File Streamlit (ví dụ `open_ai_with_ui.py`) là một **ứng dụng web**, nên **KHÔNG chạy bằng `python`** như file thường. Chạy `python open_ai_with_ui.py` sẽ không hiện giao diện.

---

## Các bước chạy

**Bước 1** — Kích hoạt môi trường ảo (nếu chưa):

```bash
source myenv/bin/activate
```

**Bước 2** — Chạy bằng lệnh `streamlit run`:

```bash
streamlit run open_ai_with_ui.py
```

Streamlit sẽ tự **mở trình duyệt** ở địa chỉ `http://localhost:8501` — giao diện hiển thị ở đó, **không** hiện trong terminal.

**Dừng app:** bấm `Ctrl + C` trong terminal.

---

## Tại sao không dùng `python`?

| Lệnh | Kết quả |
|---|---|
| `python file.py` | Chạy script Python thường, in ra terminal |
| `streamlit run file.py` | Khởi động **web server**, render giao diện ra trình duyệt |

Streamlit cần một web server riêng để vẽ giao diện, nên phải gọi qua lệnh `streamlit`.

---

## Lưu ý trước khi chạy

- File `.env` phải có key OpenAI:

  ```
  OPENAI_API_KEY=sk-...
  ```

  Nếu thiếu, `os.getenv("OPENAI_API_KEY")` trả về `None` → lỗi khi gọi API.

- Nếu port `8501` đang bận, đổi port khác:

  ```bash
  streamlit run open_ai_with_ui.py --server.port 8502
  ```
