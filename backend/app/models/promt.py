from pydantic_settings import BaseSettings
from pydantic import BaseModel
from typing import List

class ProductRequest(BaseSettings):
    product: str
    userId: str  # Thêm userId để xác định người dùng


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
    product_type: str | None = None  # Thêm trường product_type để xác định loại sản phẩm
    script_framework: str | None = None  # Thêm trường script_framework để xác định khung kịch bản
    title: str | None = None  # Thêm trường title để xác định tiêu đề
    title1: str | None = None  # Thêm trường title1 để xác định tiêu đề phụ
    title2: str | None = None  # Thêm trường title2 để xác định tiêu đề phụ

class TiktokDataResponse(BaseModel):
    """
    Response model cho dữ liệu TikTok.
    """
    tiktok: List[TiktokData]

class KeywordResponse(BaseModel):
    keyword: str
    count: int

class CombinedReportResponse(BaseModel):
    report_text: str
    video_data: TiktokData # Sử dụng lại model TiktokData đã có