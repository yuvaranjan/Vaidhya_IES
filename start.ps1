# Project Vaidhya — one-click start (Windows).
#
#   Double-click start.bat, or:  .\start.ps1
#   .\start.ps1 -Check     verify the machine is ready, start nothing
#   .\start.ps1 -WebOnly   portal only, no Python service (mock AI mode)
#
# Safe to run repeatedly. It installs only what is missing.

param(
  [switch]$Check,
  [switch]$WebOnly
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
Set-Location $root

function Say($msg)  { Write-Host "  $msg" }
function Ok($msg)   { Write-Host "  [ok] $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "  [!!] $msg" -ForegroundColor Yellow }
function Die($msg)  { Write-Host "  [xx] $msg" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "Project Vaidhya" -ForegroundColor Cyan
Write-Host "Edge-AI telemedicine - starting up" -ForegroundColor Cyan
Write-Host ""

# --- 1. prerequisites --------------------------------------------------------

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) { Die "Node.js not found. Install Node 20+ from https://nodejs.org and re-run." }
$nodeMajor = [int](((node -v) -replace '^v','') -split '\.')[0]
if ($nodeMajor -lt 20) { Die "Node $(node -v) is too old. Need 20 or newer." }
Ok "node $(node -v)"

$python = $null
if (-not $WebOnly) {
  foreach ($candidate in @("python", "py")) {
    $c = Get-Command $candidate -ErrorAction SilentlyContinue
    if ($c) { $python = $c.Source; break }
  }
  if (-not $python) {
    Warn "Python not found - starting the web portal only (mock AI mode)."
    $WebOnly = $true
  } else {
    Ok "python $((& $python --version) -replace 'Python ','')"
  }
}

# --- 2. environment files ----------------------------------------------------

$webEnv = Join-Path $root "apps\web\.env.local"
if (-not (Test-Path $webEnv)) {
  Copy-Item (Join-Path $root "apps\web\.env.local.example") $webEnv
  # A session secret must exist and must be at least 32 chars, so generate one.
  $secret = -join ((1..48) | ForEach-Object { "0123456789abcdef"[(Get-Random -Maximum 16)] })
  (Get-Content $webEnv) -replace '^SESSION_SECRET=$', "SESSION_SECRET=$secret" |
    Set-Content $webEnv -Encoding utf8
  Ok "created apps\web\.env.local (SESSION_SECRET generated)"
} else {
  Ok "apps\web\.env.local exists"
}

$edgeEnv = Join-Path $root "services\edge-ai\.env"
if (-not $WebOnly -and -not (Test-Path $edgeEnv)) {
  Copy-Item (Join-Path $root "services\edge-ai\.env.example") $edgeEnv
  Ok "created services\edge-ai\.env"
}

if ((Get-Content $webEnv -Raw) -notmatch 'SUPABASE_URL=\S') {
  Warn "SUPABASE_URL is empty - anything that touches the database will fail."
  Say  "Create a Supabase project, run db\001_schema.sql then db\002_seed.sql,"
  Say  "and paste the URL + service key into apps\web\.env.local. See SETUP.md."
}

# --- 3. dependencies ---------------------------------------------------------

if (-not (Test-Path (Join-Path $root "node_modules"))) {
  Say "installing npm packages (first run, ~1 min)..."
  npm install --silent
  if ($LASTEXITCODE -ne 0) { Die "npm install failed." }
  Ok "npm packages installed"
} else {
  Ok "npm packages present"
}

$venv = Join-Path $root "services\edge-ai\.venv"
$venvPy = Join-Path $venv "Scripts\python.exe"
if (-not $WebOnly) {
  if (-not (Test-Path $venvPy)) {
    Say "creating the Python venv and installing packages (first run, ~2 min)..."
    & $python -m venv $venv
    & $venvPy -m pip install --quiet --upgrade pip
    & $venvPy -m pip install --quiet -r (Join-Path $root "services\edge-ai\requirements.txt")
    if ($LASTEXITCODE -ne 0) { Die "pip install failed." }
    Ok "python packages installed"
  } else {
    Ok "python venv present"
  }
}

# --- 4. refresh the generated docs ------------------------------------------

node scripts\update-progress.mjs | Out-Null
node scripts\check-setup.mjs --warn | Out-Null
Ok "progress board regenerated"

if ($Check) {
  Write-Host ""
  Ok "Everything is ready. Run .\start.ps1 to launch."
  Write-Host ""
  exit 0
}

# --- 5. launch ---------------------------------------------------------------

Write-Host ""
Say "starting servers in separate windows..."

if (-not $WebOnly) {
  Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "Set-Location '$root\services\edge-ai'; " +
    "& '$venvPy' -m uvicorn main:app --reload --port 8000"
  ) -WindowStyle Normal
  Ok "edge-ai   -> http://localhost:8000/health"

  Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "Set-Location '$root\multi_agent_specialist'; " +
    "& '.\venv\Scripts\python.exe' api.py"
  ) -WindowStyle Normal
  Ok "specialist-> http://localhost:8002/consult"
}

Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "Set-Location '$root'; npm run dev"
) -WindowStyle Normal
Ok "portal    -> http://localhost:3000"

# Wait for Next to answer before opening a browser at a dead port.
Say "waiting for the portal..."
$up = $false
foreach ($i in 1..60) {
  try {
    Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -UseBasicParsing | Out-Null
    $up = $true; break
  } catch { Start-Sleep -Seconds 1 }
}

if ($up) {
  Start-Process "http://localhost:3000"
  Ok "portal is up"
} else {
  Warn "portal did not answer within 60s - check the npm window for errors."
}

Write-Host ""
Write-Host "  Demo logins" -ForegroundColor Cyan
Write-Host "    patient   9000000001   OTP 123456"
Write-Host "    doctor    9100000001   password vaidhya123"
Write-Host ""
Write-Host "  Close the two server windows to stop. See SETUP.md for details."
Write-Host ""
