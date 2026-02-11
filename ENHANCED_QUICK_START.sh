#!/bin/bash

#############################################
# BookMySalon - Enhanced Startup Script
# Full application with validation & error handling
#############################################

echo "╔════════════════════════════════════════════════════════╗"
echo "║         BookMySalon - Starting Full Stack              ║"
echo "╚════════════════════════════════════════════════════════╝"

BASE_DIR="/Users/prahladyadav/Desktop/BookMySalon"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Starting MySQL...${NC}"
if ! mysql.server status > /dev/null 2>&1; then
  echo "Starting MySQL service..."
  brew services start mysql || mysql.server start
  sleep 2
else
  echo -e "${GREEN}✓ MySQL already running${NC}"
fi

# Wait for MySQL to be ready
echo "Waiting for MySQL to be ready..."
for i in {1..10}; do
  if mysql -u root -proot -e "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ MySQL is ready${NC}"
    break
  fi
  echo "Attempt $i/10..."
  sleep 1
done

echo -e "${BLUE}Step 2: Ensuring database exists...${NC}"
mysql -u root -proot -e "CREATE DATABASE IF NOT EXISTS bookmysalon;" 2>/dev/null
echo -e "${GREEN}✓ Database ready${NC}"

echo ""
echo -e "${BLUE}Step 3: Starting Backend (Port 8080)...${NC}"
cd "$BASE_DIR/bookmysalon-app"
if [ ! -f "target/bookmysalon-app-1.0.0.jar" ]; then
  echo "Building backend..."
  mvn clean install -DskipTests -q
fi
echo "Starting Spring Boot application..."
java -jar target/bookmysalon-app-1.0.0.jar &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend starting (PID: $BACKEND_PID)${NC}"
sleep 5

echo ""
echo -e "${BLUE}Step 4: Starting Frontend (Port 5173)...${NC}"
cd "$BASE_DIR/frontend"
echo "Starting React development server..."
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend starting (PID: $FRONTEND_PID)${NC}"
sleep 3

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║          ✓ Application is Ready!                       ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Frontend:${NC} http://localhost:5173"
echo -e "${GREEN}Backend:${NC}  http://localhost:8080"
echo -e "${GREEN}Database:${NC} bookmysalon (MySQL)"
echo ""
echo "Test Credentials:"
echo "  Email: customer@test.com | Password: Customer123"
echo "  Email: owner@test.com    | Password: Owner123"
echo ""
echo "Press Ctrl+C to stop all services..."
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
