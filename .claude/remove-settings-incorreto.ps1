# ============================================================================
# remove-settings-incorreto.ps1
# Remove settings.json criado no local errado (C:\Users\pedro\.claude\)
# ============================================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=" -NoNewline -ForegroundColor Yellow
Write-Host ("=" * 69) -ForegroundColor Yellow
Write-Host "REMOVER SETTINGS.JSON INCORRETO" -ForegroundColor Yellow
Write-Host "=" -NoNewline -ForegroundColor Yellow
Write-Host ("=" * 69) -ForegroundColor Yellow
Write-Host ""

$userSettingsPath = Join-Path $env:USERPROFILE ".claude\settings.json"
$userClaudeDir = Join-Path $env:USERPROFILE ".claude"

Write-Host "Verificando: $userSettingsPath" -ForegroundColor Gray
Write-Host ""

if (Test-Path $userSettingsPath) {
    Write-Host "❌ Arquivo INCORRETO encontrado!" -ForegroundColor Red
    Write-Host "   Caminho: $userSettingsPath" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Este arquivo NÃO deveria existir." -ForegroundColor Yellow
    Write-Host "   O correto é: C:\claude-work\repos\Claude-Code-Projetos\.claude\settings.json" -ForegroundColor Yellow
    Write-Host ""

    $remove = Read-Host "Deseja remover este arquivo INCORRETO? (S/N)"

    if ($remove -eq 'S' -or $remove -eq 's') {
        try {
            Remove-Item $userSettingsPath -Force
            Write-Host ""
            Write-Host "✅ Arquivo removido com sucesso!" -ForegroundColor Green

            # Verificar se diretório .claude está vazio
            $items = Get-ChildItem $userClaudeDir -Force -ErrorAction SilentlyContinue

            if ($null -eq $items -or $items.Count -eq 0) {
                Remove-Item $userClaudeDir -Force -ErrorAction SilentlyContinue
                Write-Host "✅ Diretório .claude vazio removido" -ForegroundColor Green
            }

            Write-Host ""
            Write-Host "Próximo passo:" -ForegroundColor Cyan
            Write-Host "   Execute: claude doctor" -ForegroundColor Gray
            Write-Host "   Deve retornar sem erros!" -ForegroundColor Gray

        } catch {
            Write-Host ""
            Write-Host "❌ Erro ao remover: $_" -ForegroundColor Red
            Write-Host ""
            Write-Host "Tente remover manualmente:" -ForegroundColor Yellow
            Write-Host "   Remove-Item `"$userSettingsPath`" -Force" -ForegroundColor Gray
        }
    } else {
        Write-Host ""
        Write-Host "⚠️  Arquivo NÃO removido." -ForegroundColor Yellow
        Write-Host "   O erro persistirá até você removê-lo." -ForegroundColor Yellow
    }

} else {
    Write-Host "✅ Nenhum arquivo incorreto encontrado!" -ForegroundColor Green
    Write-Host "   Tudo limpo!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Execute: claude doctor" -ForegroundColor Cyan
    Write-Host "   Deve retornar sem erros!" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=" -NoNewline -ForegroundColor Yellow
Write-Host ("=" * 69) -ForegroundColor Yellow
Write-Host ""
