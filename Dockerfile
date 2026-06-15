# Stage 1: Build the Vite application
FROM node:20-alpine AS build

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
# We use npm ci for a clean, deterministic install
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the Vite application for production
# This creates a 'dist' folder with static files
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the built static files from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy the Nginx configuration template
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Cloud Run provides the PORT environment variable at runtime.
# We set a default of 8080 just in case it's run locally without it.
ENV PORT=8080

# Expose the port (informative for Docker, Cloud Run handles this via $PORT)
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
