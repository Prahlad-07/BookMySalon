#!/bin/bash

echo "═════════════════════════════════════════════════════════"
echo "  BookMySalon - Complete Setup with Test Users"
echo "═════════════════════════════════════════════════════════"

BASE_DIR="/Users/prahladyadav/Desktop/BookMySalon"
BACKEND_JAR="$BASE_DIR/bookmysalon-app/target/bookmysalon-app-1.0.0.jar"
FRONTEND_DIR="$BASE_DIR/frontend"

# Kill any existing processes
echo "Cleaning up existing processes..."
pkill -f "java.*bookmysalon" || true
sleep 2

# Start Backend
echo "Starting Backend (Port 8080)..."
cd "$BASE_DIR/bookmysalon-app"
java -jar "$BACKEND_JAR" > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
for i in {1..30}; do
  if curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
    echo "✓ Backend is ready!"
    break
  fi
  echo "  Attempt $i/30 - Waiting..."
  sleep 1
done

# Create Test Users via API
echo ""
echo "Creating test users..."

# Create Customer Account
echo "Creating customer account..."
curl -s -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "email": "customer@test.com",
    "phone": "9876543210",
    "password": "Customer123",
    "role": "CUSTOMER"
  }' | jq . 2>/dev/null || echo "Created/Already exists"

# Create Owner Account
echo "Creating salon owner account..."
curl -s -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Owner",
    "email": "owner@test.com",
    "phone": "9876543211",
    "password": "Owner123",
    "role": "SALON_OWNER"
  }' | jq . 2>/dev/null || echo "Created/Already exists"

echo ""
echo "═════════════════════════════════════════════════════════"
echo "✓ Backend is running on: http://localhost:8080"
echo ""
echo "Test Credentials:"
echo "  Customer:"
echo "    Email: customer@test.com"
echo "    Password: Customer123"
echo ""
echo "  Salon Owner:"
echo "    Email: owner@test.com"
echo "    Password: Owner123"
echo ""
echo "Starting Frontend (Port 5173)..."
cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "═════════════════════════════════════════════════════════"
echo "✓ Application is ready!"
echo "  Frontend: http://localhost:5173"
echo "  Backend: http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop all services"
echo "═════════════════════════════════════════════════════════"

wait $BACKEND_PID $FRONTEND_PID
