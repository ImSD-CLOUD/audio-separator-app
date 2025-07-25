# Use Python base image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

# Set working directory
WORKDIR /app

# Install system dependencies: ffmpeg, nodejs, npm
RUN apt-get update && apt-get install -y \
    ffmpeg \
    nodejs \
    npm \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend ./backend
COPY demucs_separate.py .

# Install Node dependencies
WORKDIR /app/backend
COPY package*.json ./
RUN npm install
COPY . .

# Create folders
WORKDIR /app
RUN mkdir -p uploads output

# Expose port
EXPOSE 8080

# Start server
CMD ["node", "backend/server.js"]
