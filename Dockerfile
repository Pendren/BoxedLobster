FROM node:22-bookworm-slim

# Install dependencies for Chromium and OpenClaw
RUN apt-get update && apt-get install -y \
    chromium \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install OpenClaw globally with verbose logging
RUN npm install -g npm@latest && \
    npm config set registry https://registry.npmjs.org/ && \
    npm install -g openclaw@latest --verbose

# Create working directory
WORKDIR /app

# Expose Gateway port
EXPOSE 18789

# Copy configuration and entrypoint
COPY config/openclaw.json /root/.openclaw/openclaw.json
COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
