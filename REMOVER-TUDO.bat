@echo off
:: Clique duas vezes neste arquivo. Ele pede permissao de administrador e roda o REMOVER-TUDO.ps1
net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0REMOVER-TUDO.ps1"
pause
