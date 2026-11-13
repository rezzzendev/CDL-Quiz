#requires -RunAsAdministrator
# Remove TUDO que o CONFIGURAR-KIOSK.ps1 colocou no totem:
#  1. Configuracao de Acesso Atribuido (kiosk) do Windows
#  2. Conta local criada para o kiosk ("CDL Totem" / kioskUser*) e o perfil dela
#  3. Login automatico
#  4. Pasta C:\ProgramData\CDLKiosk e tarefas agendadas
#  5. (Opcional) a pasta do jogo
$ErrorActionPreference = 'Continue'

function Passo($texto) { Write-Host ''; Write-Host "==> $texto" -ForegroundColor Cyan }

$workFolder = Join-Path $env:ProgramData 'CDLKiosk'
$statusPath = Join-Path $workFolder 'remocao-status.txt'
$workerPath = Join-Path $workFolder 'Remover-Kiosk.ps1'
$taskName   = 'Remover-CDL-Kiosk'

# ---------------------------------------------------------------- 1. Kiosk
Passo 'Removendo configuracao de Acesso Atribuido (kiosk)...'
New-Item -ItemType Directory -Force -Path $workFolder | Out-Null
Remove-Item -LiteralPath $statusPath -Force -ErrorAction SilentlyContinue

# A ponte MDM so aceita alteracao como SYSTEM, por isso roda via tarefa agendada.
$worker = @"
`$ErrorActionPreference = 'Stop'
try {
    `$obj = Get-CimInstance -Namespace 'root\cimv2\mdm\dmmap' -ClassName 'MDM_AssignedAccess'
    if (`$obj -and `$obj.Configuration) {
        `$obj.Configuration = `$null
        Set-CimInstance -CimInstance `$obj | Out-Null
    }
    'OK' | Set-Content -LiteralPath '$statusPath' -Encoding ASCII
}
catch {
    ('ERRO: ' + `$_.Exception.Message) | Set-Content -LiteralPath '$statusPath' -Encoding UTF8
    exit 1
}
"@
Set-Content -LiteralPath $workerPath -Value $worker -Encoding UTF8

$action    = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$workerPath`""
$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
$task      = New-ScheduledTask -Action $action -Principal $principal
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
Register-ScheduledTask -TaskName $taskName -InputObject $task -Force | Out-Null
Start-ScheduledTask -TaskName $taskName

$deadline = (Get-Date).AddSeconds(40)
while (-not (Test-Path -LiteralPath $statusPath) -and (Get-Date) -lt $deadline) { Start-Sleep -Seconds 1 }
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

if (Test-Path -LiteralPath $statusPath) {
    $status = (Get-Content -Raw -LiteralPath $statusPath).Trim()
    if ($status -eq 'OK') { Write-Host '   Kiosk removido.' -ForegroundColor Green }
    else { Write-Host "   $status" -ForegroundColor Red }
} else {
    Write-Host '   A remocao do kiosk nao respondeu em 40s.' -ForegroundColor Red
}

# Garantia extra (cmdlet nativo, ignora erro se nao houver nada)
try { Clear-AssignedAccess -ErrorAction Stop | Out-Null } catch {}

# ---------------------------------------------------------------- 2. Conta do kiosk
Passo 'Removendo conta local do kiosk...'
$contas = Get-LocalUser | Where-Object {
    $_.FullName -eq 'CDL Totem' -or $_.Name -eq 'CDL Totem' -or $_.Name -like 'kioskUser*'
}
if (-not $contas) { Write-Host '   Nenhuma conta de kiosk encontrada.' }
foreach ($conta in $contas) {
    $sid = $conta.SID.Value
    Write-Host "   Conta: $($conta.Name) ($sid)"

    # Desloga a conta se ainda estiver com sessao aberta
    $sessoes = (quser 2>$null) | Select-String -Pattern ([regex]::Escape($conta.Name))
    foreach ($s in $sessoes) {
        $id = ($s.ToString() -split '\s+' | Where-Object { $_ -match '^\d+$' } | Select-Object -First 1)
        if ($id) { logoff $id 2>$null; Start-Sleep -Seconds 3 }
    }

    try { Remove-LocalUser -SID $sid -ErrorAction Stop; Write-Host '   Conta apagada.' -ForegroundColor Green }
    catch { Write-Host "   Nao foi possivel apagar a conta: $($_.Exception.Message)" -ForegroundColor Red }

    $perfil = Get-CimInstance Win32_UserProfile | Where-Object { $_.SID -eq $sid }
    if ($perfil) {
        try { $perfil | Remove-CimInstance -ErrorAction Stop; Write-Host '   Perfil apagado.' -ForegroundColor Green }
        catch { Write-Host "   Perfil em uso, sera possivel apagar apos reiniciar: $($_.Exception.Message)" -ForegroundColor Yellow }
    }
}

# ---------------------------------------------------------------- 3. Login automatico
Passo 'Desativando login automatico...'
$winlogon = 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon'
$nomeAuto = (Get-ItemProperty -Path $winlogon -Name DefaultUserName -ErrorAction SilentlyContinue).DefaultUserName
$nomesKiosk = @($contas | ForEach-Object { $_.Name }) + 'CDL Totem'
if ($nomeAuto -and ($nomesKiosk -contains $nomeAuto -or $nomeAuto -like 'kioskUser*')) {
    Set-ItemProperty -Path $winlogon -Name AutoAdminLogon -Value '0'
    Remove-ItemProperty -Path $winlogon -Name DefaultPassword -ErrorAction SilentlyContinue
    Remove-ItemProperty -Path $winlogon -Name DefaultUserName -ErrorAction SilentlyContinue
    Write-Host '   Login automatico do kiosk desativado.' -ForegroundColor Green
} else {
    Write-Host '   Login automatico nao aponta para o kiosk, nada a fazer.'
}

# ---------------------------------------------------------------- 4. Restos
Passo 'Limpando arquivos e tarefas...'
'Aplicar-CDL-Kiosk', 'Remover-CDL-Kiosk' | ForEach-Object {
    Unregister-ScheduledTask -TaskName $_ -Confirm:$false -ErrorAction SilentlyContinue
}
Remove-Item -LiteralPath $workFolder -Recurse -Force -ErrorAction SilentlyContinue
Write-Host '   Pasta C:\ProgramData\CDLKiosk removida.' -ForegroundColor Green

# ---------------------------------------------------------------- 5. Pasta do jogo
$pastaJogo = Split-Path -Parent $MyInvocation.MyCommand.Path
if (Test-Path -LiteralPath (Join-Path $pastaJogo 'index.html')) {
    Write-Host ''
    $resp = Read-Host "Apagar tambem a pasta do jogo '$pastaJogo'? (S/N)"
    if ($resp -match '^[sS]') {
        Set-Location $env:SystemRoot
        Remove-Item -LiteralPath $pastaJogo -Recurse -Force -ErrorAction SilentlyContinue
        if (Test-Path -LiteralPath $pastaJogo) { Write-Host '   Alguns arquivos nao foram apagados (em uso?).' -ForegroundColor Yellow }
        else { Write-Host '   Pasta do jogo apagada.' -ForegroundColor Green }
    }
}

# ---------------------------------------------------------------- Fim
Write-Host ''
Write-Host 'Pronto. O totem voltou ao Windows normal.' -ForegroundColor Green
$restart = Read-Host 'Reiniciar o computador agora? (S/N)'
if ($restart -match '^[sS]') { Restart-Computer -Force }
