import os
import json
import time
from typing import Counter, List
from webbrowser import get

import urllib
from app.services.service import n8nService
from fastapi import APIRouter, HTTPException, status, Query
# Giả sử các file trên nằm trong cùng thư mục app
from app.models.promt import CombinedReportResponse, ImprovementRequest, ProductRequest,TiktokData, TiktokDataResponse, KeywordResponse
import httpx
import mysql.connector
from mysql.connector import Error
import asyncio

router = APIRouter()
# Tạo một instance của service để tái sử dụng
service = n8nService()

def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host=os.getenv("HOSTNAME"),
            database=os.getenv("DB_HOST"),
            user=os.getenv("USERNAME"),
            password=os.getenv("PASSWORD")
        )
        if connection.is_connected():
            return connection
    except Error as e:
        raise HTTPException(status_code=500, detail="Không thể kết nối đến cơ sở dữ liệu.")
    return None

@router.post("/report", response_model=CombinedReportResponse, status_code=status.HTTP_200_OK)
async def create_report(request_data: ProductRequest) -> CombinedReportResponse:
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Bước 1: Kiểm tra xem báo cáo đã hoàn thành và tồn tại trong DB chưa
        query = "SELECT * FROM tiktok_info WHERE url_tiktok = %s AND status = 'completed'"
        cursor.execute(query, (request_data.product,))
        existing_video_data = cursor.fetchone()

        # Nếu có, và đã có description (báo cáo), trả về ngay
        if existing_video_data and existing_video_data.get('description'):
            print(f"Báo cáo và dữ liệu cho {request_data.product} đã tồn tại. Trả về từ DB.")
            
            # Chuyển đổi chuỗi JSON 'keyword' thành danh sách nếu có
            if existing_video_data.get('keyword') and isinstance(existing_video_data['keyword'], str):
                try:
                    existing_video_data['keyword'] = json.loads(existing_video_data['keyword'])
                except json.JSONDecodeError:
                    existing_video_data['keyword'] = []
            
            return CombinedReportResponse(
                report_text=existing_video_data['description'],
                video_data=TiktokData(**existing_video_data)
            )

        # Bước 2: Nếu chưa có, gọi service n8n
        print(f"Đang tạo báo cáo cho {request_data.product}...")
        
        # --- SỬA LỖI: Xử lý đúng cấu trúc dữ liệu trả về từ service ---
        # service.generate_report giờ trả về một danh sách các dictionary
        n8n_result_list = await service.generate_report(
            product=request_data.product,
            userId=request_data.userId
        )

        # Kiểm tra xem danh sách có hợp lệ không
        if not n8n_result_list or len(n8n_result_list) == 0:
            raise HTTPException(status_code=500, detail="Phản hồi từ n8n không hợp lệ hoặc rỗng.")

        # Lấy đối tượng đầu tiên từ danh sách
        n8n_data_dict = n8n_result_list[0]
        
        report_text = n8n_data_dict.get('text')
        if not report_text:
            raise HTTPException(status_code=500, detail="Không tìm thấy nội dung báo cáo trong phản hồi từ n8n.")

        # Bước 3: Tạo đối tượng TiktokData từ kết quả của n8n
        # Đảm bảo các trường bắt buộc như url_tiktok và userId được cung cấp
        video_data_obj = TiktokData(
            url_tiktok=request_data.product,
            userId=request_data.userId,
            description=report_text, # Gán description từ report_text
            **n8n_data_dict # Giải nén các trường còn lại từ n8n
        )

        # Lưu ý: Workflow n8n của bạn vẫn NÊN cập nhật kết quả vào DB.

        # Bước 4: Đóng gói và trả về cho frontend
        return CombinedReportResponse(
            report_text=report_text,
            video_data=video_data_obj
        )

    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Lỗi từ dịch vụ bên ngoài: {e.response.status_code}")
    except httpx.RequestError as e:
        raise HTTPException(status_code=504, detail="Không thể kết nối đến dịch vụ tạo báo cáo.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if connection and connection.is_connected():
            if cursor:
                cursor.close()
            connection.close()

@router.post("/improvement-script", response_model=str, status_code=status.HTTP_200_OK)
async def create_improvement_script(request_data: ImprovementRequest) -> str:
    """
    Endpoint để tạo kịch bản cải tiến dựa trên báo cáo gốc và các yếu tố cải tiến.
    """
    print("Nhận request tạo kịch bản cải tiến:", request_data)

    connection = None

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
    connection = None
    hostname = os.getenv("HOSTNAME")
    db_host = os.getenv("DB_HOST")
    username = os.getenv("USERNAME")
    password = os.getenv("PASSWORD")
    try:
        connection = mysql.connector.connect(
            host=hostname,
            database=db_host,
            user=username,
            password=password
        )

        if connection.is_connected():
            with connection.cursor(dictionary=True) as cursor:
                cursor.execute("SELECT * FROM tiktok_info")
                rows = cursor.fetchall()
            # Chuyển đổi danh sách dict sang TiktokData
            rows = [TiktokData(**row) for row in rows]

            if not rows:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Không tìm thấy dữ liệu TikTok."
                )
           
            return TiktokDataResponse(tiktok=rows)

    except Error as e:
        # Ghi lại lỗi đầy đủ hơn để debug
        print(f"Lỗi database hoặc xử lý dữ liệu: {e}")
        # Bao gồm cả các lỗi validation của Pydantic
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Không thể xử lý yêu cầu. Lỗi: {e}"
        )
    finally:
        if connection and connection.is_connected():
            connection.close()
            print("Kết nối đến cơ sở dữ liệu đã được đóng.")

