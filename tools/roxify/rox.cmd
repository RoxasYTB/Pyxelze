@echo off
setlocal

set SCRIPT_DIR=%~dp0

if exist "%SCRIPT_DIR%rox.exe" (
  "%SCRIPT_DIR%rox.exe" %*
) else (
  echo ERROR: rox.exe not found
  exit /b 1
)

endlocal