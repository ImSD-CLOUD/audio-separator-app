# Use a slim Python base image
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

# Copy backend-related files
COPY requirements.txt ./
COPY demucs_separate.py ./
COPY package*.json ./
RUN pip install --no-cache-dir -r requirements.txt
RUN npm install

# Copy the rest of the app
COPY backend ./backend

# Create runtime folders
RUN mkdir -p uploads output

# Expose port
EXPOSE 3000

# Start the backend server
CMD ["node", "backend/server.js"]
