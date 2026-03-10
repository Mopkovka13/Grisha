# syntax=docker/dockerfile:1

# Multi-stage build: Gradle build stage
FROM gradle:8.5-jdk21 AS build

WORKDIR /app

# Copy build files first for dependency caching
COPY settings.gradle.kts build.gradle.kts ./
COPY backend/build.gradle.kts ./backend/
COPY frontend/build.gradle.kts ./frontend/
COPY frontend/package*.json ./frontend/

# Cache Java dependencies
RUN --mount=type=cache,target=/root/.gradle \
    gradle :backend:dependencies --no-daemon -q

# Cache Node.js dependencies
RUN --mount=type=cache,target=/root/.gradle \
    gradle :frontend:npmInstall --no-daemon -q

# Copy source code
COPY backend ./backend
COPY frontend/src ./frontend/src
COPY frontend/index.html ./frontend/
COPY frontend/tsconfig.json frontend/tsconfig.node.json ./frontend/
COPY frontend/vite.config.ts ./frontend/

# Build (frontend first, then backend packages it)
RUN --mount=type=cache,target=/root/.gradle \
    gradle :backend:bootJar --no-daemon -x test

# Final stage: Runtime
FROM eclipse-temurin:21-jre-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Copy the built JAR from the build stage
COPY --from=build /app/backend/build/libs/app.jar app.jar

# Create required directories
RUN mkdir -p /tmp/grinya /app/data /app/media

# EXPOSE port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/videos || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
