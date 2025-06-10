FROM oven/bun AS builder

WORKDIR /app

COPY src/filesystem /app
COPY tsconfig.json /tsconfig.json

RUN --mount=type=cache,target=/root/.bun bun install

RUN --mount=type=cache,target=/root/.bun-production bun install --production


FROM oven/bun AS release

WORKDIR /app

COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/package-lock.json /app/package-lock.json

ENV NODE_ENV=production

RUN bun install --production

ENTRYPOINT ["bun", "/app/dist/index.js"]
