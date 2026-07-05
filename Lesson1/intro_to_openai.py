import os

from dotenv import load_dotenv
from openai import OpenAI

# Đọc biến môi trường từ file .env (không commit .env lên git)
load_dotenv()

# Khởi tạo client OpenAI (lấy API key từ biến môi trường OPENAI_API_KEY)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

user_question = input("Nhập câu hỏi của bạn: ")
response = client.chat.completions.create(
    model="gpt-5-mini",
    # bên trong messages, vừa gửi đi req của user, vừa được dùng với mục đích liên quan lưu trữ ngữ cảnh chat
    messages=[
        {"role": "system", "content": "Đây là một trợ lý AI"},
        {"role": "user", "content": user_question},
    ],
)

# In ra câu trả lời từ AI
# print("Response gốc", response)
print("\nTrả lời từ AI:", response.choices[0].message.content)