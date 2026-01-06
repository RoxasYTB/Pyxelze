@echo off
setlocal
if not exist "%~dp0\..\production" (
  echo ERROR: production folder not found. Run build_production.cmd first.
  exit /b 1
)
if not exist "%~dp0\..\production\Pyxelze.exe" (
  echo ERROR: Pyxelze.exe not found in production. Run build_production.cmd first.
  exit /b 1
)
if exist "%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe" (
  set ISCC="%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe"
) else if defined ISCC_PATH (
  set ISCC="%ISCC_PATH%\ISCC.exe"
) else (
  echo ERROR: Inno Setup Compiler not found. Install Inno Setup or set ISCC_PATH.
  exit /b 1
)
%ISCC% /DProjectPath="%~dp0\.." "%~dp0\installer.iss"
endlocal