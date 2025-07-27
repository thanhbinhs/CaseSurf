# Stage 1: Build the Next.js application
FROM node:24 AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Run the Next.js application
FROM node:24-slim

WORKDIR /app

# Copy only the necessary files from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public 

# --- REMOVE OR COMMENT OUT THIS LINE ---
# COPY --from=builder /app/next.config.js ./next.config.js

EXPOSE 3000

# Use 'start' script for production
CMD ["npm", "start"]


# FROM node:24 AS builder



# WORKDIR /app

# COPY package*.json ./

# RUN npm install

# COPY . .



# EXPOSE 3000

# CMD [ "npm" , "run", "dev" ]