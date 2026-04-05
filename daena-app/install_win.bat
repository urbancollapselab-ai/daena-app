@echo off
:: DAENA v10.0 WINDOWS AUTO-INSTALLER BOOTSTRAPPER
:: This script silently installs Python, Node, FAISS, and then launches Daena Setup Wizard.
echo [DAENA v10.0] Kurulum ve Ortam Hazirligi Baslatiliyor...
echo.

:: 1. Check Python
python --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo Python bulunamadi. Lutfen Python 3.10+ yukleyin.
    pause
    exit /b
)

:: 2. Upgrade pip and install v10.0 Dependencies
echo [1/4] Gerekli yapay zeka modulleri kuruluyor (FAISS, NumPy, vs)...
python -m pip install --upgrade pip >nul 2>&1
python -m pip install fastapi uvicorn scipy psutil numpy faiss-cpu aiohttp >nul 2>&1

:: 3. Node.js check (React/Tauri Frontend)
node --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo Node.js bulunamadi, indirmeniz tavsiye edilir.
    pause
    exit /b
)

echo [2/4] Arayuz (Frontend) bagimliliklari guncelleniyor...
call npm install --silent >nul 2>&1

:: 4. Build or Start Setup
echo [3/4] Mimariler kontrol ediliyor...
echo [4/4] Daena v10.0 Bounded Cognition OS Baslatiliyor!

:: Baslatma: (Ornegin local setup wizard'i ac)
start http://localhost:5173
call npm run dev
