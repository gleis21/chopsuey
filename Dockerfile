FROM node:26-alpine

ENV APP_PATH=/opt/chopsuey

RUN npm install -g typescript

# Install app dependencies
COPY package.json package-lock.json $APP_PATH/
WORKDIR $APP_PATH
RUN npm ci

# Build frontend (Vite + Vue 3 emits hashed bundles into src/public/assets)
COPY frontend $APP_PATH/frontend
WORKDIR $APP_PATH/frontend
RUN npm ci && npm run build

# Build backend TS
WORKDIR $APP_PATH
COPY . $APP_PATH
RUN tsc && \
mv $APP_PATH/src/public $APP_PATH/dist/public && \
mv $APP_PATH/src/views $APP_PATH/dist/views && \
rm -rf $APP_PATH/src $APP_PATH/frontend

EXPOSE 3000
CMD ["npm", "start"]