@router.get("/url_tiktok", response_model=TiktokData, status_code=status.HTTP_200_OK)
async def find_data_with_url(
    # Dùng Query() để FastAPI biết rằng đây là một tham số từ URL
    url_tiktok: str = Query(..., alias="url_tiktok")
) -> TiktokData:
    """
    Endpoint để tìm kiếm dữ liệu TikTok theo URL.
    """
    connection = None
    cursor = None
    
    # FastAPI đã tự động giải mã URL, không cần xử lý thủ công
    decoded_url = urllib.parse.unquote(url_tiktok)
    
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Sử dụng tham số hóa truy vấn để tránh SQL injection
        query = "SELECT * FROM tiktok_info WHERE url_tiktok = %s"
        cursor.execute(query, (decoded_url,))
        row = cursor.fetchone()

        if row:
            # Chuyển đổi từ dict sang TiktokData (giả sử model của bạn khớp)
            return TiktokData(**row)
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy dữ liệu TikTok với URL đã cho."
            )
    except Error as e:
        print(f"Lỗi kết nối đến cơ sở dữ liệu: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Không thể kết nối đến cơ sở dữ liệu."
        )
    finally:
        if connection and connection.is_connected():
            if cursor:
                cursor.close()
            connection.close()

@router.get("/keywords", response_model=List[KeywordResponse], status_code=status.HTTP_200_OK)
async def get_keywords() -> List[KeywordResponse]:
    connection = None
    hostname = os.getenv("HOSTNAME")
    db_host = os.getenv("DB_HOST")
    username = os.getenv("USERNAME")
    password = os.getenv("PASSWORD")

    tables_to_query = [
            "niche", 
            "content_angle", 
            "hook_type", 
            "product_type",
            "script_framework",
            "title",
            
        ]
    
    all_keywords = []

    try:
        # Kết nối đến cơ sở dữ liệu MySQL
        connection = mysql.connector.connect(
            host=hostname,
            database=db_host,
            user=username,
            password=password
        )
        cursor = connection.cursor()

        if connection.is_connected():
            for table in tables_to_query:
                cursor.execute(f"SELECT keyword FROM {table}")
                rows = cursor.fetchall()
                # Thêm tất cả từ khóa từ bảng hiện tại vào danh sách chung
                all_keywords.extend([row[0] for row in rows])

            if not all_keywords:
                return [] # Trả về rỗng nếu không có từ khóa nào
            keyword_counts = Counter(all_keywords)

            # Chuyển đổi đối tượng Counter thành danh sách các dictionary
            # Sắp xếp để lấy các từ khóa phổ biến nhất lên đầu
            response_data = [
                {"keyword": keyword, "count": count} 
                for keyword, count in keyword_counts.most_common()
            ]

            print(f"Đã lấy và đếm {len(response_data)} từ khóa duy nhất từ cơ sở dữ liệu.")
            return response_data
    except Error as e:
        print(f"Lỗi kết nối đến cơ sở dữ liệu: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Không thể kết nối đến cơ sở dữ liệu."
        )
    finally:
        if connection and connection.is_connected():
            connection.close()
            print("Kết nối đến cơ sở dữ liệu đã được đóng.")

    @router.get("/video", response_model=TiktokData, status_code=status.HTTP_200_OK)
    async def get_video_by_url(
        # Dùng Query() để FastAPI biết rằng đây là một tham số từ URL
        url_tiktok: str = Query(..., description="The full URL of the TikTok video to fetch.")
    ) -> TiktokData:
        """
        Endpoint để tìm kiếm và trả về dữ liệu chi tiết của một video TikTok theo URL.
        """
        connection = None
        cursor = None
        try:
            connection = get_db_connection()
            cursor = connection.cursor(dictionary=True)

            query = "SELECT * FROM tiktok_info WHERE url_tiktok = %s"
            cursor.execute(query, (url_tiktok,))
            video_data = cursor.fetchone()

            if video_data:
                # Chuyển đổi chuỗi JSON 'keyword' thành danh sách nếu có
                if video_data.get('keyword') and isinstance(video_data['keyword'], str):
                    try:
                        video_data['keyword'] = json.loads(video_data['keyword'])
                    except json.JSONDecodeError:
                        video_data['keyword'] = []
                
                return TiktokData(**video_data)
            else:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Không tìm thấy dữ liệu TikTok với URL đã cho."
                )
        except Error as e:
            print(f"Lỗi cơ sở dữ liệu khi tìm video: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Lỗi truy vấn cơ sở dữ liệu."
            )
        finally:
            if connection and connection.is_connected():
                if cursor:
                    cursor.close()
                connection.close()