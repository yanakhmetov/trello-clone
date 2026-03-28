# docker-clean.ps1
Write-Host "========================================" -ForegroundColor Red
Write-Host "  Trello Clone - Clean Everything" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""
Write-Host "[WARNING] This will remove all containers, images, and volumes!" -ForegroundColor Red
Write-Host "[WARNING] All data will be permanently deleted!" -ForegroundColor Red
Write-Host ""
$confirmation = Read-Host "Are you sure? (y/N)"

if ($confirmation -eq 'y' -or $confirmation -eq 'Y') {
    Write-Host ""
    Write-Host "[1/4] Stopping containers..." -ForegroundColor Yellow
    docker-compose down
    
    Write-Host ""
    Write-Host "[2/4] Removing volumes..." -ForegroundColor Yellow
    docker-compose down -v
    
    Write-Host ""
    Write-Host "[3/4] Removing images..." -ForegroundColor Yellow
    docker rmi trello-clone-app 2>$null
    docker image prune -f
    
    Write-Host ""
    Write-Host "[4/4] Cleaning up..." -ForegroundColor Yellow
    docker system prune -f
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  [OK] Cleanup completed!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[CANCELLED] Cleanup cancelled" -ForegroundColor Yellow
}

Write-Host ""