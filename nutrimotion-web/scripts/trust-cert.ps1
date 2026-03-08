# Trust the localhost development certificate (run as Administrator)
# Fixes: net::ERR_CERT_AUTHORITY_INVALID
$certDir = Join-Path (Split-Path $PSScriptRoot -Parent) "cert"
$certPath = Join-Path $certDir "localhost.pem"
if (-not (Test-Path $certPath)) {
    Write-Host "Certificate not found. Run first: npm run cert:force" -ForegroundColor Red
    exit 1
}
try {
    certutil -addstore -f "Root" $certPath
    Write-Host "Certificate added to Trusted Root. Restart your browser and open https://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "Failed. Make sure you run this script as Administrator (right-click PowerShell -> Run as administrator)." -ForegroundColor Red
    exit 1
}
