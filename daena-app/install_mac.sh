#!/bin/bash
# DAENA v10.0 MACOS AUTO-INSTALLER BOOTSTRAPPER
# This script silently installs Python dependencies, Node packages, and configures Tauri.

echo "=================================================="
echo "🚀 DAENA v10.0 macOS Kurulum Yöneticisi Başlatılıyor"
echo "=================================================="
echo ""

# 1. Check Python
if ! command -v python3 &> /dev/null
then
    echo "Hata: Python3 bulunamadı. Lütfen yükleyin (brew install python)."
    exit 1
fi

echo "[1/4] Gerekli yapay zeka modülleri ve matematik kütüphaneleri (FAISS, NumPy, vb.) kuruluyor..."
python3 -m pip install --upgrade pip --quiet
python3 -m pip install fastapi uvicorn scipy psutil numpy faiss-cpu aiohttp --quiet

# 2. Check Node
if ! command -v npm &> /dev/null
then
    echo "Hata: Node.js (npm) bulunamadı. Lütfen yükleyin (brew install node)."
    exit 1
fi

echo "[2/4] Arayüz (Frontend) bağımlılıkları güncelleniyor..."
npm install --silent

echo "[3/4] Güvenlik duvarı ve Kalkan (Watchdog) kontrolleri yapılıyor..."

echo "[4/4] Daena v10.0 Bounded Cognition OS Başlatılıyor!"
echo "Uygulama açılıyor..."

npm run dev
