from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from typing import cast, Optional

from ..models import User
from ..database import get_db, UserRole
from ..dependencies import get_current_active_user
from ..repositories import PatientRepository
from ..config import settings
import google.generativeai as genai

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

try:
    if settings.GOOGLE_API_KEY:
        genai.configure(api_key=settings.GOOGLE_API_KEY)
except Exception:
    pass


class ChatMessageCreate(BaseModel):
    patient_id: int
    message: str


class GeneralChatMessageCreate(BaseModel):
    message: str
    context: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str


@router.post("/public", response_model=ChatResponse)
async def public_chat_message(chat_message: GeneralChatMessageCreate):
    if not settings.GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="AI service is not available at the moment.")

    try:
        genai.configure(api_key=settings.GOOGLE_API_KEY)
    except Exception:
        raise HTTPException(status_code=500, detail="AI service configuration failed.")

    prompt = f"""
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
    - Sử dụng định dạng Markdown khi cần thiết

    Câu hỏi: "{chat_message.message}"
    """

    try:
        model = genai.GenerativeModel(model_name="gemma-3-27b-it")
        response = await model.generate_content_async(prompt)
        return ChatResponse(reply=response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Xin lỗi, hiện tại hệ thống đang gặp sự cố. Vui lòng thử lại sau.")


@router.post("/patient", response_model=ChatResponse)
async def patient_chat_message(
    chat_message: GeneralChatMessageCreate,
    current_user: User = Depends(get_current_active_user),
):
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="This endpoint is only available for patients.")

    if not settings.GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="AI service is not available at the moment.")

    genai.configure(api_key=settings.GOOGLE_API_KEY)

    prompt = f"""
    Bạn là trợ lý AI cá nhân cho bệnh nhân {current_user.full_name} tại phòng khám.
    Bạn có thể giúp:
    1. Tư vấn về triệu chứng và sức khỏe cơ bản
    2. Hướng dẫn chuẩn bị khám bệnh
    3. Giải thích về quy trình khám
    4. Cung cấp thông tin sau khám

    Lưu ý: Bạn KHÔNG thay thế bác sĩ chuyên nghiệp.
    Trả lời bằng tiếng Việt, thân thiện và dễ hiểu.

    Câu hỏi: "{chat_message.message}"
    """

    try:
        model = genai.GenerativeModel(model_name="gemma-3-27b-it")
        response = await model.generate_content_async(prompt)
        return ChatResponse(reply=response.text)
    except Exception:
        raise HTTPException(status_code=500, detail="Xin lỗi, hiện tại hệ thống đang gặp sự cố.")


@router.post("/send", response_model=ChatResponse)
async def send_chat_message(
    chat_message: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.role not in [UserRole.DOCTOR, UserRole.CLINIC_STAFF, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="User does not have permission to access this feature.")

    patient_instance = PatientRepository.get_by_id(db, chat_message.patient_id)
    if not patient_instance:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy bệnh nhân với ID {chat_message.patient_id}.")

    patient_id_for_update: int = cast(int, patient_instance.patient_id)
    current_emr_summary = str(getattr(patient_instance, "emr_summary", ""))
    emr_summary_for_prompt = current_emr_summary

    if chat_message.message and chat_message.message.strip():
        message_content = chat_message.message.strip()
        log_entry = f"Lưu ý mới ({datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')} bởi {current_user.email} [{current_user.role.value}]): {message_content}"

        if current_emr_summary.strip():
            new_emr_summary = f"{current_emr_summary}\n\n{log_entry}"
        else:
            new_emr_summary = log_entry

        updated_patient = PatientRepository.update_emr(db, patient_id_for_update, new_emr_summary)
        if not updated_patient:
            raise HTTPException(status_code=500, detail=f"Không thể cập nhật EMR cho bệnh nhân ID {patient_id_for_update}.")
        emr_summary_for_prompt = new_emr_summary

    prompt = f"""
    Bạn là một trợ lý AI y tế hữu ích làm việc cho một phòng khám.
    Bạn đang hỗ trợ một cán bộ y tế ({current_user.role.value} - {current_user.email}). Trả lời bằng tiếng Việt.
    Định dạng câu trả lời bằng Markdown.

    Thông tin bệnh nhân:
    - Tuổi: {getattr(patient_instance, 'age', 'N/A')}
    - Giới tính: {getattr(patient_instance, 'gender', 'N/A')}
    - Lịch sử bệnh án (EMR): {emr_summary_for_prompt if emr_summary_for_prompt.strip() else "Chưa có thông tin EMR."}

    Cán bộ nói: "{chat_message.message.strip() if chat_message.message and chat_message.message.strip() else 'Vui lòng xem lại EMR.'}"

    LƯU Ý: Bạn không thay thế bác sĩ chuyên nghiệp.
    """

    if not settings.GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="GOOGLE_API_KEY is not set.")

    try:
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        model = genai.GenerativeModel(model_name="gemma-3-27b-it")
        response = await model.generate_content_async(prompt)
        ai_reply = response.text
    except Exception as e:
        if BlockedPromptException and isinstance(e, BlockedPromptException):
            raise HTTPException(status_code=400, detail="Yêu cầu bị chặn bởi chính sách nội dung.")
        if GoogleGenerativeAIError and isinstance(e, GoogleGenerativeAIError):
            error_str = str(e).lower()
            if "quota" in error_str or "resource_exhausted" in error_str:
                raise HTTPException(status_code=429, detail="Đã đạt giới hạn yêu cầu cho dịch vụ AI.")
            raise HTTPException(status_code=500, detail=f"Lỗi dịch vụ AI: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi không xác định: {type(e).__name__}")

    return ChatResponse(reply=ai_reply)


@router.get("/history")
async def get_chat_history_placeholder():
    return {"history": [], "message": "Chat history placeholder - to be implemented if needed"}
