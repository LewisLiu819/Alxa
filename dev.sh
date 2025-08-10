#!/bin/bash

echo "🚀 Starting Tenggeli Desert Monitoring Development Environment"
echo "=================================================="
echo ""

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Shutting down development servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Ensure we're in the project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# Start backend in background
echo "📊 Starting backend server..."
./start_backend.sh > backend.log 2>&1 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend in background  
echo "🌐 Starting frontend server..."
./start_frontend.sh > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for both servers to be ready
echo ""
echo "⏳ Waiting for servers to start..."
sleep 5

echo ""
echo "✅ Development environment is ready!"
echo "=================================================="
echo "🌐 Frontend: http://localhost:3000"
echo "📊 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo "📋 Backend logs: tail -f backend.log"
echo "📋 Frontend logs: tail -f frontend.log"
echo ""
echo "🛑 Press Ctrl+C to stop all servers"
echo "=================================================="

# Wait for user interrupt
wait