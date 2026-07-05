import os
import re
import uuid
from dotenv import load_dotenv
from openai import OpenAI

from app.schemas.chat import ChatMode, ChatMessage, ChatRequest, ChatResponse
from app.services import data_service

load_dotenv()

MODEL_NAME = os.getenv("OPENAI_MODEL", "gpt-5-mini")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None
conversation_store: dict[str, list[ChatMessage]] = {}


def compact_catalog(products: list[dict]) -> str:
    lines = []
    for product in products:
        variants = ", ".join(product["variants"])
        lines.append(
            f'{product["id"]}: {product["name"]} | {product["category"]} | '
            f'{product["price"]:,} VND | stock {product["stock"]} | variants: {variants} | '
            f'tags: {", ".join(product["tags"])}'
        )
    return "\n".join(lines)


def compact_faqs(faqs: list[dict]) -> str:
    return "\n".join(f'- {faq["question"]}: {faq["answer"]}' for faq in faqs)


def compact_orders(orders: list[dict]) -> str:
    lines = []
    for order in orders:
        items = ", ".join(f'{item["product_name"]} x{item["quantity"]}' for item in order["items"])
        lines.append(f'{order["id"]}: {order["status"]}; items: {items}; total: {order["total_amount"]:,} VND')
    return "\n".join(lines)


def build_system_prompt() -> str:
    # Bạn code ở đây
    products = data_service.list_products()
    faqs = data_service.list_faqs()
    orders = data_service.list_orders()

    system_prompt = f"""
    Bạn là AI chăm sóc khách hàng của ShopAI, một sàn thương mại điện tử demo.
    Trả lời bằng tiếng Việt, ngắn gọn, thân thiện, ưu tiên thông tin từ catalog, FAQ và orders dưới đây.
    Nếu khách hỏi mơ hồ, hãy hỏi lại một câu rõ ràng. Nếu có thể, gợi ý tối đa 3 sản phẩm phù hợp.
    
    CATAlOG:
    {compact_catalog(products)}

    FAQS:
    {compact_faqs(faqs)}

    ORDERS:
    {compact_orders(orders)}
    """

    return system_prompt


def normalize(text: str) -> str:
    return text.lower().strip()


def find_products(message: str, products: list[dict]):
    normalized = normalize(message)
    matched = []
    for product in products:
        haystack = " ".join(
            [
                product["id"],
                product["name"],
                product["slug"],
                product["category"],
                " ".join(product["tags"]),
            ]
        ).lower()
        if any(token in haystack for token in normalized.split() if len(token) >= 3):
            matched.append(product)
    return matched[:3]


def find_last_product(messages: list[ChatMessage], products: list[dict]):
    for message in reversed(messages):
        for product in products:
            if product["name"].lower() in message.content.lower() or product["id"].lower() in message.content.lower():
                return product
    return None


def find_budget(message: str):
    normalized = normalize(message).replace(".", "").replace(",", "")
    match = re.search(r"duoi\s*(\d+)\s*k|dưới\s*(\d+)\s*k", normalized)
    if match:
        amount = int(next(group for group in match.groups() if group)) * 1000
        return amount

    match = re.search(r"(\d{5,9})\s*(vnd|đ|dong|đồng)?", normalized)
    if match:
        return int(match.group(1))

    return None


def format_price(price: int) -> str:
    return f"{price:,}".replace(",", ".") + "đ"


