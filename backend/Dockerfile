# TransitOps backend image
FROM node:18-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source
COPY . .

EXPOSE 4000

# Run migrations + seed, then start the API.
# PostgreSQL is provided by the `db` service in docker-compose.
CMD ["sh", "-c", "npm run db:migrate && npm run db:seed && node server.js"]
