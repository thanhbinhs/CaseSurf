from fastapi import FastAPI
from app.config import settings
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Hoặc ["http://localhost:3000"] nếu muốn hạn chế
    allow_credentials=True,
    allow_methods=["*"],  # Cho phép GET, POST, OPTIONS, v.v.
    allow_headers=["*"],  # Cho phép mọi header
)

app.include_router(api_router)


