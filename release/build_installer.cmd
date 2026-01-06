@echo off
setlocal
if not exist "%~dp0\..\tools\roxify\dist" (
  echo ERROR: tools\roxify\dist not found. Run `npm run build:exe` in tools\roxify first.
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