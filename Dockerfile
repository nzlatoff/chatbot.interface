# Use official Node.js 22 LTS image
FROM node:22-alpine

# Set working directory
WORKDIR /usr/src/app

# Install dependencies separately for better caching
COPY package*.json ./
COPY .env .
RUN npm install --production

# Copy application source
COPY ./src/ .
COPY ./package.json .
COPY ./package-lock.json .
COPY ./biome.json .

# Expose the port your Express app runs on
EXPOSE 3000

# Start the app
CMD ["node", "app"]