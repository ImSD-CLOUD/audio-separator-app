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
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Copy root-level files
COPY requirements.txt ./
COPY demucs_separate.py ./  # Copy to /app (root)

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend ./

# Create persistent folders
RUN mkdir -p /app/uploads /app/output

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]