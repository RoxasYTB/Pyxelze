@echo off
setlocal
rem Builds the Inno Setup installer using a specified release/publish folder
rem Usage: build_installer.cmd [<ReleaseDir>]
set RELEASE_DIR=%~1
if "%RELEASE_DIR%"=="" set RELEASE_DIR=%~dp0\..\..\publish_with_native
rem normalize path
pushd %~dp0 >nul
for %%I in ("%RELEASE_DIR%") do set RELEASE_DIR=%%~fI
popd >nul

if not exist "%RELEASE_DIR%" (
  echo ERROR: Release folder not found: %RELEASE_DIR%
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

echo Building installer using release folder: %RELEASE_DIR%
%ISCC% /DReleaseDir="%RELEASE_DIR%" "%~dp0\installer.iss"
endlocal