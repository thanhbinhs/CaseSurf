import httpx
from typing import Dict, List
import os


class n8nService:
    """
    Lớp dịch vụ để tương tác với workflow của n8n.

    """
    def __init__(self):
        # Lấy API key từ biến môi trường hoặc cấu hình
        self.auth_token = os.getenv("N8N_AUTH_TOKEN")

    async def generate_report(self, product_name: str) -> str:
        """
        Gọi một webhook của n8n để tạo báo cáo cho một sản phẩm.
        Phương thức này sử dụng httpx để hoạt động bất đồng bộ.

        Args:
            product_name: Tên của sản phẩm cần tạo báo cáo.

        Returns:
            Một chuỗi chứa nội dung báo cáo thuần túy (plain text).

        Raises:
            httpx.HTTPStatusError: Nếu API trả về mã lỗi (4xx, 5xx).
            httpx.RequestError: Nếu có lỗi kết nối mạng.
            ValueError: Nếu phản hồi từ API là rỗng.
        """

        webhook_url = "https://seedxwork.app.n8n.cloud/webhook/43e61f00-0b9d-43ac-bb05-b3fea922d521"
        headers: Dict[str, str] = {
            "Content-Type": "application/json",
            "N8N_AUTH_TOKEN": self.auth_token
        }

        print(f"Đang gửi yêu cầu đến n8n cho sản phẩm: {headers}")
        payload = {"product": product_name}
        
        # Sử dụng AsyncClient của httpx để gửi request bất đồng bộ
        async with httpx.AsyncClient(timeout=300.0) as client:
            print(f"Đang gửi yêu cầu đến n8n cho sản phẩm: {product_name}")
            response = await client.post(webhook_url, headers=headers, json=payload)
            
            # Tự động ném ra exception nếu status code là lỗi
            response.raise_for_status()
            
            # Đảm bảo encoding là UTF-8 để xử lý tiếng Việt
            response.encoding = 'utf-8'
            report_text = response.text

            if not report_text:
                raise ValueError("Phản hồi từ n8n service là một chuỗi rỗng.")
            
            print("Nhận phản hồi thành công từ n8n.")
            return report_text
        
    async def generate_script(self, original_report: str, improvements: List[str]) -> str:
        """
        Gọi một webhook của n8n để tạo kịch bản cải tiến dựa trên báo cáo gốc và các yếu tố cải tiến.

        Args:
            original_report: Báo cáo gốc cần cải tiến.
            improvements: Danh sách các yếu tố cần cải thiện.

        Returns:
            Một chuỗi chứa nội dung kịch bản cải tiến.

        Raises:
            httpx.HTTPStatusError: Nếu API trả về mã lỗi (4xx, 5xx).
            httpx.RequestError: Nếu có lỗi kết nối mạng.
            ValueError: Nếu phản hồi từ API là rỗng.
        """
        webhook_url = "https://seedxwork.app.n8n.cloud/webhook/3a23e18f-3390-479a-ab82-f612520f5471"
        headers: Dict[str, str] = {
            "Content-Type": "application/json",
            "N8N_AUTH_TOKEN": self.auth_token
        }
        payload = {
            "original_report": original_report,
            "improvements": improvements
        }
        
        async with httpx.AsyncClient(timeout=300.0) as client:
            print("Đang gửi yêu cầu tạo kịch bản cải tiến...")
            response = await client.post(webhook_url, headers=headers, json=payload)
            
            response.raise_for_status()
            
            response.encoding = 'utf-8'
            script_text = response.text

            if not script_text:
                raise ValueError("Phản hồi từ n8n service là một chuỗi rỗng.")
            
            print("Nhận phản hồi thành công từ n8n cho kịch bản cải tiến.")
            return script_text
        
    async def get_tiktok_data(self) -> List[Dict[str, str]]:
        """
        Gọi một webhook của n8n để lấy dữ liệu TikTok.

        Returns:
            Danh sách các từ điển chứa dữ liệu TikTok.

        Raises:
            httpx.HTTPStatusError: Nếu API trả về mã lỗi (4xx, 5xx).
            httpx.RequestError: Nếu có lỗi kết nối mạng.
            ValueError: Nếu phản hồi từ API là rỗng.
        """
        webhook_url = "https://seedxwork.app.n8n.cloud/webhook/8759adb6-c75e-4937-9ee8-b49b5cdfa361"
        
        async with httpx.AsyncClient(timeout=300.0) as client:
            print("Đang gửi yêu cầu lấy dữ liệu TikTok...")
            response = await client.get(webhook_url, headers={"N8N_AUTH_TOKEN": self.auth_token})
            
            response.raise_for_status()
            
            response.encoding = 'utf-8'
            tiktok_data = response.json()

            if not tiktok_data:
                raise ValueError("Phản hồi từ n8n service là một chuỗi rỗng.")
            
            print("Nhận dữ liệu TikTok thành công từ n8n.")
            return tiktok_data