#!/bin/bash

echo "🚀 Starting Tenggeli Desert Monitoring Backend..."

# Ensure we're in the project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# Check if virtual environment exists, create if not
if [ ! -d "backend/venv" ]; then
    echo "📦 Creating virtual environment..."
    cd backend
    python3 -m venv venv
    cd ..
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source backend/venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📥 Installing Python dependencies..."
pip install -r backend/requirements.txt

# Create necessary directories
echo "📁 Creating data directories..."
mkdir -p data/{raw,processed,cache}
mkdir -p backend/logs

# Check environment configuration
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        echo "⚠️  Creating .env file from example..."
        cp backend/.env.example backend/.env
    else
        echo "⚠️  backend/.env.example not found. Creating backend/.env with defaults..."
        cat > backend/.env << 'EOF'
APP_NAME=Tenggeli Desert Monitoring API
DEBUG=true
LOG_LEVEL=INFO
DATA_PATH=../data
PROCESSED_DATA_PATH=../data/processed
CACHE_PATH=../data/cache
DATABASE_URL=sqlite:///./tenggeli_monitoring.db
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
REGION_WEST=103.0
REGION_SOUTH=37.5
REGION_EAST=105.2
REGION_NORTH=39.0
EOF
    fi
    echo "✅ Please review backend/.env and update settings as needed"
fi

# Start the FastAPI server
echo "🌐 Starting FastAPI server on http://localhost:8000"
echo "📊 API documentation available at http://localhost:8000/docs"
echo "🛑 Press Ctrl+C to stop the server"
echo ""

cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000