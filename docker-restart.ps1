# docker-restart.ps1
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Trello Clone - Restart Project" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/2] Stopping containers..." -ForegroundColor Yellow
docker-compose down

Write-Host ""
Write-Host "[2/2] Starting containers..." -ForegroundColor Yellow
docker-compose --env-file .env.docker up -d

Write-Host ""
Write-Host "Waiting for application to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  [OK] Restart completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
docker ps
Write-Host ""
Write-Host "[URL] http://localhost:3000" -ForegroundColor Green
Write-Host ""