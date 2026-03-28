# docker-rebuild.ps1
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Trello Clone - Full Rebuild" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/5] Stopping containers..." -ForegroundColor Yellow
docker-compose down

Write-Host ""
Write-Host "[2/5] Removing old images..." -ForegroundColor Yellow
docker rmi trello-clone-app 2>$null
docker image prune -f

Write-Host ""
Write-Host "[3/5] Rebuilding images..." -ForegroundColor Yellow
docker-compose --env-file .env.docker build --no-cache

Write-Host ""
Write-Host "[4/5] Starting containers..." -ForegroundColor Yellow
docker-compose --env-file .env.docker up -d

Write-Host ""
Write-Host "[5/5] Waiting for application to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  [OK] Rebuild completed!" -ForegroundColor Green
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