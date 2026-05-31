#!/bin/bash
set -e

BACKEND_PORT=${BACKEND_PORT:-8000}
FRONTEND_PORT=${FRONTEND_PORT:-3000}
ROOT="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
  echo ""
  echo "Shutting down..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
  echo "Done."
}

trap cleanup SIGINT SIGTERM

export PATH="$ROOT/backend/.venv/bin:$PATH"

echo "Starting backend on port $BACKEND_PORT..."
(cd "$ROOT/backend" && uvicorn main:app --reload --port "$BACKEND_PORT" --host 0.0.0.0) &
BACKEND_PID=$!

sleep 1

echo "Starting frontend on port $FRONTEND_PORT..."
(cd "$ROOT/frontend" && PORT="$FRONTEND_PORT" npm run dev) &
FRONTEND_PID=$!

echo ""
echo "  Backend:  http://localhost:$BACKEND_PORT"
echo "  Frontend: http://localhost:$FRONTEND_PORT"
echo ""

wait