def fallback_reply(message: str, mode: ChatMode, history: list[ChatMessage]) -> str:
    normalized = normalize(message)
    products = data_service.list_products()
    order_match = re.search(r"od\d{4}", normalized)
    if order_match:
        order = data_service.get_order(order_match.group(0).upper())
        if order:
            items = ", ".join(f'{item["product_name"]} x{item["quantity"]}' for item in order["items"])
            return (
                f'Đơn {order["id"]} hiện đang ở trạng thái "{order["status"]}". '
                f"Sản phẩm gồm: {items}. Tổng tiền {format_price(order['total_amount'])}."
            )
        return "Mình chưa tìm thấy mã đơn này trong dữ liệu demo. Bạn kiểm tra lại giúp mình nhé."

    if any(keyword in normalized for keyword in ["giao", "ship", "vận chuyển"]):
        return "Shop giao nội thành 1-2 ngày, tỉnh thành khác 2-5 ngày. Đơn từ 499.000đ được miễn phí vận chuyển tiêu chuẩn."

    if any(keyword in normalized for keyword in ["đổi", "trả", "hoàn"]):
        return "Bạn có thể đổi trả trong 7 ngày nếu sản phẩm lỗi, sai mẫu hoặc còn nguyên tem nhãn."

    if any(keyword in normalized for keyword in ["bảo hành", "bao hanh"]):
        last_product = find_last_product(history, products) if mode == ChatMode.WITH_CONTEXT else None
        if last_product and last_product["category"] == "Điện tử":
            return f'{last_product["name"]} thuộc nhóm điện tử, thời gian bảo hành demo là 6-12 tháng tùy lỗi.'
        return "Sản phẩm điện tử được bảo hành 6-12 tháng. Các nhóm thời trang/gia dụng hỗ trợ đổi trả theo chính sách 7 ngày."

    direct_matches = find_products(message, products)
    budget = find_budget(message)

    if budget:
        product_matches = [
            product
            for product in products
            if product["price"] <= budget and any(keyword in normalize(product["name"] + " " + " ".join(product["tags"])) for keyword in normalized.split())
        ]
        if not product_matches:
            product_matches = [product for product in products if product["price"] <= budget]
        suggestions = product_matches[:3]
        if suggestions:
            lines = [
                f'- {product["name"]}: {format_price(product["price"])}; còn {product["stock"]} sản phẩm; màu/phiên bản: {", ".join(product["variants"])}'
                for product in suggestions
            ]
            return "Mình gợi ý vài sản phẩm hợp ngân sách của bạn:\n" + "\n".join(lines)

    if any(keyword in normalized for keyword in ["cái đó", "san pham do", "sản phẩm đó", "màu đen", "còn hàng", "giá bao nhiêu"]):
        last_product = find_last_product(history, products) if mode == ChatMode.WITH_CONTEXT else None
        if last_product:
            black_stock = "có màu Đen" if "Đen" in last_product["variants"] else "không có màu Đen trong dữ liệu demo"
            return (
                f'Bạn đang hỏi {last_product["name"]}. Sản phẩm này giá {format_price(last_product["price"])}, '
                f'còn {last_product["stock"]} sản phẩm và {black_stock}.'
            )
        return "Bạn đang hỏi sản phẩm nào vậy? Bạn gửi tên sản phẩm hoặc mã sản phẩm giúp mình nhé."

    if direct_matches:
        lines = [
            f'- {product["name"]}: {format_price(product["price"])}; rating {product["rating"]}; còn {product["stock"]} sản phẩm'
            for product in direct_matches
        ]
        return "Mình tìm thấy các sản phẩm liên quan:\n" + "\n".join(lines)

    return "Mình có thể hỗ trợ tìm sản phẩm, tư vấn theo ngân sách, tra mã đơn OD1001/OD1002/OD1003, hoặc giải đáp giao hàng, đổi trả, bảo hành."


def call_openai(message: str, mode: ChatMode, history: list[ChatMessage]) -> str | None:
    # Bạn code ở đây
    chat_history = history if mode == ChatMode.WITH_CONTEXT else []
    messages = [{"role": "system", "content": build_system_prompt()}]
    messages.extend([{"role": "user", "content": msg.content} for msg in chat_history]) # list comprehension 
    messages.append({"role": "user", "content": message})

    response = client.chat.completions.create(
        model="gpt-5-mini",
        messages=messages
    )
    return response.choices[0].message.content


def handle_chat(payload: ChatRequest) -> ChatResponse:
    # Bạn code ở đây
    conversation_id = payload.conversation_id or str(uuid.uuid4())
    existing_messages = conversation_store.setdefault(conversation_id, [])
    history_for_model = existing_messages if payload.mode == ChatMode.WITH_CONTEXT else []

    reply = call_openai(payload.message, payload.mode, history_for_model)
    if not reply:
        reply = fallback_reply(payload.message, payload.mode, history_for_model)

    existing_messages.append(ChatMessage(role="user", content=payload.message))
    existing_messages.append(ChatMessage(role="assistant", content=reply))

    return ChatResponse(
        conversation_id=conversation_id,
        mode=payload.mode,
        reply=reply,
        used_context=payload.mode == ChatMode.WITH_CONTEXT,
        messages=existing_messages,
    )
