# syntax=docker/dockerfile:1
#
# One Dockerfile, two images:
#   --target api  the Node API + scraper + daily cron   (needs a PostgreSQL, see docker-compose.yml)
#   --target web  nginx serving the built web app and proxying /api to the API

# ---- build: compile the web app and bundle the server -------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- prod-deps: production dependencies only ----------------------------------------------------
FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- api ----------------------------------------------------------------------------------------
FROM node:22-alpine AS api
RUN apk add --no-cache tzdata
WORKDIR /app

ENV NODE_ENV=production \
    TZ=Europe/Paris \
    PORT=8787

COPY package.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist-server ./dist-server

USER node
EXPOSE 8787
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist-server/index.js"]

# ---- web ----------------------------------------------------------------------------------------
FROM nginxinc/nginx-unprivileged:1.27-alpine AS web

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/security-headers.conf /etc/nginx/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
