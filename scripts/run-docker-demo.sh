#!/bin/bash

# This script builds and runs the MCP Filesystem Server demo in a Docker container.
# It includes robust checks for port conflicts and cleans up previous container instances.

# --- Configuration ---
PORT=8090
CONTAINER_NAME="mcpfs-demo"
IMAGE_NAME="mcpfs-demo"

# Exit immediately if any command fails
set -e

# --- Cleanup Function ---
# This function will be called when the script exits (either normally or via signal)
cleanup() {
  if [ -n "$CONTAINER_PID" ]; then
    echo ""
    echo "Stopping container '$CONTAINER_NAME'..."
    docker stop $CONTAINER_NAME >/dev/null 2>&1 || true
    echo "Container stopped."
  fi
}

# Register cleanup to run on script exit and common signals
trap cleanup EXIT SIGINT SIGTERM

# --- Pre-flight Checks & Setup ---

# 1. Check if our container is already running
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "Found existing container '$CONTAINER_NAME' running. Stopping it..."
  docker stop $CONTAINER_NAME >/dev/null 2>&1 || true
  docker rm $CONTAINER_NAME >/dev/null 2>&1 || true
  sleep 1  # Give it a moment to release the port
fi

# 2. Clean up any stopped containers with the same name
docker rm $CONTAINER_NAME >/dev/null 2>&1 || true

# 3. Check if the required port is still in use (by something else)
if lsof -i :$PORT >/dev/null 2>&1; then
  echo "Error: Port $PORT is already in use by another process:"
  echo ""
  lsof -i :$PORT | grep LISTEN || lsof -i :$PORT
  echo ""
  echo "Please stop the conflicting process and try again."
  exit 1
fi

# --- Docker Build ---

echo "Building Docker image '$IMAGE_NAME'..."
docker build -t $IMAGE_NAME .

# --- Docker Run ---

echo "Starting container '$CONTAINER_NAME'..."
echo "The server will be accessible at http://localhost:$PORT"
echo "Press Ctrl+C to stop the server."
echo ""

# Run Docker container in detached mode to maintain control in the script
docker run -d \
  --rm \
  --name $CONTAINER_NAME \
  -p ${PORT}:${PORT} \
  -v "$(pwd)/demo:/data" \
  -w /data \
  $IMAGE_NAME "$@" > /dev/null

# Mark that we have a container to clean up
CONTAINER_PID=1

# Follow the container logs
# This will block until the container stops or we receive a signal
docker logs -f $CONTAINER_NAME 2>&1 || true

# Wait for any background processes
wait
