# Cài thư viện từ file requirements

## Câu lệnh

```bash
python -m pip install -r requirements.txt
```

> ⚠️ Chạy lệnh này **sau khi đã kích hoạt môi trường ảo** (`source myenv/bin/activate`), để thư viện chỉ cài riêng cho dự án.

---

## Giải thích từng phần

| Phần | Ý nghĩa |
|---|---|
| `python -m pip` | Gọi module `pip` bằng đúng Python đang hoạt động (tránh gọi nhầm pip khác) |
| `install` | Cài đặt thư viện |
| `-r requirements.txt` | Đọc danh sách thư viện trong file rồi cài **tất cả** cùng lúc |

---

## Mục đích

Cài đặt **tự động toàn bộ** các thư viện (dependencies) mà dự án cần, dựa theo danh sách ghi sẵn trong file — thay vì gõ `pip install` từng cái một.

---

## Ví dụ nội dung file `requirements.txt`

```
openai
streamlit
python-dotenv
```

- Mỗi thư viện một dòng.
- Có thể ghi rõ phiên bản bằng `==`, ví dụ `openai==1.0.0`.

> Đây chính là nội dung file `requirements.txt` của dự án này.

---

## Cài một thư viện cụ thể

Khi chỉ muốn cài **một (vài) thư viện** thì dùng `pip install <tên>` (không cần `-r`):

```bash
pip install openai                 # cài phiên bản mới nhất
pip install openai==1.30.0         # cài đúng 1 phiên bản
pip install "openai>=1.0,<2.0"     # cài trong khoảng phiên bản
pip install openai streamlit       # cài nhiều thư viện cùng lúc
pip install --upgrade openai       # nâng cấp lên bản mới nhất
```

> ⚠️ Nhớ **activate môi trường ảo trước** (`source myenv/bin/activate`).

**Sau khi cài thư viện mới, nên cập nhật lại file danh sách** (bước hay bị quên):

```bash
pip freeze > requirements.txt
```

Lệnh này ghi lại toàn bộ thư viện hiện có kèm đúng phiên bản, để người khác cài lại giống hệt.

### Bảng lệnh nhanh

| Việc | Lệnh |
|---|---|
| Cài 1 thư viện | `pip install <tên>` |
| Cài đúng phiên bản | `pip install <tên>==<phiên bản>` |
| Nâng cấp | `pip install --upgrade <tên>` |
| Gỡ bỏ | `pip uninstall <tên>` |
| Lưu lại danh sách | `pip freeze > requirements.txt` |

---

## Lưu ý

- Tên file chuẩn theo quy ước thường là `requirements.txt` (có chữ "s"). Tên nào cũng chạy được, chỉ cần tên trong lệnh khớp với tên file thật.
- Nếu file rỗng thì lệnh sẽ không cài gì cả.
- Tạo file danh sách từ môi trường hiện tại: `pip freeze > requirements.txt`.
