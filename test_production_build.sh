#!/bin/bash

echo "=========================================="
echo "Production Build Test - Tenggeli Desert Monitoring"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track test results
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
print_success() {
    echo -e "${GREEN}✓${NC} $1"
    ((TESTS_PASSED++))
}

print_error() {
    echo -e "${RED}✗${NC} $1"
    ((TESTS_FAILED++))
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "ℹ $1"
}

# Test 1: Check Node.js is installed
echo "Testing Frontend Build Environment..."
echo "-------------------------------------"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js installed: $NODE_VERSION"
else
    print_error "Node.js not installed"
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm installed: $NPM_VERSION"
else
    print_error "npm not installed"
fi

# Test 2: Check Python is installed
echo ""
echo "Testing Backend Build Environment..."
echo "-------------------------------------"

if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    print_success "Python installed: $PYTHON_VERSION"
else
    print_error "Python not installed"
fi

if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    print_success "Docker installed: $DOCKER_VERSION"
else
    print_warning "Docker not installed (optional)"
fi

# Test 3: Check frontend dependencies
echo ""
echo "Testing Frontend Dependencies..."
echo "-------------------------------------"

if [ -f "frontend/package.json" ]; then
    print_success "package.json found"
    
    cd frontend
    if [ -d "node_modules" ]; then
        print_success "node_modules directory exists"
    else
        print_info "Installing frontend dependencies..."
        npm install
        if [ $? -eq 0 ]; then
            print_success "Frontend dependencies installed"
        else
            print_error "Failed to install frontend dependencies"
        fi
    fi
    cd ..
else
    print_error "frontend/package.json not found"
fi

# Test 4: Build frontend
echo ""
echo "Building Frontend for Production..."
echo "-------------------------------------"

cd frontend
if npm run build; then
    print_success "Frontend build successful"
    
    if [ -d "dist" ]; then
        print_success "Build output directory (dist) created"
        DIST_SIZE=$(du -sh dist | cut -f1)
        print_info "Build size: $DIST_SIZE"
        
        # Check for key files
        if [ -f "dist/index.html" ]; then
            print_success "index.html found in dist"
        else
            print_error "index.html not found in dist"
        fi
        
        if [ -d "dist/assets" ]; then
            print_success "assets directory found in dist"
        else
            print_error "assets directory not found in dist"
        fi
    else
        print_error "Build output directory not created"
    fi
else
    print_error "Frontend build failed"
fi
cd ..

# Test 5: Check backend dependencies
echo ""
echo "Testing Backend Dependencies..."
echo "-------------------------------------"

if [ -f "backend/requirements.txt" ]; then
    print_success "requirements.txt found"
    
    if [ -d "backend/venv" ]; then
        print_success "Virtual environment exists"
    else
        print_info "Creating virtual environment..."
        cd backend
        python3 -m venv venv
        if [ $? -eq 0 ]; then
            print_success "Virtual environment created"
        else
            print_error "Failed to create virtual environment"
            cd ..
        fi
        cd ..
    fi
else
    print_error "backend/requirements.txt not found"
fi

# Test 6: Test Docker build
echo ""
echo "Testing Docker Build..."
echo "-------------------------------------"

if command -v docker &> /dev/null; then
    print_info "Building Docker image (this may take a few minutes)..."
    cd backend
    if docker build -t tenggeli-backend-test:latest . > /tmp/docker-build.log 2>&1; then
        print_success "Docker image built successfully"
        
        # Get image size
        IMAGE_SIZE=$(docker images tenggeli-backend-test:latest --format "{{.Size}}")
        print_info "Docker image size: $IMAGE_SIZE"
        
        # Clean up test image
        docker rmi tenggeli-backend-test:latest > /dev/null 2>&1
    else
        print_error "Docker build failed (see /tmp/docker-build.log)"
        print_info "Last 10 lines of build log:"
        tail -10 /tmp/docker-build.log
    fi
    cd ..
else
    print_warning "Docker not available, skipping Docker build test"
fi

# Test 7: Check configuration files
echo ""
echo "Checking Configuration Files..."
echo "-------------------------------------"

CONFIG_FILES=(
    "frontend/vercel.json"
    "frontend/netlify.toml"
    "frontend/env.example"
    "backend/Dockerfile"
    "backend/.dockerignore"
    "backend/railway.json"
    "backend/render.yaml"
    "backend/env.example"
    "docker-compose.yml"
    "DEPLOYMENT.md"
)

for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "$file exists"
    else
        print_error "$file not found"
    fi
done

# Test 8: Check scripts are executable
echo ""
echo "Checking Shell Scripts..."
echo "-------------------------------------"

SCRIPTS=(
    "mount_drive.sh"
    "start_backend.sh"
    "start_frontend.sh"
    "validate_data.sh"
    "process_data.sh"
)

for script in "${SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        if [ -x "$script" ]; then
            print_success "$script is executable"
        else
            print_warning "$script exists but is not executable"
            chmod +x "$script"
            print_info "Made $script executable"
        fi
    else
        print_error "$script not found"
    fi
done

# Test 9: Check environment configuration
echo ""
echo "Checking Environment Configuration..."
echo "-------------------------------------"

# Check if example env files can be used to create actual env files
if [ -f "backend/env.example" ]; then
    print_success "backend/env.example exists"
    if grep -q "SECRET_KEY" backend/env.example; then
        print_success "SECRET_KEY placeholder found in env.example"
    else
        print_warning "SECRET_KEY not found in env.example"
    fi
else
    print_error "backend/env.example not found"
fi

if [ -f "frontend/env.example" ]; then
    print_success "frontend/env.example exists"
else
    print_error "frontend/env.example not found"
fi

# Test 10: Production readiness checklist
echo ""
echo "Production Readiness Checklist..."
echo "-------------------------------------"

# Check if data directories exist
if [ -d "data/processed" ]; then
    FILE_COUNT=$(find data/processed -name "*.tif" 2>/dev/null | wc -l)
    if [ $FILE_COUNT -gt 0 ]; then
        print_success "Processed data available ($FILE_COUNT TIFF files)"
    else
        print_warning "No processed TIFF files found - run ./process_data.sh"
    fi
else
    print_warning "data/processed directory not found - run ./process_data.sh"
fi

# Check documentation
if [ -f "DEPLOYMENT.md" ]; then
    print_success "Deployment documentation exists"
else
    print_error "DEPLOYMENT.md not found"
fi

if [ -f "backend/README_DEPLOYMENT.md" ]; then
    print_success "Backend deployment guide exists"
else
    print_error "Backend deployment guide not found"
fi

if [ -f "frontend/README_DEPLOYMENT.md" ]; then
    print_success "Frontend deployment guide exists"
else
    print_error "Frontend deployment guide not found"
fi

# Summary
echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed! Ready for deployment.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review DEPLOYMENT.md for deployment instructions"
    echo "2. Set up frontend hosting (Vercel/Netlify)"
    echo "3. Deploy backend (Railway/Render/Docker)"
    echo "4. Configure environment variables"
    echo "5. Test production deployment"
    exit 0
else
    echo -e "${YELLOW}⚠ Some tests failed. Please fix issues before deploying.${NC}"
    echo ""
    echo "Common fixes:"
    echo "- Install missing dependencies: npm install, pip install -r requirements.txt"
    echo "- Process data: ./process_data.sh"
    echo "- Check environment files: backend/env.example, frontend/env.example"
    exit 1
fi

