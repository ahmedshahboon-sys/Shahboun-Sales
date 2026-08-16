@echo off
setlocal
cd /d "%~dp0"
if not exist .env (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\BOOTSTRAP_PREREQUISITES.ps1"
  if errorlevel 1 pause & exit /b 1
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\FIRST_RUN_SETUP.ps1"
  if errorlevel 1 pause & exit /b 1
)
set "NODE_EXE=%~dp0runtime\node\node.exe"
if not exist "%NODE_EXE%" (
  echo ERROR: Shahboun bundled Node runtime is missing.
  pause
  exit /b 1
)
"%NODE_EXE%" src\server.js
if errorlevel 1 pause
