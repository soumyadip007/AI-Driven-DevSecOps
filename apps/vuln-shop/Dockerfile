# INTENTIONAL DEMO MISCONFIGURATION — insecure container defaults.
# Conftest policy: policies/conftest/dockerfile.rego
FROM node:20-bookworm

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY . .

# Missing non-root USER, no HEALTHCHECK, runs as root.
EXPOSE 3000
CMD ["node", "src/server.js"]
