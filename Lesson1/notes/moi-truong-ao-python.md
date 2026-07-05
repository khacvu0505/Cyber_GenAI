# Môi trường ảo (Virtual Environment) trong Python

## Môi trường ảo là gì?

Môi trường ảo là một không gian Python **độc lập** cho từng dự án. Mỗi dự án có bản Python và bộ thư viện riêng, không ảnh hưởng lẫn nhau và không ảnh hưởng tới Python cài trên hệ thống.

**Lợi ích:**
- Mỗi dự án dùng phiên bản thư viện khác nhau mà không xung đột.
- Dễ chia sẻ danh sách thư viện qua `requirements.txt`.
- Giữ Python hệ thống sạch sẽ.

---

## 1. Tạo môi trường ảo

```bash
python3 -m venv myenv
```

- `myenv` là **tên thư mục** chứa môi trường ảo (có thể đặt tên khác như `venv`, `env`, `.venv`).
- Lệnh này tạo thư mục chứa bản Python riêng và nơi cài thư viện.

---

## 2. Kích hoạt (activate) môi trường ảo

**macOS / Linux (zsh, bash):**

```bash
source myenv/bin/activate
```

**Windows:**
- CMD: `myenv\Scripts\activate.bat`
- PowerShell: `myenv\Scripts\Activate.ps1`

Sau khi kích hoạt, dấu nhắc terminal sẽ có tiền tố `(myenv)`:

```
(myenv) ➜  Lesson1
```

---

## 3. Cài và quản lý thư viện

```bash
pip install requests              # cài 1 thư viện
pip install requests==2.31.0      # cài đúng phiên bản
pip list                          # xem thư viện đã cài
pip freeze > requirements.txt     # lưu danh sách thư viện
pip install -r requirements.txt   # cài lại từ file danh sách
```

---

## 4. Thoát khỏi môi trường ảo

```bash
deactivate
```

---

## Bảng tóm tắt lệnh

| Việc cần làm | Lệnh |
|---|---|
| Tạo môi trường | `python3 -m venv myenv` |
| Kích hoạt (macOS/Linux) | `source myenv/bin/activate` |
| Kích hoạt (Windows PowerShell) | `myenv\Scripts\Activate.ps1` |
| Cài thư viện | `pip install <tên>` |
| Xem thư viện đã cài | `pip list` |
| Lưu danh sách thư viện | `pip freeze > requirements.txt` |
| Cài lại từ file | `pip install -r requirements.txt` |
| Thoát | `deactivate` |

---

## Lưu ý quan trọng

- **Không** đưa thư mục môi trường ảo lên git. Thêm vào file `.gitignore`:

  ```gitignore
  myenv/
  venv/
  .venv/
  ```

- Chỉ commit file `requirements.txt`, người khác sẽ tự cài lại bằng `pip install -r requirements.txt`.
- Kiểm tra đang dùng đúng Python của môi trường ảo:

  ```bash
  which python    # macOS/Linux
  ```
