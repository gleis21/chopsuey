FROM node:18-alpine

RUN apk add --no-cache chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV CHROMIUM_PATH /usr/bin/chromium-browser
# Create app directory
RUN mkdir -p /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
COPY package-lock.json /usr/src/app/
WORKDIR /usr/src/app
RUN npm install

# Bundle app source
COPY . /usr/src/app



EXPOSE 3000
CMD ["npm", "start"]

