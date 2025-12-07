#!/bin/bash

echo "🧪 Running SAKO PMS Test Suite"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backend tests
echo -e "${YELLOW}Running Backend Tests...${NC}"
cd backend
if npm test; then
    echo -e "${GREEN}✅ Backend tests passed!${NC}"
else
    echo -e "${RED}❌ Backend tests failed!${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Running Frontend Tests...${NC}"
cd ../frontend
if npm test -- --run; then
    echo -e "${GREEN}✅ Frontend tests passed!${NC}"
else
    echo -e "${RED}❌ Frontend tests failed!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}================================"
echo "✅ All tests passed!"
echo "================================"
echo -e "${NC}"

