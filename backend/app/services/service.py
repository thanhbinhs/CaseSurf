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

    async def generate_report(self, product: str, userId: str) -> str:

        webhook_url = "https://seedxwork.app.n8n.cloud/webhook/43e61f00-0b9d-43ac-bb05-b3fea922d521"
        headers: Dict[str, str] = {
            "Content-Type": "application/json",
            "N8N_AUTH_TOKEN": self.auth_token
        }

        print(f"Đang gửi yêu cầu đến n8n cho sản phẩm: {headers}")
        payload = {"product": product}
        payload["userId"] = userId

        # Sử dụng AsyncClient của httpx để gửi request bất đồng bộ
        async with httpx.AsyncClient(timeout=300.0) as client:
            print(f"Đang gửi yêu cầu đến n8n cho sản phẩm: {product}")
            response = await client.post(webhook_url, headers=headers, json=payload)

            # Luôn kiểm tra lỗi trước
            response.raise_for_status()
            
            # SỬA LỖI: Thiết lập encoding TRƯỚC KHI đọc .text
            response.encoding = 'utf-8'
            
            # Bây giờ mới đọc nội dung
            report_text = response.text
            # --- THÊM CÁC DÒNG GỠ LỖI NÀY ---
            print("--- N8N RAW RESPONSE ---")
            print(f"Status Code: {response.status_code}")
            print(f"Headers: {response.headers}")
            print(f"Raw Body: {response.text}")
            print("------------------------")

            if not report_text:
                raise ValueError("Phản hồi từ n8n service là một chuỗi rỗng.")
            
            print("Nhận phản hồi thành công từ n8n.")
            return report_text
        
    async def generate_script(self, base_text: str, improvements: List[str], is_iterative: bool) -> str:
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
            "base_text": base_text,
            "improvements": improvements,
            "is_iterative": is_iterative
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
        
    async def get_tiktok_data(self) -> List[Dict]:
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