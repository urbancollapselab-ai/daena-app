#!/bin/bash
set -e
# DAENA v10.0: PyInstaller Sidecar Builder
# Bu script, server.py'yi otonom bir Unix/Windows dosyasına dönüştürüp Tauri'nin içine yerleştirir.

echo "=================================================="
echo "🚀 DAENA v10.0 Native Sidecar (PyInstaller) Derleyicisi"
echo "=================================================="

# Go to backend dir
cd "$(dirname "$0")/backend" || exit 1

echo "[1/4] PyInstaller ve Bağımlılıklar kuruluyor..."
python -m pip install -r requirements.txt --quiet
python -m pip install pyinstaller fastapi uvicorn pydantic --quiet

echo "[2/4] Python beyni (--onedir) modunda Donduruluyor... (Bu işlem uzun sürebilir)"

# Build the payload using PyInstaller
# --onedir keeps it fast for startup so it doesn't extract large FAISS binaries to temp folder every time
python -m PyInstaller --onedir --noconfirm --name daenaserver \
  --hidden-import scipy \
  --hidden-import faiss \
  --hidden-import fastapi \
  --hidden-import uvicorn \
  --hidden-import aiohttp \
  --hidden-import psutil \
  server.py

echo "[3/4] Tauri Sidecar dizini hazırlanıyor..."
BIN_DIR="../src-tauri/bin"
mkdir -p "$BIN_DIR"

echo "[4/4] Sidecar sisteme yerleştiriliyor..."
# Copy the compiled directory to Tauri (Without target suffixes since we use resources mapping, not externalBin)
cp -R dist/daenaserver "$BIN_DIR/daenaserver"

echo "✅ Tamamlandı! Artık Tauri, Python olmadan kendi kopyası üzerinden çalışabilir."
echo "Derleme işlemini görmek için 'npm run tauri build' yazabilirsiniz."
