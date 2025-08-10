#!/bin/bash

echo "🚀 Starting Tenggeli Desert Monitoring Frontend..."

# Ensure we're in the project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT/frontend"

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ to continue."
    exit 1
fi

NODE_VERSION=$(node --version | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Node.js version $NODE_VERSION detected. Node.js 18+ is recommended."
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

# Copy or create environment file if it doesn't exist
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "⚙️  Creating environment file from example..."
        cp .env.example .env
    else
        echo "⚙️  .env.example not found. Creating .env with defaults..."
        cat > .env << 'EOF'
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_TITLE=Tenggeli Desert Monitoring
VITE_MAP_CENTER_LAT=38.5
VITE_MAP_CENTER_LNG=105.0
VITE_MAP_DEFAULT_ZOOM=11
VITE_ENABLE_DEBUG=false
EOF
    fi
    echo "✅ Please review frontend/.env if you need to change API settings"
fi

# Run type checking
echo "🔍 Running TypeScript type check..."
npm run type-check

if [ $? -eq 0 ]; then
    echo "✅ TypeScript types are valid"
else
    echo "⚠️  TypeScript errors found, but continuing with dev server..."
fi

# Start the development server
echo "🌐 Starting development server on http://localhost:3000"
echo "🗺️  Map dashboard will be available once the server starts"
echo "🛑 Press Ctrl+C to stop the server"
echo ""

npm run dev