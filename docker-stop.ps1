# docker-stop.ps1
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Trello Clone - Stop Project" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Stopping containers..." -ForegroundColor Yellow
docker-compose down

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  [OK] Project stopped!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "To start again, run: docker-start.ps1" -ForegroundColor Yellow
Write-Host ""