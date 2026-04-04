param()
$ErrorActionPreference = "Stop"
Write-Host "Starting Daena Bootstrapper for Windows..."

function Check-Command {
    param([string]$name)
    try {
        $null = Get-Command $name -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

# 1. Install Winget Dependencies if missing
if (-not (Check-Command "winget")) {
    Write-Host "[!] Winget missing. Cannot automate installation easily without network downloads. Please install App Installer from Microsoft Store."
}

# 2. Check/Install Python
if (Check-Command "python") {
    Write-Host "[✓] Python is already installed."
} else {
    Write-Host "[!] Python missing. Attempting to install via winget..."
    winget install --id Python.Python.3.11 --silent --accept-package-agreements --accept-source-agreements
    Write-Host "[✓] Python installed."
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

# 3. Check/Install Node.js
if (Check-Command "node") {
    Write-Host "[✓] Node.js is already installed."
} else {
    Write-Host "[!] Node.js missing. Attempting to install via winget..."
    winget install --id OpenJS.NodeJS -e --silent
    Write-Host "[✓] Node.js installed."
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

# 4. Check/Install Claude Code
if (Check-Command "claude") {
    Write-Host "[✓] Claude Code is already installed."
} else {
    Write-Host "[!] Claude Code missing. Installing via npm..."
    npm install -g @anthropic-ai/claude-code
    Write-Host "[✓] Claude Code installed."
}

# 5. Install Python requirements
Write-Host "Installing Python Backend Requirements..."
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$reqPath = Join-Path $scriptDir "..\requirements.txt"
if (Test-Path $reqPath) {
    # Try py or python
    if (Check-Command "py") {
        py -m pip install -r $reqPath
    } else {
        python -m pip install -r $reqPath
    }
}

Write-Host "=========================================="
Write-Host "BOOTSTRAP COMPLETE! System is fully armed."
Write-Host "=========================================="
exit 0
