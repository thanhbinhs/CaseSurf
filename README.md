# 🚀 CaseSurf Project

Dự án gồm hai phần:

* ✅ **Frontend:** Next.js (Node.js)
* ✅ **Backend:** FastAPI (Python)
* 📦 Được đóng gói và triển khai bằng Docker Compose

---

## 📁 Cấu trúc thư mục

```
CaseSurf/
├── frontend/         # Ứng dụng Next.js
│   └── Dockerfile
├── backend/          # Ứng dụng FastAPI
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Khởi tạo các file .env


## 🚀 Cách chạy dự án với Docker

### 1. Clone repository

```bash
git clone https://github.com/thanhbinhs/CaseSurf.git
cd CaseSurf
```

---

### 2. Build và chạy ứng dụng

```bash
docker compose up --build
```

> ⚠️ Lần đầu chạy sẽ mất thời gian để tải các image và cài dependencies.

---

### 3. Truy cập ứng dụng

| Thành phần         | URL truy cập                                             |
| ------------------ | -------------------------------------------------------- |
| Frontend (Next.js) | [http://localhost:3000](http://localhost:3000)           |
| Backend (FastAPI)  | [http://localhost:8001](http://localhost:8001)           |

---

## 🚩 Dừng container

```bash
docker compose down
```

---

## 🔧 Yêu cầu hệ thống

* [Docker](https://docs.docker.com/get-docker/)
* [Docker Compose](https://docs.docker.com/compose/) (tích hợp sẵn với Docker bản mới)
* Nếu dùng [Colima](https://github.com/abiosoft/colima) thay Docker Desktop: đảm bảo đã `colima start`

---

## 📝 Ghi chú

* Bạn có thể chỉnh sửa biến môi trường qua file `.env` (nếu dùng).
* Cả frontend và backend đều được bật **hot reload** ở chế độ phát triển.

---

