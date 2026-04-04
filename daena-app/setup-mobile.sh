#!/bin/bash
# ═══════════════════════════════════════════════
# DAENA — Mobile Setup Script
# Sets up iOS and Android build environments
# ═══════════════════════════════════════════════

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
GOLD='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

PLATFORM="$1"

if [ -z "$PLATFORM" ]; then
    echo "Usage: ./setup-mobile.sh [ios|android|both]"
    exit 0
fi

# ── iOS Setup ──────────────────────────────────
setup_ios() {
    echo -e "${BLUE}[iOS] Setting up iOS build environment...${NC}"
    
    # Check Xcode
    if ! xcodebuild -version &>/dev/null; then
        echo -e "${RED}[✗] Full Xcode is required for iOS builds${NC}"
        echo "    1. Install Xcode from App Store"
        echo "    2. Open Xcode and accept the license"
        echo "    3. Run: sudo xcode-select -s /Applications/Xcode.app"
        echo "    4. Run: xcodebuild -runFirstLaunch"
        return 1
    fi
    echo -e "${GREEN}[✓] Xcode found${NC}"
    
    # Rust iOS targets
    echo -e "${BLUE}[*] Adding Rust iOS targets...${NC}"
    rustup target add aarch64-apple-ios aarch64-apple-ios-sim
    
    # CocoaPods
    if ! command -v pod &>/dev/null; then
        echo -e "${BLUE}[*] Installing CocoaPods...${NC}"
        brew install cocoapods
    fi
    echo -e "${GREEN}[✓] CocoaPods found${NC}"
    
    # Init iOS project
    if [ ! -d "src-tauri/gen/apple" ]; then
        echo -e "${BLUE}[*] Initializing iOS project...${NC}"
        cargo tauri ios init
    fi
    echo -e "${GREEN}[✓] iOS project ready${NC}"
    
    echo ""
    echo -e "${GREEN}═══ iOS Setup Complete! ═══${NC}"
    echo ""
    echo "To build iOS:"
    echo "  cargo tauri ios build"
    echo ""
    echo "To run on simulator:"
    echo "  cargo tauri ios dev"
    echo ""
    echo "To open in Xcode:"
    echo "  open src-tauri/gen/apple/daena.xcodeproj"
    echo ""
    echo "Then in Xcode:"
    echo "  1. Select your Signing Team"
    echo "  2. Connect iPhone or select Simulator"
    echo "  3. Press ⌘+R to build & run"
}

# ── Android Setup ──────────────────────────────
setup_android() {
    echo -e "${BLUE}[Android] Setting up Android build environment...${NC}"
    
    # Check Java
    if ! java -version &>/dev/null 2>&1; then
        echo -e "${BLUE}[*] Installing Java 17 (Temurin)...${NC}"
        brew install --cask temurin@17
    fi
    
    JAVA_HOME=$(/usr/libexec/java_home -v 17 2>/dev/null || echo "")
    if [ -z "$JAVA_HOME" ]; then
        echo -e "${RED}[✗] Java 17 not found after install${NC}"
        echo "    Install manually: brew install --cask temurin@17"
        return 1
    fi
    echo -e "${GREEN}[✓] Java found: $JAVA_HOME${NC}"
    
    # Android SDK
    ANDROID_HOME="$HOME/Library/Android/sdk"
    if [ ! -d "$ANDROID_HOME" ]; then
        echo -e "${BLUE}[*] Installing Android SDK...${NC}"
        
        # Install Android command line tools
        brew install --cask android-commandlinetools 2>/dev/null || {
            echo -e "${GOLD}[!] Auto-install failed. Manual setup:${NC}"
            echo "    1. Install Android Studio: https://developer.android.com/studio"
            echo "    2. Open Android Studio > SDK Manager"
            echo "    3. Install Android SDK 34+"
            echo "    4. Set ANDROID_HOME=$HOME/Library/Android/sdk"
            return 1
        }
    fi
    echo -e "${GREEN}[✓] Android SDK found: $ANDROID_HOME${NC}"
    
    # Accept licenses
    yes | "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" --licenses 2>/dev/null || true
    
    # Install NDK
    echo -e "${BLUE}[*] Installing Android NDK...${NC}"
    "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" \
        "ndk;27.0.12077973" \
        "platforms;android-34" \
        "build-tools;34.0.0" \
        2>/dev/null || true
    
    NDK_HOME="$ANDROID_HOME/ndk/27.0.12077973"
    
    # Rust Android targets
    echo -e "${BLUE}[*] Adding Rust Android targets...${NC}"
    rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android i686-linux-android
    
    # Init Android project
    if [ ! -d "src-tauri/gen/android" ]; then
        echo -e "${BLUE}[*] Initializing Android project...${NC}"
        ANDROID_HOME="$ANDROID_HOME" \
        NDK_HOME="$NDK_HOME" \
        JAVA_HOME="$JAVA_HOME" \
        cargo tauri android init
    fi
    echo -e "${GREEN}[✓] Android project ready${NC}"
    
    echo ""
    echo -e "${GREEN}═══ Android Setup Complete! ═══${NC}"
    echo ""
    echo "Add to your ~/.zshrc:"
    echo "  export JAVA_HOME=\"$JAVA_HOME\""
    echo "  export ANDROID_HOME=\"$ANDROID_HOME\""
    echo "  export NDK_HOME=\"$NDK_HOME\""
    echo ""
    echo "To build APK:"
    echo "  cargo tauri android build"
    echo ""
    echo "To run on emulator/device:"
    echo "  cargo tauri android dev"
}

# ── Run ────────────────────────────────────────
case "$PLATFORM" in
    ios)
        setup_ios
        ;;
    android)
        setup_android
        ;;
    both)
        setup_ios
        echo ""
        setup_android
        ;;
    *)
        echo -e "${RED}Unknown platform: $PLATFORM${NC}"
        echo "Usage: ./setup-mobile.sh [ios|android|both]"
        exit 1
        ;;
esac
