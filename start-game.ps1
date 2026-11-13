$ErrorActionPreference = 'Stop'
$gameDirectory = $PSScriptRoot
$gameUrl = 'http://127.0.0.1:4173/'
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCommand) { Write-Error 'Node.js 18+ is required. Install Node.js and try again.'; exit 1 }
$serverReady = $false
try { $response = Invoke-WebRequest -Uri $gameUrl -UseBasicParsing -TimeoutSec 2; $serverReady = $response.Content.Contains('little-stone-club') -or $response.Content.Contains('game.js') } catch {}
if (-not $serverReady) {
    Start-Process -FilePath $nodeCommand.Source -ArgumentList 'server.mjs' -WorkingDirectory $gameDirectory -WindowStyle Hidden
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        Start-Sleep -Milliseconds 250
        try { $response = Invoke-WebRequest -Uri $gameUrl -UseBasicParsing -TimeoutSec 1; if ($response.StatusCode -eq 200) { $serverReady = $true; break } } catch {}
    }
}
if ($serverReady) { Start-Process $gameUrl } else { Write-Error 'The local server could not start. Run node server.mjs from the repository directory to inspect the error.'; exit 1 }
