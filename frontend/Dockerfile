FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json ./
RUN npm install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

# NEXT_PUBLIC_* values are inlined at build time, so the Metrica counter id has
# to be present here rather than only in the runtime environment.
ARG NEXT_PUBLIC_YM_ID
ENV NEXT_PUBLIC_YM_ID=$NEXT_PUBLIC_YM_ID

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV NEXT_PUBLIC_API_URL http://mom_site_api:5000

# Install curl for health checks; libc6-compat is required at runtime by
# sharp's prebuilt binary (used for next/image optimization) on alpine
RUN apk add --no-cache curl libc6-compat

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
# sharp must be installed BEFORE the standalone bundle is copied in: npm
# install rebuilds /app/node_modules from scratch and would drop `next` itself
# (the container then crash-loops on "Cannot find module 'next'"). Copying the
# bundle afterwards merges into the same directory and keeps both.
# Without sharp, /_next/image answers 500 instead of serving the banner.
RUN npm install --no-package-lock --no-save --omit=dev sharp@0.33.5     && chown -R nextjs:nodejs /app/node_modules

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static


USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]