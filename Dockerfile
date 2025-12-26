# Dockerfile for Utility Bill Pay Test Automation
# Multi-stage build for optimized image size

# Stage 1: Base image with Node.js
FROM mcr.microsoft.com/playwright:v1.48.0-jammy

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy test files and configuration
COPY tsconfig.json ./
COPY playwright.config.ts ./
COPY tests/ ./tests/

# Install Playwright browsers (already in base image, but ensure they're available)
RUN npx playwright install --with-deps

RUN npx playwright install chrome

# Set environment variables for test execution
ENV CI=true
ENV NODE_ENV=test

# Default command runs all tests
CMD ["npm", "test"]

