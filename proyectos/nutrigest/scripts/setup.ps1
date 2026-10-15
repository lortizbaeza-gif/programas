param([switch]$SQLite)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
if (-not (Test-Path -LiteralPath '.env')) {
    Copy-Item -LiteralPath '.env.example' -Destination '.env'
    Write-Host 'Se creó .env. Completa las claves y contraseñas antes de continuar.'
    exit 0
}
if (-not (Test-Path -LiteralPath '.venv/Scripts/python.exe')) {
    py -3.12 -m venv .venv
    if ($LASTEXITCODE -ne 0) { throw 'Se necesita Python 3.12.' }
}
& ./.venv/Scripts/python.exe -m pip install -r backend/requirements.lock.txt
if ($LASTEXITCODE -ne 0) { throw 'No se pudieron instalar las dependencias Python.' }
if ($SQLite) { $env:NUTRIGEST_SQLITE = '1' } else { $env:NUTRIGEST_SQLITE = '0' }
& ./.venv/Scripts/python.exe backend/manage.py migrate --noinput
if ($LASTEXITCODE -ne 0) { throw 'No se pudo aplicar la migración. Revisa PostgreSQL y .env.' }
& ./.venv/Scripts/python.exe backend/manage.py seed_demo
if ($LASTEXITCODE -ne 0) { throw 'Revisa DEMO_PASSWORD en .env.' }
Push-Location -LiteralPath 'frontend'
try {
    npm.cmd ci
    if ($LASTEXITCODE -ne 0) { throw 'No se pudieron instalar las dependencias del frontend.' }
    npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw 'Falló la compilación React.' }
} finally { Pop-Location }
Write-Host 'Preparación completa. Consulta README.md para iniciar backend y frontend.'
