FROM node:18-alpine

RUN apk add --no-cache chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV CHROMIUM_PATH /usr/bin/chromium-browser
ENV APP_PATH=/opt/chopsuey

RUN npm install -g typescript

# Install app dependencies
COPY package.json package-lock.json $APP_PATH/
WORKDIR $APP_PATH
RUN npm ci

COPY . $APP_PATH
RUN tsc && \
mv $APP_PATH/src/public $APP_PATH/dist/public && \
mv $APP_PATH/src/views $APP_PATH/dist/views && \
rm -rf $APP_PATH/src

EXPOSE 3000
CMD ["npm", "start"]

