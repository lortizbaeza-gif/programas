@echo off
chcp 65001 >nul
set PYTHONUTF8=1
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel% equ 0 (
    py -3 main.py
) else (
    python main.py
)
if errorlevel 1 echo Comprueba que Python 3.10 o superior este instalado y agregado al PATH.
pause
