#!/bin/bash
# ═══════════════════════════════════════════════
# DAENA — Cross-Platform Build Script
# Builds desktop & mobile apps
# ═══════════════════════════════════════════════

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
GOLD='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════╗"
echo "║  🔥 DAENA — Cross-Platform Builder       ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# Check prerequisites
check_tool() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "${RED}[✗] $1 is required but not found${NC}"
        echo "    Install: $2"
        return 1
    fi
    echo -e "${GREEN}[✓] $1 found$(${NC})"
    return 0
}

PLATFORM="$1"

if [ -z "$PLATFORM" ]; then
    echo "Usage: ./build.sh [platform]"
    echo ""
    echo "Platforms:"
    echo "  macos     Build macOS .dmg application"
    echo "  windows   Build Windows .msi/.exe installer"
    echo "  linux     Build Linux .deb/.AppImage"
    echo "  ios       Build iOS app (requires Xcode)"
    echo "  android   Build Android APK (requires Android Studio)"
    echo "  web       Build web version only (no wrapper)"
    echo "  all       Build all desktop platforms"
    echo ""
    echo "Examples:"
    echo "  ./build.sh macos"
    echo "  ./build.sh ios"
    echo ""
    exit 0
fi

# ── Prerequisites ──────────────────────────────
echo -e "${BLUE}[1/4] Checking prerequisites...${NC}"

check_tool "node" "https://nodejs.org"
check_tool "npm" "comes with node"
check_tool "rustc" "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
check_tool "cargo" "comes with rustc"

# Install Tauri CLI if needed
if ! command -v cargo-tauri &> /dev/null; then
    echo -e "${GOLD}[*] Installing Tauri CLI...${NC}"
    cargo install tauri-cli --version "^2.0"
fi

# ── Install Dependencies ──────────────────────
echo -e "${BLUE}[2/4] Installing dependencies...${NC}"
npm install

# ── Generate Icons ────────────────────────────
echo -e "${BLUE}[3/4] Generating app icons...${NC}"
if [ ! -f "src-tauri/icons/icon.png" ]; then
    # Create a simple icon from SVG
    if command -v sips &> /dev/null; then
        # macOS: use sips to create PNG from SVG (basic)
        mkdir -p src-tauri/icons
        # Create a basic 1024x1024 icon
        python3 -c "
import subprocess, os

svg_content = '''<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\" fill=\"none\">
  <defs>
    <linearGradient id=\"g\" x1=\"0\" y1=\"0\" x2=\"1024\" y2=\"1024\">
      <stop offset=\"0%\" stop-color=\"#6C63FF\"/>
      <stop offset=\"100%\" stop-color=\"#00D4AA\"/>
    </linearGradient>
  </defs>
  <rect width=\"1024\" height=\"1024\" rx=\"200\" fill=\"url(#g)\"/>
  <text x=\"512\" y=\"700\" text-anchor=\"middle\" font-family=\"Arial\" font-weight=\"700\" font-size=\"520\" fill=\"white\">D</text>
</svg>'''

svg_path = 'src-tauri/icons/icon.svg'
with open(svg_path, 'w') as f:
    f.write(svg_content)

print('SVG icon created. Run: cargo tauri icon src-tauri/icons/icon.svg')
"
        # Let Tauri generate all icon sizes
        cargo tauri icon src-tauri/icons/icon.svg 2>/dev/null || echo "  Icon generation skipped (will use defaults)"
    fi
fi

# ── Build ─────────────────────────────────────
echo -e "${BLUE}[4/4] Building for ${PLATFORM}...${NC}"

case "$PLATFORM" in
    macos)
        echo -e "${GREEN}Building macOS .dmg...${NC}"
        cargo tauri build --target aarch64-apple-darwin 2>&1 || cargo tauri build 2>&1
        echo ""
        echo -e "${GREEN}✅ macOS build complete!${NC}"
        echo -e "   Output: src-tauri/target/release/bundle/dmg/"
        ls -la src-tauri/target/release/bundle/dmg/*.dmg 2>/dev/null || true
        ;;

    windows)
        echo -e "${GREEN}Building Windows .msi + .exe...${NC}"
        echo -e "${GOLD}Note: Cross-compilation from macOS to Windows requires additional setup.${NC}"
        echo "  Option 1: Build on a Windows machine"
        echo "  Option 2: Use GitHub Actions CI/CD"
        echo ""
        echo "To build on Windows, install:"
        echo "  1. Rust: https://rustup.rs"
        echo "  2. Node.js: https://nodejs.org"
        echo "  3. Run: cargo tauri build"
        ;;

    linux)
        echo -e "${GREEN}Building Linux .deb + .AppImage...${NC}"
        echo -e "${GOLD}Note: Cross-compilation from macOS to Linux requires additional setup.${NC}"
        echo "  Option 1: Build on a Linux machine"
        echo "  Option 2: Use GitHub Actions CI/CD"
        echo ""
        echo "To build on Linux, install:"
        echo "  1. Rust: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
        echo "  2. System deps: sudo apt install libgtk-3-dev libwebkit2gtk-4.1-dev"
        echo "  3. Run: cargo tauri build"
        ;;

    ios)
        echo -e "${GREEN}Building iOS app...${NC}"
        if ! command -v xcrun &> /dev/null; then
            echo -e "${RED}[✗] Xcode is required for iOS builds${NC}"
            exit 1
        fi

        # Initialize Tauri iOS if not done
        if [ ! -d "src-tauri/gen/apple" ]; then
            echo -e "${GOLD}[*] Initializing Tauri iOS project...${NC}"
            cargo tauri ios init
        fi

        echo -e "${GREEN}Building iOS (development)...${NC}"
        cargo tauri ios build --open
        echo ""
        echo -e "${GREEN}✅ iOS project opened in Xcode!${NC}"
        echo "  1. Select your signing team in Xcode"
        echo "  2. Connect your iPhone"
        echo "  3. Build & Run (⌘+R)"
        ;;

    android)
        echo -e "${GREEN}Building Android APK...${NC}"
        if [ -z "$ANDROID_HOME" ]; then
            echo -e "${RED}[✗] Android SDK not found${NC}"
            echo "  Install Android Studio: https://developer.android.com/studio"
            echo "  Set ANDROID_HOME environment variable"
            exit 1
        fi

        # Initialize Tauri Android if not done
        if [ ! -d "src-tauri/gen/android" ]; then
            echo -e "${GOLD}[*] Initializing Tauri Android project...${NC}"
            cargo tauri android init
        fi

        echo -e "${GREEN}Building Android APK...${NC}"
        cargo tauri android build
        echo ""
        echo -e "${GREEN}✅ Android build complete!${NC}"
        echo "  Output: src-tauri/gen/android/app/build/outputs/apk/"
        ;;

    web)
        echo -e "${GREEN}Building web version...${NC}"
        npm run build
        echo ""
        echo -e "${GREEN}✅ Web build complete!${NC}"
        echo "  Output: dist/"
        echo "  Preview: npm run preview"
        ;;

    all)
        echo -e "${GREEN}Building all desktop platforms...${NC}"
        $0 macos
        echo ""
        echo -e "${GOLD}[!] Windows and Linux builds require their native platforms.${NC}"
        echo "    Use GitHub Actions for cross-platform CI/CD."
        ;;

    *)
        echo -e "${RED}Unknown platform: $PLATFORM${NC}"
        echo "Run ./build.sh without arguments for help."
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Build complete! 🎉                      ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
