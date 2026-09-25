#requires -RunAsAdministrator
$ErrorActionPreference = 'Stop'

$projectFolder = Split-Path -Parent $MyInvocation.MyCommand.Path
$indexPath = Join-Path $projectFolder 'index.html'

if (-not (Test-Path -LiteralPath $indexPath)) {
    throw "index.html nao encontrado em: $projectFolder"
}

$windowsName = (Get-CimInstance Win32_OperatingSystem).Caption
if ($windowsName -match 'Home') {
    throw 'O Acesso Atribuido nao e suportado no Windows Home. Use Windows Pro, Enterprise, Education ou IoT Enterprise.'
}

$edgeCandidates = @(
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
)
$edgePath = $edgeCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $edgePath) {
    throw 'Microsoft Edge nao foi encontrado.'
}

# Permite somente leitura e execucao dos arquivos para a conta local do kiosk.
& icacls.exe $projectFolder /grant '*S-1-5-32-545:(OI)(CI)RX' /T /C | Out-Null

$fileUrl = ([System.Uri]::new($indexPath)).AbsoluteUri
$workFolder = Join-Path $env:ProgramData 'CDLKiosk'
$workerPath = Join-Path $workFolder 'Aplicar-Kiosk.ps1'
$statusPath = Join-Path $workFolder 'status.txt'
$taskName = 'Aplicar-CDL-Kiosk'

New-Item -ItemType Directory -Force -Path $workFolder | Out-Null
Remove-Item -LiteralPath $statusPath -Force -ErrorAction SilentlyContinue

$workerTemplate = @'
$ErrorActionPreference = 'Stop'
$statusPath = '__STATUS__'
try {
    $assignedAccessConfiguration = @"
<?xml version="1.0" encoding="utf-8"?>
<AssignedAccessConfiguration
    xmlns="http://schemas.microsoft.com/AssignedAccess/2017/config"
    xmlns:rs5="http://schemas.microsoft.com/AssignedAccess/201810/config"
    xmlns:v4="http://schemas.microsoft.com/AssignedAccess/2021/config">
  <Profiles>
    <Profile Id="{EDB3036B-780D-487D-A375-69369D8A8F78}">
      <KioskModeApp
        v4:ClassicAppPath="__EDGE__"
        v4:ClassicAppArguments="--kiosk __URL__ --edge-kiosk-type=fullscreen --no-first-run" />
      <v4:BreakoutSequence Key="Ctrl+Alt+K" />
    </Profile>
  </Profiles>
  <Configs>
    <Config>
      <AutoLogonAccount rs5:DisplayName="CDL Totem" />
      <DefaultProfile Id="{EDB3036B-780D-487D-A375-69369D8A8F78}" />
    </Config>
  </Configs>
</AssignedAccessConfiguration>
"@
    $namespace = 'root\cimv2\mdm\dmmap'
    $class = 'MDM_AssignedAccess'
    $obj = Get-CimInstance -Namespace $namespace -ClassName $class
    $obj.Configuration = [System.Net.WebUtility]::HtmlEncode($assignedAccessConfiguration)
    Set-CimInstance -CimInstance $obj | Out-Null
    'OK' | Set-Content -LiteralPath $statusPath -Encoding ASCII
}
catch {
    ('ERRO: ' + $_.Exception.Message) | Set-Content -LiteralPath $statusPath -Encoding UTF8
    exit 1
}
'@

$workerContent = $workerTemplate.Replace('__EDGE__', $edgePath).Replace('__URL__', $fileUrl).Replace('__STATUS__', $statusPath)
Set-Content -LiteralPath $workerPath -Value $workerContent -Encoding UTF8

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
    throw 'A configuracao nao respondeu em 40 segundos.'
}

$status = Get-Content -Raw -LiteralPath $statusPath
if ($status.Trim() -ne 'OK') {
    throw $status
}

Write-Host ''
Write-Host 'Kiosk configurado com sucesso.' -ForegroundColor Green
Write-Host 'Depois de reiniciar, o Windows entrara automaticamente em CDL Totem.'
Write-Host 'Para sair do kiosk e fazer manutencao, use Ctrl+Alt+K.'
Write-Host ''

$restart = Read-Host 'Reiniciar o computador agora? (S/N)'
if ($restart -match '^[sS]') {
    Restart-Computer -Force
}
