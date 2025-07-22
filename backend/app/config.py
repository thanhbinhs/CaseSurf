from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    api_port: int = 8001
    debug: bool = True
    GOOGLE_API_KEY: str # Đảm bảo biến môi trường này được đặt

    # Đây là cách đúng và duy nhất để cấu hình trong Pydantic v2 trở lên
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

# Khởi tạo cài đặt để có thể sử dụng trong ứng dụng của bạn
settings = Settings()