# docker-start.ps1
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Trello Clone - Start Project" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.docker exists
if (-not (Test-Path .env.docker)) {
    Write-Host "[ERROR] .env.docker file not found!" -ForegroundColor Red
    Write-Host "Create it from .env.docker.example" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[1/3] Starting containers..." -ForegroundColor Yellow
docker-compose --env-file .env.docker up -d

Write-Host ""
Write-Host "[2/3] Waiting for application to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "[3/3] Checking status..." -ForegroundColor Yellow

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  [OK] Project started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "[STATUS] Container status:" -ForegroundColor Cyan
docker ps

Write-Host ""
Write-Host "[LOGS] Application logs (last 20 lines):" -ForegroundColor Cyan
docker-compose logs app --tail 20

Write-Host ""
Write-Host "[URL] Open in browser: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "[TEST] Test credentials:" -ForegroundColor Yellow
Write-Host "   Email: user@example.com"
Write-Host "   Password: password123"
Write-Host ""
Write-Host "[STOP] To stop, run: docker-stop.ps1" -ForegroundColor Yellow
Write-Host ""