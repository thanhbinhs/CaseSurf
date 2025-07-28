import os
import json
import time
from typing import Counter, List
from webbrowser import get
from fastapi import APIRouter, HTTPException, status
# Giả sử các file trên nằm trong cùng thư mục app
from app.models.promt import ImprovementRequest, ProductRequest, Report, TiktokData, TiktokDataResponse, KeywordResponse
from app.services.service import n8nService
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

@router.post("/report", response_model=Report, status_code=status.HTTP_200_OK)
async def create_report(request_data: ProductRequest) -> Report:
    
    try:
        connection = get_db_connection()
        if not connection:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not connect to the database."
            )
        
        with connection.cursor() as cursor:
            # The fix is to add a comma after request_data.product
            # This turns it into a tuple: (value,)
            cursor.execute("SELECT * FROM tiktok_info WHERE url_tiktok = %s", (request_data.product,))
            existing_product = cursor.fetchone()

        if existing_product:
            # Assuming column 1 is the report content
            return Report(text=existing_product[1])  

        # If not found, call n8n to generate the report
        print(f"Creating report for product: {request_data.product} by user: {request_data.userId}")

        report_text = await service.generate_report(
            product=request_data.product,
            userId=request_data.userId
        )
        return Report(text=report_text)
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
            detail="Không thể kết nối đến dịch vụ tạo báo cáo."
        )
    except Exception as e:
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
                cursor.execute("SELECT url_tiktok, description, click, tym, userId, niche, content_angle, hook_type, cta_type, trust_tactic, product_type FROM tiktok_info")
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


router.post("/url_tiktok", response_model=TiktokData, status_code=status.HTTP_200_OK)
async def find_data_with_url(url_tiktok: str) -> TiktokData:
    """
    Endpoint để tìm kiếm dữ liệu TikTok theo URL.
    """
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
                # Sử dụng tham số hóa truy vấn để tránh SQL injection
                cursor.execute("SELECT * FROM tiktok_info WHERE url_tiktok = %s", (url_tiktok,))
                row = cursor.fetchone()

            if row:
                # Chuyển đổi từ dict sang TiktokData
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
            connection.close()
            print("Kết nối đến cơ sở dữ liệu đã được đóng.")
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
            "cta_type", 
            "trust_tactic", 
            "product_type"
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