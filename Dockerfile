FROM oven/bun

# Set the application directory
WORKDIR /app

# Copy application source code and configuration files
# Using absolute paths for clarity and to avoid issues if WORKDIR changes.
COPY src /app/src
COPY index.ts /app/index.ts
COPY package.json /app/package.json
COPY bun.lock /app/bun.lock
COPY tsconfig.json /app/tsconfig.json

# Set environment to production
ENV NODE_ENV=production

# Install production dependencies using the lockfile for reproducible builds.
# The --production flag ensures devDependencies are not installed.
RUN bun install --production --frozen-lockfile

# Define the entrypoint for the container.
# This specifies the base command to run, which is the bun executable
# followed by the path to our main script. Using an absolute path is crucial
# because the container's working directory will be changed at runtime.
ENTRYPOINT ["bun", "/app/index.ts"]

# Define the default command arguments.
# These will be appended to the ENTRYPOINT. The user can override these
# arguments in the `docker run` command. Providing `--help` as the default
# is a good practice, as it makes the container's usage self-documenting.
CMD ["--help"]
