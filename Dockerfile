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

# Coolify string-matches the Dockerfile for this instruction and, when it is
# present, treats it as authoritative and then polls
# `docker inspect .State.Health.Status`. It must therefore be a REAL
# instruction: a bare mention inside a comment matches too, which makes
# Coolify wait on a health status the image does not actually have and the
# rolling update dies with `map has no entry for key "Health"`.
#
# wget and nc are both busybox applets in alpine (curl is NOT installed).
# The nc fallback covers the case where the wget applet is unavailable, so a
# missing tool can never masquerade as an unhealthy container.
# Short interval so the container reports "healthy" quickly instead of
# sitting in "starting" while Coolify polls.
HEALTHCHECK --interval=3s --timeout=3s --start-period=2s --retries=10 \
  CMD wget -q -O /dev/null http://127.0.0.1/health || nc -z 127.0.0.1 80 || exit 1

CMD ["nginx", "-g", "daemon off;"]
