# Cách chạy backend ShopAI (FastAPI)

FastAPI không tự chạy được như Streamlit — cần web server **uvicorn**.

## Các bước

```bash
cd Lesson1/genai-shopai-be
python3 -m venv myenv                        # lần đầu
source myenv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env                         # điền OPENAI_API_KEY + thông tin DB
python -m uvicorn app.main:app --reload --port 8000
```

Mở Swagger docs tại: `http://127.0.0.1:8000/docs`

## Giải nghĩa lệnh uvicorn

- `app.main:app` = package `app` → file `main.py` → biến `app` (object FastAPI)
- `--reload` = tự restart server khi sửa code (chỉ dùng khi dev)
- `--port 8000` = chạy ở cổng 8000

## Lưu ý

- Luôn activate venv trước, kiểm tra bằng `which python` — phải trỏ vào
  `genai-shopai-be/myenv`
- Cần DB (Supabase/Postgres) — chưa điền `DB_*` trong `.env` thì server vẫn
  khởi động được nhưng gọi API sẽ lỗi
- Backend này phục vụ frontend `genai-shopai` (Next.js, cổng 3000) — muốn chạy
  đủ bộ thì mở backend trước, frontend sau, mỗi cái một terminal
- KHÔNG commit file `.env` lên git
