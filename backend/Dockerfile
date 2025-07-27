# Stage 1: Build dependencies
FROM python:3.13-slim AS builder

WORKDIR /app

COPY requirements.txt ./  
RUN pip wheel --no-cache-dir --wheel-dir /usr/src/app/wheels -r requirements.txt

# Stage 2: Final image
FROM python:3.13-slim

WORKDIR /app

# Copy cached wheels from builder stage
COPY --from=builder /usr/src/app/wheels /wheels
# Corrected path for requirements.txt: it was copied to /app in the builder stage
COPY --from=builder /app/requirements.txt .
RUN pip install --no-cache-dir --find-links=/wheels -r requirements.txt

COPY . .

EXPOSE 8001
CMD [ "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001" ]


# FROM python:3.13-slim

# WORKDIR /app



# COPY requirements.txt ./

# RUN pip install --no-cache-dir -r requirements.txt



# COPY . .

# EXPOSE 8001

# CMD [ "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--reload" ]