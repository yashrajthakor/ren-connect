# syntax=docker/dockerfile:1

# =====================================================================
# Build stage — compiles the Vite SPA into static files.
# =====================================================================
FROM node:22-alpine AS builder
WORKDIR /app

# Vite inlines env vars at BUILD time, so they must be present in this stage.
# Setting them as runtime env vars has NO effect on an already-built bundle.
# In Coolify these must be added as **Build Variables** (Configuration →
# Environment Variables → tick "Build Variable"), not plain runtime vars.
# If omitted, the app falls back to the defaults hardcoded in
# src/integrations/supabase/client.ts.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_VAPID_PUBLIC_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_VAPID_PUBLIC_KEY=$VITE_VAPID_PUBLIC_KEY

# Install dependencies first so this layer stays cached until the lockfile
# actually changes — the slowest part of the build by far.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Cap the heap so a large bundle doesn't get OOM-killed on a small VPS.
ENV NODE_OPTIONS=--max-old-space-size=2048

# Runs `prebuild` (sitemap generation) then `vite build`.
RUN npm run build

# =====================================================================
# Runtime stage — nginx serving the built static files.
# =====================================================================
FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# NOTE: deliberately no HEALTHCHECK here.
# Coolify treats a Dockerfile HEALTHCHECK as authoritative and then polls
# `docker inspect .State.Health.Status`. If it reuses a cached image that
# predates this Dockerfile (it skips the build when an image already exists
# for the same commit SHA), that key is absent and the rolling update dies
# with `map has no entry for key "Health"` rather than a useful message.
# Health is configured in Coolify's own UI instead - point it at /health,
# which nginx.conf serves.

CMD ["nginx", "-g", "daemon off;"]
