#!/bin/bash

# Frontend Test Runner Script
# Usage: ./run-tests.sh [option]

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================${NC}"
echo -e "${BLUE}Frontend Test Suite Runner${NC}"
echo -e "${BLUE}==================================${NC}"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${RED}node_modules not found. Installing dependencies...${NC}"
    npm install
fi

# Parse command line arguments
COMMAND=${1:-"all"}

case $COMMAND in
    "all"|"")
        echo -e "${GREEN}Running all tests...${NC}"
        npm test
        ;;
    
    "watch")
        echo -e "${GREEN}Running tests in watch mode...${NC}"
        npm test
        ;;
    
    "run"|"ci")
        echo -e "${GREEN}Running tests once (CI mode)...${NC}"
        npm run test:run
        ;;
    
    "coverage"|"cov")
        echo -e "${GREEN}Running tests with coverage...${NC}"
        npm run test:coverage
        echo -e "${GREEN}Opening coverage report...${NC}"
        open coverage/index.html 2>/dev/null || xdg-open coverage/index.html 2>/dev/null || echo "Open coverage/index.html manually"
        ;;
    
    "ui")
        echo -e "${GREEN}Starting Vitest UI...${NC}"
        npm run test:ui
        ;;
    
    "components")
        echo -e "${GREEN}Running component tests...${NC}"
        npm test -- __tests__/components/
        ;;
    
    "pages")
        echo -e "${GREEN}Running page tests...${NC}"
        npm test -- __tests__/pages/
        ;;
    
    "integration")
        echo -e "${GREEN}Running integration tests...${NC}"
        npm test -- __tests__/integration/
        ;;
    
    "patient")
        echo -e "${GREEN}Running patient-related tests...${NC}"
        npm test -- patient
        ;;
    
    "doctor")
        echo -e "${GREEN}Running doctor-related tests...${NC}"
        npm test -- doctor
        ;;
    
    "auth")
        echo -e "${GREEN}Running authentication tests...${NC}"
        npm test -- -t "auth"
        ;;
    
    "help"|"-h"|"--help")
        echo -e "${BLUE}Usage: ./run-tests.sh [option]${NC}"
        echo ""
        echo "Options:"
        echo "  all, (default)    - Run all tests in watch mode"
        echo "  watch            - Run tests in watch mode"
        echo "  run, ci          - Run tests once (for CI)"
        echo "  coverage, cov    - Run with coverage report"
        echo "  ui               - Start Vitest UI"
        echo "  components       - Run component tests only"
        echo "  pages            - Run page tests only"
        echo "  integration      - Run integration tests only"
        echo "  patient          - Run patient-related tests"
        echo "  doctor           - Run doctor-related tests"
        echo "  auth             - Run authentication tests"
        echo "  help             - Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./run-tests.sh"
        echo "  ./run-tests.sh coverage"
        echo "  ./run-tests.sh patient"
        ;;
    
    *)
        echo -e "${RED}Unknown command: $COMMAND${NC}"
        echo "Run './run-tests.sh help' for usage information"
        exit 1
        ;;
esac

echo -e "${BLUE}==================================${NC}"
echo -e "${GREEN}Done!${NC}"
