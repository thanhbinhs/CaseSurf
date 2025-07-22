from pydantic_settings import BaseSettings
from pydantic import BaseModel
from typing import List

class ProductRequest(BaseSettings):
    product: str

class Report(BaseSettings):
    text: str
class ImprovementRequest(BaseModel):
    """
    Model cho request tạo kịch bản cải tiến.
    Chứa báo cáo gốc và danh sách các yếu tố người dùng đã chọn để cải thiện.
    """
    original_report: str
    improvements: List[str] # Ví dụ: ["hook", "cta"]

class TiktokData(BaseModel):
    id: int
    url_tiktok: str  # <-- TÊN TRƯỜNG GÂY LỖI
    description: str | None = None
    keyword: List[str] | None = None
    click: int | None = None
    tym: int | None = None

class TiktokDataResponse(BaseModel):
    """
    Response model cho dữ liệu TikTok.
    """
    tiktok: List[TiktokData]