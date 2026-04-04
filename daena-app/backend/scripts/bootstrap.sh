#!/bin/bash
set -e

echo "Starting Daena Bootstrapper for macOS/Linux..."

# Function to check command
check_cmd() {
    command -v "$1" >/dev/null 2>&1
}

# 1. Check/Install Python
if check_cmd python3; then
    echo "[✓] Python 3 is already installed."
else
    echo "[!] Python 3 missing. Attempting to install via Homebrew..."
    if ! check_cmd brew; then
        echo "[!] Homebrew missing. Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    brew install python
    echo "[✓] Python 3 installed."
fi

# 2. Check/Install Node.js
if check_cmd node; then
    echo "[✓] Node.js is already installed."
else
    echo "[!] Node.js missing. Attempting to install via Homebrew..."
    if ! check_cmd brew; then
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    brew install node
    echo "[✓] Node.js installed."
fi

# 3. Check/Install Claude Code
if check_cmd claude; then
    echo "[✓] Claude Code is already installed."
else
    echo "[!] Claude Code missing. Installing via npm..."
    npm install -g @anthropic-ai/claude-code
    echo "[✓] Claude Code installed."
fi

# 4. Install Python requirements
echo "Installing Python Backend Requirements..."
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
pip3 install -r "$DIR/../requirements.txt" || pip3 install httpx aiohttp fastapi uvicorn sqlite3 memory-profiler

echo "=========================================="
echo "BOOTSTRAP COMPLETE! System is fully armed."
echo "=========================================="
exit 0
