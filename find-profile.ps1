# Mostra onde está o arquivo de profile do PowerShell
Write-Host "Seu PowerShell profile está em:" -ForegroundColor Cyan
Write-Host $PROFILE -ForegroundColor Green
Write-Host ""
Write-Host "Para abrir:" -ForegroundColor Yellow
Write-Host "notepad `$PROFILE" -ForegroundColor White
