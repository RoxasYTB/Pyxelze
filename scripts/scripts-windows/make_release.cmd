@echo off
setlocal
rem Create production release folder by copying tools/roxify/dist -> release\roxify
set ROOT_DIR=%~dp0
set SRC_DIR=%ROOT_DIR%tools\roxify\dist
set DST_DIR=%ROOT_DIR%release\roxify

if not exist "%SRC_DIR%" (
  echo ERROR: Source dist not found. Run "cd tools\roxify && npm run build:exe" first.
  echo If you need the Windows packaged CLI (rox.exe), run "cd tools\roxify && npm run build:pkg:full" to generate it.
  exit /b 1
)

if exist "%DST_DIR%" rmdir /s /q "%DST_DIR%"
mkdir "%DST_DIR%"

xcopy /e /y "%SRC_DIR%\*" "%DST_DIR%\" >nul
if exist "%DST_DIR%\node_modules" rmdir /s /q "%DST_DIR%\node_modules"
if exist "%DST_DIR%\roxify" rmdir /s /q "%DST_DIR%\roxify"
echo Release package created at %DST_DIR%
endlocal