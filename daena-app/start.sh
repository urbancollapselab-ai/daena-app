#!/bin/bash
# ═══════════════════════════════════════════════
# DAENA — Start Script
# Starts both backend (Python) and frontend (Vite)
# ═══════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
GOLD='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════╗"
echo "║       🔥 DAENA — AI Command Center      ║"
echo "║       Starting all services...           ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# Check .env
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        echo -e "${GOLD}[!] No .env found. Copying from .env.example${NC}"
        cp backend/.env.example backend/.env
        echo -e "${RED}[!] Please edit backend/.env with your API keys${NC}"
    fi
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}[✗] Python 3 is required but not installed.${NC}"
    exit 1
fi

# Check Node
if ! command -v node &> /dev/null; then
    echo -e "${RED}[✗] Node.js is required but not installed.${NC}"
    exit 1
fi

# Install npm deps if needed
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}[*] Installing npm dependencies...${NC}"
    npm install
fi

# Start backend
echo -e "${GREEN}[1/2] Starting Python backend on port 8910...${NC}"
python3 backend/server.py &
BACKEND_PID=$!
echo -e "${GREEN}      PID: $BACKEND_PID${NC}"

# Wait for backend
sleep 2

# Start frontend
echo -e "${GREEN}[2/2] Starting Vite frontend on port 1420...${NC}"
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}      PID: $FRONTEND_PID${NC}"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ DAENA is running!                    ║${NC}"
echo -e "${GREEN}║                                          ║${NC}"
echo -e "${GREEN}║  Frontend: http://localhost:1420          ║${NC}"
echo -e "${GREEN}║  Backend:  http://localhost:8910          ║${NC}"
echo -e "${GREEN}║                                          ║${NC}"
echo -e "${GREEN}║  Press Ctrl+C to stop all services       ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""

# Trap Ctrl+C
trap "echo -e '\n${RED}Stopping Daena...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

# Wait
wait
