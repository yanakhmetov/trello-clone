# docker-logs.ps1
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Trello Clone - View Logs" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[LOGS] Application logs (press Ctrl+C to exit)" -ForegroundColor Yellow
Write-Host ""
Start-Sleep -Seconds 2
docker-compose logs -f app