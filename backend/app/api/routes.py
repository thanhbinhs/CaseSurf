from fastapi import APIRouter, HTTPException, status
# Giả sử các file trên nằm trong cùng thư mục app
from app.models.promt import ImprovementRequest, ProductRequest, Report, TiktokDataResponse
from app.services.service import n8nService
import httpx

router = APIRouter()
# Tạo một instance của service để tái sử dụng
service = n8nService()

@router.post("/report", response_model=Report, status_code=status.HTTP_200_OK)
async def create_report(request_data: ProductRequest) -> Report:
    """
    Endpoint để tạo báo cáo nghiên cứu cho một sản phẩm.
    """
    try:
        # 1. Gọi service để lấy nội dung báo cáo (dạng string)
        report_text = await service.generate_report(
            product=request_data.product,
            userId=request_data.userId)

        # 2. Đóng gói nội dung vào model `Report` và trả về
        return Report(text=report_text)

    except httpx.HTTPStatusError as e:
        # Lỗi từ phía API của n8n (ví dụ: 4xx, 5xx)
        print(f"Lỗi HTTP từ n8n: {e.response.status_code} - {e.response.text}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Dịch vụ bên ngoài trả về lỗi: {e.response.status_code}"
        )
    except httpx.RequestError as e:
        # Lỗi kết nối mạng (ví dụ: timeout, không thể kết nối)
        print(f"Lỗi kết nối đến n8n: {e}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Không thể kết nối đến dịch vụ tạo báo cáo."
        )
    except Exception as e:
        # Các lỗi khác không mong muốn
        print(f"Lỗi không xác định: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/improvement-script", response_model=str, status_code=status.HTTP_200_OK)
async def create_improvement_script(request_data: ImprovementRequest) -> str:
    """
    Endpoint để tạo kịch bản cải tiến dựa trên báo cáo gốc và các yếu tố cải tiến.
    """
    print("Nhận request tạo kịch bản cải tiến:", request_data)

    try:
        script_text = await service.generate_script(
            base_text=request_data.base_text,
            improvements=request_data.improvements,
            is_iterative=request_data.is_iterative  # <<< Truyền cờ đi
        )
        
        return script_text

    except httpx.HTTPStatusError as e:
        print(f"Lỗi HTTP từ n8n: {e.response.status_code} - {e.response.text}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Dịch vụ bên ngoài trả về lỗi: {e.response.status_code}"
        )
    except httpx.RequestError as e:
        print(f"Lỗi kết nối đến n8n: {e}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Không thể kết nối đến dịch vụ tạo kịch bản."
        )
    except Exception as e:
        print(f"Lỗi không xác định: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    
@router.get("/tiktok_data", response_model=TiktokDataResponse, status_code=status.HTTP_200_OK)
async def get_tiktok_data() -> TiktokDataResponse:
    """
    Endpoint để lấy dữ liệu TikTok.
    """
    # Giả lập dữ liệu TikTok
    try:
        tiktok_data = await service.get_tiktok_data()
        return TiktokDataResponse(tiktok=tiktok_data)

    except httpx.HTTPStatusError as e:
        print(f"Lỗi HTTP từ n8n: {e.response.status_code} - {e.response.text}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Dịch vụ bên ngoài trả về lỗi: {e.response.status_code}"
        )
    except httpx.RequestError as e:
        print(f"Lỗi kết nối đến n8n: {e}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Không thể kết nối đến dịch vụ lấy dữ liệu TikTok."
        )
    except Exception as e:
        print(f"Lỗi không xác định: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )