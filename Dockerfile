FROM node:18-bullseye

# Install Chromium, ffmpeg, yt-dlp, and dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    ffmpeg \
    python3 \
    python3-pip \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends && \
    pip3 install yt-dlp && \
    rm -rf /var/lib/apt/lists/*

# Create necessary directories
RUN mkdir -p /app/data/screenshots /app/data/audio /app/data/results /app/data/transcripts

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .
# Set environment variables
ENV PORT=8080


# Expose port
EXPOSE 8080

# Start the application
CMD ["npm", "start"]