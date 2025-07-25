# Stage 1: Base image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install Node.js, FFmpeg, and other system dependencies
RUN apt-get update && apt-get install -y \
  nodejs npm ffmpeg git curl build-essential \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Copy Python files
COPY requirements.txt ./
COPY demucs_separate.py ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Prepare backend (Node.js)
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend ./

# Go back to root dir
WORKDIR /app

# Create output and uploads folder
RUN mkdir -p output uploads

# Expose port
ENV PORT=3000
EXPOSE 3000

# Start backend
CMD ["node", "backend/server.js"]
