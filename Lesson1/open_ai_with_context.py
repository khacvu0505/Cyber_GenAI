from openai import OpenAI
import os
from dotenv import load_dotenv
import streamlit as st
import json
from pathlib import Path

# Tải các biến môi trường từ file .env
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

MODEL_NAME = "gpt-5-mini"
SYSTEM_PROMPT = "Bạn là một trợ lý AI hữu ích."
CHAT_HISTORY_FILE = Path(__file__).with_name("chat_history.json")
VALID_CHAT_ROLES = {"user", "assistant"}


def build_messages(chat_history):
    # Bạn code ở đây
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for message in chat_history:
        if message["role"] in VALID_CHAT_ROLES:
            messages.append({"role": message["role"], "content": message["content"]})
    return messages


# Hàm xử lý câu hỏi của user
def generate_bot_response(chat_history):
    # Bạn code ở đây
    try:
        response = client.chat.completions.create(
            model="gpt-5-mini",
            messages=build_messages(chat_history),
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Đã xảy ra lỗi: {str(e)}"


def save_chat_history():
    # Bạn code ở đây
    with CHAT_HISTORY_FILE.open("w", encoding="utf-8") as f:
        json.dump(st.session_state.chat_history, f, ensure_ascii=False, indent=2) # ensure ascii=False để lưu tiếng Việt đúng định dạng, indent=2 để dễ đọc



def load_chat_history():
    # Bạn code ở đây
    try:
        if CHAT_HISTORY_FILE.exists():
            with CHAT_HISTORY_FILE.open("r", encoding="utf-8") as f:
                return json.load(f)
        return []
    except Exception as e:
        st.error(f"Đã xảy ra lỗi khi tải lịch sử chat: {str(e)}")
        return []


st.set_page_config(layout="wide")

# Khởi tạo session state cho chat history
if "chat_history" not in st.session_state:
    st.session_state.chat_history = load_chat_history()

# Thiết lập title
st.title("ChatGPT Clone bot")

# Hiển thị lịch sử chat
for message in st.session_state.chat_history:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

prompt = st.chat_input("Nhập câu hỏi của bạn...")

if prompt:
    st.session_state.chat_history.append({"role": "user", "content": prompt})
    save_chat_history()

    with st.chat_message("user"):
        st.markdown(prompt)

    # Lấy phản hồi từ chatbot
    response = generate_bot_response(st.session_state.chat_history)

    with st.chat_message("assistant"):
        st.markdown(response)

    st.session_state.chat_history.append({"role": "assistant", "content": response})
    save_chat_history()


if st.button("Xoá lịch sử chat"):
    st.session_state.chat_history = []
    if CHAT_HISTORY_FILE.exists():
        CHAT_HISTORY_FILE.unlink()
    st.rerun()
