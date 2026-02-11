#!/bin/bash

echo "════════════════════════════════════════════════════════════════"
echo "        🚀 BookMySalon - Complete Setup & Launch"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to print status
print_status() {
    echo -e "${BLUE}[*]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Step 1: Check if MySQL is running
print_status "Checking MySQL connection..."
if mysql -h localhost -u root -p -e "SELECT 1" >/dev/null 2>&1; then
    print_success "MySQL is running"
else
    print_warning "MySQL is not running. Starting MySQL..."
    
    if command -v brew &> /dev/null; then
        brew services start mysql >/dev/null 2>&1
        sleep 3
        if mysql -h localhost -u root -p -e "SELECT 1" >/dev/null 2>&1; then
            print_success "MySQL started successfully"
        else
            print_error "Failed to start MySQL. Please check your MySQL installation."
            exit 1
        fi
    else
        print_error "MySQL is not running and Homebrew is not found. Please start MySQL manually."
        exit 1
    fi
fi

# Step 2: Create database
print_status "Creating bookmysalon database..."
mysql -h localhost -u root -p -e "CREATE DATABASE IF NOT EXISTS bookmysalon;" 2>/dev/null
if [ $? -eq 0 ]; then
    print_success "Database created/verified"
else
    print_warning "Database creation may have had issues, but continuing..."
fi

# Step 3: Start the backend
echo ""
print_status "Starting BookMySalon Backend..."
print_status "Application will be available at: http://localhost:8080"
echo ""

cd "$(dirname "$0")/bookmysalon-app"
java -jar target/bookmysalon-app-1.0.0.jar &
BACKEND_PID=$!

sleep 3

# Check if backend started successfully
if kill -0 $BACKEND_PID 2>/dev/null; then
    print_success "Backend started (PID: $BACKEND_PID)"
else
    print_error "Failed to start backend"
    exit 1
fi

# Step 4: Start the frontend
echo ""
print_status "Starting BookMySalon Frontend..."

cd "$(dirname "$0")/frontend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_status "Installing frontend dependencies..."
    npm install --silent >/dev/null 2>&1
    print_success "Dependencies installed"
fi

print_status "Frontend will be available at: http://localhost:5173"
npm run dev &
FRONTEND_PID=$!

sleep 3

# Check if frontend started
if kill -0 $FRONTEND_PID 2>/dev/null; then
    print_success "Frontend started (PID: $FRONTEND_PID)"
else
    print_warning "Frontend might have issues, check manually"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo -e "${GREEN}✓ BookMySalon is running!${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📱 Frontend:  http://localhost:5173"
echo "🔌 Backend:   http://localhost:8080"
echo "💾 Database:  localhost:3306/bookmysalon"
echo ""
echo "📝 Test Credentials:"
echo "   Email:    john@example.com"
echo "   Password: Password@123"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for all background processes
wait

