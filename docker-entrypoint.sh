#!/bin/sh
set -e

echo "=== Starting Next.js server ==="
echo "PORT=${PORT:-3000}"
echo "NODE_ENV=${NODE_ENV:-production}"
echo "Working directory: $(pwd)"
echo ""

echo "Running database migrations..."
export PATH="/app/node_modules/.bin:$PATH"
npx prisma migrate deploy || {
  echo "WARNING: Migrations failed, but continuing..."
}

echo ""
echo "Files in current directory:"
ls -la
echo ""

if [ ! -f "server.js" ]; then
  echo "ERROR: server.js not found!"
  echo "Looking for server.js in:"
  find . -name "server.js" -type f 2>/dev/null || echo "No server.js found"
  exit 1
fi

echo "✓ Found server.js"
echo "✓ Starting server on port ${PORT:-3000}"
echo ""

if [ "$(id -u)" = "0" ]; then
  echo "Running as root, switching to nextjs user..."
  exec su-exec nextjs node server.js
else
  echo "Running as $(whoami), starting directly..."
  exec node server.js
fi

