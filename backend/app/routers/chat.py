import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from typing import cast, Optional, List

from ..models import User
from ..database import get_db, UserRole
from ..dependencies import get_current_active_user
from ..repositories import PatientRepository
from ..services import ChatService
from ..config import settings
import google.generativeai as genai

logger = logging.getLogger(__name__)

try:
    from google.generativeai.types import BlockedPromptException
except ImportError:
    BlockedPromptException = None

try:
    from google.generativeai.errors import GoogleGenerativeAIError
except ImportError:
    try:
        from google.generativeai.core.exceptions import GoogleGenerativeAIError
    except ImportError:
        GoogleGenerativeAIError = None

router = APIRouter()

# ── Configure Gemini ONCE at module level ──────────────────────────────
if settings.GOOGLE_API_KEY:
    try:
        genai.configure(api_key=settings.GOOGLE_API_KEY)
    except Exception:
        logger.warning("Failed to configure Google Generative AI at startup.")


# ── Request / Response schemas ─────────────────────────────────────────

class ChatMessageCreate(BaseModel):
    patient_id: int
    message: str


class GeneralChatMessageCreate(BaseModel):
    message: str
    context: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str


class ChatHistoryItem(BaseModel):
    chat_id: int
    role: str
    text: str
    timestamp: Optional[datetime] = None


# ── System prompts ─────────────────────────────────────────────────────

SYSTEM_PROMPT_PUBLIC = """\
Bạn là một trợ lý AI thông minh cho phòng khám. Bạn giúp bệnh nhân và khách hàng với:
1. Thông tin về phòng khám (giờ làm việc, dịch vụ, địa chỉ)
2. Hướng dẫn đặt lịch khám
3. Tư vấn triệu chứng cơ bản (nhưng luôn khuyên gặp bác sĩ tại phòng khám)
4. Câu hỏi thường gặp về sức khỏe

Thông tin phòng khám:
- Tên: Clinic
- Giờ làm việc: 9:00 - 12:00, 14:00 - 17:00 từ Thứ Hai đến Thứ Sáu
- Địa chỉ: 1 Đại Cồ Việt, Quận Hai Bà Trưng, Hà Nội
- Email: bachnhatminh0212@gmail.com
- Điện thoại: 0975082804
- Dịch vụ: Khám tổng quát, Khám chuyên khoa, Xét nghiệm, Chẩn đoán hình ảnh

Quy tắc:
- Trả lời bằng tiếng Việt
- Thân thiện và chuyên nghiệp
- Luôn khuyên gặp bác sĩ tại phòng khám cho vấn đề sức khỏe nghiêm trọng
- Sử dụng định dạng Markdown khi cần thiết"""


def _build_patient_system_prompt(patient_name: str) -> str:
    return f"""\
Bạn là trợ lý AI cá nhân cho bệnh nhân {patient_name} tại phòng khám.
Bạn có thể giúp:
1. Tư vấn về triệu chứng và sức khỏe cơ bản
2. Hướng dẫn chuẩn bị khám bệnh
3. Giải thích về quy trình khám
4. Cung cấp thông tin sau khám

Lưu ý: Bạn KHÔNG thay thế bác sĩ chuyên nghiệp.
Trả lời bằng tiếng Việt, thân thiện và dễ hiểu."""


def _build_staff_system_prompt(staff_role: str, staff_email: str,
                               patient_age, patient_gender, emr_summary: str) -> str:
    return f"""\
Bạn là một trợ lý AI y tế hữu ích làm việc cho một phòng khám.
Bạn đang hỗ trợ một cán bộ y tế ({staff_role} - {staff_email}). Trả lời bằng tiếng Việt.
Định dạng câu trả lời bằng Markdown.

Thông tin bệnh nhân:
- Tuổi: {patient_age}
- Giới tính: {patient_gender}
- Lịch sử bệnh án (EMR): {emr_summary if emr_summary.strip() else "Chưa có thông tin EMR."}

LƯU Ý: Bạn không thay thế bác sĩ chuyên nghiệp."""


# ── Helper: call Gemini with conversation history ──────────────────────

async def _chat_with_history(system_prompt: str, user_message: str,
                             history: list | None = None) -> str:
    """Create a Gemini ChatSession with optional prior history and send a message."""
    if not settings.GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="AI service is not available at the moment.")

    model = genai.GenerativeModel(
        model_name=settings.GEMINI_MODEL,
        system_instruction=system_prompt,
    )
    chat = model.start_chat(history=history or [])
    response = await chat.send_message_async(user_message)
    return response.text


# ── Endpoints ──────────────────────────────────────────────────────────

@router.post("/public", response_model=ChatResponse)
async def public_chat_message(chat_message: GeneralChatMessageCreate):
    """Public chatbot — no authentication, no history persistence."""
    try:
        reply = await _chat_with_history(SYSTEM_PROMPT_PUBLIC, chat_message.message)
        return ChatResponse(reply=reply)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Public chat error")
        raise HTTPException(
            status_code=500,
            detail="Xin lỗi, hiện tại hệ thống đang gặp sự cố. Vui lòng thử lại sau.",
        )


