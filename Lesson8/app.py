import re
import streamlit as st

from langchain_community.document_loaders import YoutubeLoader
from langchain_community.document_loaders.youtube import TranscriptFormat

from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace


# -----------------------------
# Helpers
# -----------------------------
def is_youtube_url(url: str) -> bool:
    if not url:
        return False
    return bool(re.search(r"(youtube\.com/watch\?v=|youtu\.be/)", url))


def build_chat_model(hf_token: str, repo_id: str, max_new_tokens: int = 800):
    """
    Dùng Hugging Face Inference (provider auto) qua LangChain HuggingFaceEndpoint
    """

    llm = HuggingFaceEndpoint(
        repo_id=repo_id,
        task="text-generation",
        max_new_tokens=max_new_tokens,
        do_sample=True,
        huggingfacehub_api_token=hf_token,
    )

    return ChatHuggingFace(llm=llm)


def load_youtube_transcript(
    url: str,
    preferred_langs=None,
    translate_to=None,
    chunk_seconds: int = 180,
):
    """
    QUAN TRỌNG:
    - add_video_info=False để tránh pytube (hay lỗi HTTPError)
    - Transcript lấy qua youtube-transcript-api
    """
    loader = YoutubeLoader.from_youtube_url(
        url,
        add_video_info=False,
        language=preferred_langs or ["en"],
        translation=translate_to,
        transcript_format=TranscriptFormat.CHUNKS,
        chunk_size_seconds=chunk_seconds,
    )
    return loader.load()


def summarize_docs_map_reduce(chat_model, docs, output_language: str = "vi"):
    """
    Map-Reduce tóm tắt:
    - Map: tóm tắt từng chunk transcript
    - Reduce: tổng hợp thành bản tóm tắt cuối
    """
    chunk_summaries = []

    for i, d in enumerate(docs, start=1):
        chunk_text = (d.page_content or "").strip()
        if not chunk_text:
            continue

        prompt = f"""
Bạn là trợ lý tóm tắt nội dung video từ transcript.
Hãy tóm tắt chunk #{i} dưới đây ngắn gọn nhưng đủ ý bằng tiếng {output_language}.

YÊU CẦU:
- 5–8 gạch đầu dòng
- Giữ đúng nội dung transcript, không bịa
- Nếu có số liệu/thuật ngữ quan trọng thì nêu rõ

TRANSCRIPT CHUNK:
{chunk_text}
""".strip()

        resp = chat_model.invoke(prompt)
        # ChatHuggingFace trả về AIMessage -> dùng .content
        chunk_summaries.append((resp.content or "").strip())

    if not chunk_summaries:
        return "", []

    joined = "\n\n".join(
        [f"CHUNK SUMMARY {i}:\n{s}" for i, s in enumerate(chunk_summaries, start=1)]
    )

    final_prompt = f"""
Bạn là trợ lý tổng hợp tóm tắt video từ các tóm tắt từng phần.

Hãy tạo BẢN TÓM TẮT CUỐI CÙNG bằng tiếng {output_language} theo cấu trúc:

1) TL;DR (2–4 câu)
2) Ý chính (6–12 bullet)
3) Dàn ý theo mục (nếu phù hợp)
4) Điểm đáng chú ý (3–6 bullet)
5) (Tuỳ chọn) Việc cần làm / Bài học rút ra

Chỉ dùng thông tin từ chunk summary, không được bịa thêm.

DANH SÁCH CHUNK SUMMARY:
{joined}
""".strip()

    final_resp = chat_model.invoke(final_prompt)
    return (final_resp.content or "").strip(), chunk_summaries


# -----------------------------
# Streamlit UI
# -----------------------------
st.set_page_config(
    page_title="YouTube Summarizer (LangChain + Hugging Face)", layout="wide"
)
st.title("🎬 YouTube Summarizer — LangChain YoutubeLoader + Hugging Face")

with st.sidebar:
    st.subheader("1) Hugging Face API Key")
    hf_token = st.text_input("HF API Key", type="password", placeholder="hf_...")

    st.subheader("2) Chọn model (Hugging Face repo_id)")
    repo_id = st.text_input(
        "Model repo_id",
        value="Qwen/Qwen2.5-7B-Instruct",
        help="Ví dụ: Qwen/Qwen2.5-7B-Instruct",
    )

    st.subheader("3) Tuỳ chọn transcript")
    out_lang = st.selectbox("Ngôn ngữ output", ["vi", "en"], index=0)

    preferred_langs_raw = st.text_input(
        "Ưu tiên ngôn ngữ transcript (comma-separated)",
        value="vi,en",
        help="Ví dụ: vi,en hoặc en",
    )

    translate_to = st.selectbox(
        "Dịch transcript về (nếu hỗ trợ)", ["(không)", "vi", "en"], index=0
    )

    chunk_seconds = st.slider("Chunk size (giây)", 60, 600, 180, 30)

st.subheader("Nhập YouTube URL")
yt_url = st.text_input(
    "YouTube URL",
    placeholder="https://www.youtube.com/watch?v=... hoặc https://youtu.be/...",
)

run = st.button("🚀 Lấy transcript & Tóm tắt", type="primary")

st.caption(
    "Ghi chú: Nếu video không có subtitles/transcript public thì sẽ không load được transcript."
)

if run:
    if not hf_token:
        st.error("Bạn chưa nhập Hugging Face API key.")
        st.stop()

    if not is_youtube_url(yt_url):
        st.error(
            "URL không hợp lệ. Hãy dán link YouTube dạng youtube.com/watch?v=... hoặc youtu.be/..."
        )
        st.stop()

    preferred_langs = [x.strip() for x in preferred_langs_raw.split(",") if x.strip()]
    trans = None if translate_to == "(không)" else translate_to

    # 1) Load transcript
    try:
        with st.spinner("Đang tải transcript từ YouTube..."):
            docs = load_youtube_transcript(
                yt_url,
                preferred_langs=preferred_langs,
                translate_to=trans,
                chunk_seconds=int(chunk_seconds),
            )
    except Exception as e:
        st.error(
            "Không tải được transcript. Có thể video không có subtitles public hoặc bị giới hạn."
        )
        st.exception(e)
        st.stop()

    if not docs:
        st.error("Không có transcript để tóm tắt.")
        st.stop()

    st.success(f"Đã tải transcript! Số chunks: {len(docs)}")

    # 2) Summarize
    try:
        with st.spinner("Đang gọi Hugging Face model để tóm tắt..."):
            chat_model = build_chat_model(hf_token=hf_token, repo_id=repo_id)
            final_summary, chunk_summaries = summarize_docs_map_reduce(
                chat_model=chat_model,
                docs=docs,
                output_language=out_lang,
            )
    except Exception as e:
        st.error(
            "Gọi model tóm tắt bị lỗi (có thể do model không доступ/không được cấp quyền, hoặc token sai)."
        )
        st.exception(e)
        st.stop()

    # 3) UI output
    left, right = st.columns([1.2, 1], gap="large")

    with left:
        st.subheader("✅ Tóm tắt cuối cùng")
        st.write(final_summary if final_summary else "(Không tạo được tóm tắt)")

    with right:
        st.subheader("🧩 Tóm tắt từng chunk")
        for i, s in enumerate(chunk_summaries, start=1):
            with st.expander(f"Chunk #{i}"):
                st.write(s or "(rỗng)")

    with st.expander("📜 Transcript (ghép)"):
        full_text = "\n\n".join([d.page_content for d in docs if d.page_content])
        st.text_area("Transcript", value=full_text, height=350)
