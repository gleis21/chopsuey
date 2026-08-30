FROM node:26-slim

ENV APP_PATH=/opt/chopsuey
ENV CHROMIUM_PATH=/usr/bin/chromium

RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    libasound2t64 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2t64 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxshmfence1 \
    libxss1 \
    lsb-release \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g typescript

# Install app dependencies
COPY package.json package-lock.json $APP_PATH/
WORKDIR $APP_PATH
RUN npm ci --omit=optional

COPY . $APP_PATH
RUN tsc && \
mv $APP_PATH/src/public $APP_PATH/dist/public && \
mv $APP_PATH/src/views $APP_PATH/dist/views && \
rm -rf $APP_PATH/src

EXPOSE 3000
CMD ["npm", "start"]