@router.post("/patient", response_model=ChatResponse)
async def patient_chat_message(
    chat_message: GeneralChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Patient chatbot — authenticated, with conversation memory."""
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="This endpoint is only available for patients.")

    user_id: int = cast(int, current_user.user_id)

    # 1. Save user message to DB
    ChatService.save_message(db, user_id, "user", chat_message.message)

    # 2. Build conversation history from DB
    history = ChatService.get_conversation_history(db, user_id, limit=20)
    # Remove the last entry (the message we just saved) — we'll send it via send_message instead
    if history and history[-1]["role"] == "user":
        history = history[:-1]

    # 3. Call Gemini with history
    system_prompt = _build_patient_system_prompt(current_user.full_name)
    try:
        reply = await _chat_with_history(system_prompt, chat_message.message, history)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Patient chat error")
        raise HTTPException(
            status_code=500,
            detail="Xin lỗi, hiện tại hệ thống đang gặp sự cố.",
        )

    # 4. Save AI reply to DB
    ChatService.save_message(db, user_id, "model", reply)

    return ChatResponse(reply=reply)


@router.post("/send", response_model=ChatResponse)
async def send_chat_message(
    chat_message: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Staff/Doctor chatbot — authenticated, with patient EMR context and conversation memory."""
    if current_user.role not in [UserRole.DOCTOR, UserRole.CLINIC_STAFF, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="User does not have permission to access this feature.")

    patient_instance = PatientRepository.get_by_id(db, chat_message.patient_id)
    if not patient_instance:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy bệnh nhân với ID {chat_message.patient_id}.")

    patient_id_for_update: int = cast(int, patient_instance.patient_id)
    current_emr_summary = str(getattr(patient_instance, "emr_summary", ""))
    emr_summary_for_prompt = current_emr_summary

    # Append staff note to EMR
    if chat_message.message and chat_message.message.strip():
        message_content = chat_message.message.strip()
        log_entry = (
            f"Lưu ý mới ({datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')} "
            f"bởi {current_user.email} [{current_user.role.value}]): {message_content}"
        )

        if current_emr_summary.strip():
            new_emr_summary = f"{current_emr_summary}\n\n{log_entry}"
        else:
            new_emr_summary = log_entry

        updated_patient = PatientRepository.update_emr(db, patient_id_for_update, new_emr_summary)
        if not updated_patient:
            raise HTTPException(
                status_code=500,
                detail=f"Không thể cập nhật EMR cho bệnh nhân ID {patient_id_for_update}.",
            )
        emr_summary_for_prompt = new_emr_summary

    user_id: int = cast(int, current_user.user_id)

    # Save user message to DB
    ChatService.save_message(db, user_id, "user", chat_message.message)

    # Build conversation history
    history = ChatService.get_conversation_history(db, user_id, limit=20)
    if history and history[-1]["role"] == "user":
        history = history[:-1]

    # Build system prompt with patient EMR context
    system_prompt = _build_staff_system_prompt(
        staff_role=current_user.role.value,
        staff_email=current_user.email,
        patient_age=getattr(patient_instance, "age", "N/A"),
        patient_gender=getattr(patient_instance, "gender", "N/A"),
        emr_summary=emr_summary_for_prompt,
    )

    user_msg = chat_message.message.strip() if chat_message.message and chat_message.message.strip() else "Vui lòng xem lại EMR."

    try:
        reply = await _chat_with_history(system_prompt, user_msg, history)
    except Exception as e:
        if BlockedPromptException and isinstance(e, BlockedPromptException):
            raise HTTPException(status_code=400, detail="Yêu cầu bị chặn bởi chính sách nội dung.")
        if GoogleGenerativeAIError and isinstance(e, GoogleGenerativeAIError):
            error_str = str(e).lower()
            if "quota" in error_str or "resource_exhausted" in error_str:
                raise HTTPException(status_code=429, detail="Đã đạt giới hạn yêu cầu cho dịch vụ AI.")
            raise HTTPException(status_code=500, detail=f"Lỗi dịch vụ AI: {e}")
        logger.exception("Staff chat error")
        raise HTTPException(status_code=500, detail=f"Lỗi không xác định: {type(e).__name__}")

    # Save AI reply to DB
    ChatService.save_message(db, user_id, "model", reply)

    return ChatResponse(reply=reply)


@router.get("/history", response_model=List[ChatHistoryItem])
async def get_chat_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return the authenticated user's chat history, newest first."""
    user_id: int = cast(int, current_user.user_id)
    messages = ChatService.get_history(db, user_id, skip=skip, limit=limit)
    return [
        ChatHistoryItem(
            chat_id=msg.chat_id,
            role=msg.role or "user",
            text=msg.chat_message,
            timestamp=msg.time_stamp,
        )
        for msg in messages
    ]
