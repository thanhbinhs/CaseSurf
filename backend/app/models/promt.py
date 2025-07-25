from pydantic_settings import BaseSettings
from pydantic import BaseModel
from typing import List

class ProductRequest(BaseSettings):
    product: str
    userId: str  # Thêm userId để xác định người dùng

class Report(BaseSettings):
    text: str
class ImprovementRequest(BaseModel):
    base_text: str  # Đổi tên cho rõ ràng
    improvements: List[str]
    is_iterative: bool = False # Mặc định là false để tương thích ngược

class TiktokData(BaseModel):
    url_tiktok: str  # <-- TÊN TRƯỜNG GÂY LỖI
    description: str | None = None
    click: int | None = None
    tym: int | None = None
    userId: str | None = None  # Thêm trường userId để xác định người dùng
    niche: str | None = None  # Thêm trường niche để xác định ngách
    content_angle: str | None = None  # Thêm trường content_angle để xác định góc nội dung
    hook_type: str | None = None  # Thêm trường hook_type để xác định loại hook
    cta_type: str | None = None  # Thêm trường cta_type để xác định loại CTA
    trust_tactic: str | None = None  # Thêm trường trust_tactic để xác định chiến thuật tin cậy
    product_type: str | None = None  # Thêm trường product_type để xác định loại sản phẩm

class TiktokDataResponse(BaseModel):
    """
    Response model cho dữ liệu TikTok.
    """
    tiktok: List[TiktokData]

class KeywordResponse(BaseModel):
    keyword: str
    count: int
