$ErrorActionPreference = 'Stop'
$portalNode = Get-Command node.exe -ErrorAction SilentlyContinue
if (-not $portalNode) { throw 'No se encuentra Node.js. Instala la version LTS desde https://nodejs.org/.' }
$portalUrl = 'http://localhost:5502/'
$portalPidPath = Join-Path $PSScriptRoot '.servidor.pid'
$portalAlreadyRunning = $false
try {
    $portalResponse = Invoke-WebRequest -Uri $portalUrl -UseBasicParsing -TimeoutSec 2
    if ($portalResponse.Content -match 'Tu perspectiva del mundo') { $portalAlreadyRunning = $true }
    else { throw 'El puerto 5502 pertenece a otra aplicacion.' }
} catch {
    if ($_.Exception.Message -eq 'El puerto 5502 pertenece a otra aplicacion.') { throw }
}
if (-not $portalAlreadyRunning) {
    $portalScript = Join-Path $PSScriptRoot 'servidor.cjs'
    $portalProcess = Start-Process -FilePath $portalNode.Source -ArgumentList ('"' + $portalScript + '"') -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -PassThru
    Set-Content -LiteralPath $portalPidPath -Value $portalProcess.Id
    $portalReady = $false
    for ($portalTry = 0; $portalTry -lt 20; $portalTry++) {
        Start-Sleep -Milliseconds 250
        try {
            $portalResponse = Invoke-WebRequest -Uri $portalUrl -UseBasicParsing -TimeoutSec 1
            if ($portalResponse.Content -match 'Tu perspectiva del mundo') { $portalReady = $true; break }
        } catch {}
        if ($portalProcess.HasExited) { throw 'El servidor no pudo iniciar. Comprueba que el puerto 5502 este libre.' }
    }
    if (-not $portalReady) { throw 'El servidor no respondio a tiempo.' }
}
Start-Process $portalUrl
Write-Host 'Portal abierto. Para detener el servidor utiliza Detener.cmd.'
