FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# Production stage
FROM base AS production
COPY --from=install /temp/prod/node_modules node_modules
COPY . .
USER bun
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", "start" ]

# Development stage
FROM base AS development
COPY --from=install /temp/dev/node_modules node_modules
COPY . .
USER bun
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", "dev" ]

