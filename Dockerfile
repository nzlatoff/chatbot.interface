FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY .env .
RUN npm install --production

# Copy application source
COPY ./src/ .

EXPOSE 3000

# Start the app
CMD ["node", "src/app"]