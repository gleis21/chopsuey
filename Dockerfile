FROM node:18-alpine

RUN apk add --no-cache chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV CHROMIUM_PATH /usr/bin/chromium-browser

RUN npm install -g typescript && mkdir -p /usr/src/app && mkdir -p /usr/src/app/dist


# Install app dependencies
COPY package.json /usr/src/app/
COPY package-lock.json /usr/src/app/
COPY src/public /usr/src/app/dist/public
WORKDIR /usr/src/app
RUN npm ci

COPY . /usr/src/app
RUN tsc
COPY src/views /usr/src/app/dist/views


EXPOSE 3000
CMD ["npm", "start"]

