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
    keyword: List[str] | None = None
    click: int | None = None
    tym: int | None = None
    userId: str | None = None  # Thêm trường userId để xác định người dùng

class TiktokDataResponse(BaseModel):
    """
    Response model cho dữ liệu TikTok.
    """
    tiktok: List[TiktokData]

class KeywordResponse(BaseModel):
    keyword: str
    count: int