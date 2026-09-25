#requires -RunAsAdministrator
$ErrorActionPreference = 'Stop'

$workFolder = Join-Path $env:ProgramData 'CDLKiosk'
$workerPath = Join-Path $workFolder 'Remover-Kiosk.ps1'
$statusPath = Join-Path $workFolder 'remocao-status.txt'
$taskName = 'Remover-CDL-Kiosk'

New-Item -ItemType Directory -Force -Path $workFolder | Out-Null
Remove-Item -LiteralPath $statusPath -Force -ErrorAction SilentlyContinue

$worker = @"
`$ErrorActionPreference = 'Stop'
try {
    `$obj = Get-CimInstance -Namespace 'root\cimv2\mdm\dmmap' -ClassName 'MDM_AssignedAccess'
    `$obj.Configuration = `$null
    Set-CimInstance -CimInstance `$obj | Out-Null
    'OK' | Set-Content -LiteralPath '$statusPath' -Encoding ASCII
}
catch {
    ('ERRO: ' + `$_.Exception.Message) | Set-Content -LiteralPath '$statusPath' -Encoding UTF8
    exit 1
}
"@

Set-Content -LiteralPath $workerPath -Value $worker -Encoding UTF8

$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$workerPath`""
$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
$task = New-ScheduledTask -Action $action -Principal $principal

Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
Register-ScheduledTask -TaskName $taskName -InputObject $task -Force | Out-Null
Start-ScheduledTask -TaskName $taskName

$deadline = (Get-Date).AddSeconds(40)
while (-not (Test-Path -LiteralPath $statusPath) -and (Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 1
}

Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

if (-not (Test-Path -LiteralPath $statusPath)) {
    throw 'A remocao nao respondeu em 40 segundos.'
}

$status = Get-Content -Raw -LiteralPath $statusPath
if ($status.Trim() -ne 'OK') {
    throw $status
}

Write-Host 'Configuracao de kiosk removida.' -ForegroundColor Green
$restart = Read-Host 'Reiniciar o computador agora? (S/N)'
if ($restart -match '^[sS]') {
    Restart-Computer -Force
}
