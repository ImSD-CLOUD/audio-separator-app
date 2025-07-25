# Use a slim Python base image (includes Python + pip)
FROM python:3.10-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=3000

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
  nodejs \
  npm \
  ffmpeg \
  git \
  build-essential \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Copy root-level files
COPY requirements.txt ./
COPY demucs_separate.py ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy and install Node.js backend dependencies
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend ./  # Copy all backend files including server.js

# Create output and uploads folders
WORKDIR /app
RUN mkdir -p uploads output

# Expose the backend port
EXPOSE 3000

# Start backend server
CMD ["node", "backend/server.js"]
