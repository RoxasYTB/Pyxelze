@echo off
setlocal

set SRC_DIR=%~dp0dist
if not exist "%SRC_DIR%" (
  echo dist folder not found: %SRC_DIR%
  exit /b 1
)

set DEST=%LOCALAPPDATA%\Programs\Pyxelze\rox
if not exist "%DEST%" mkdir "%DEST%"

echo Copying files from %SRC_DIR% to %DEST%
xcopy /e /y "%SRC_DIR%\*" "%DEST%\" >nul

echo Checking PATH for %DEST%
echo %PATH% | findstr /i /c:"%DEST%" >nul
if %errorlevel% neq 0 (
  setx PATH "%PATH%;%DEST%"
  echo PATH updated. Restart your terminal or sign out/in to pick up changes.
) else (
  echo PATH already contains %DEST%
)

endlocal
exit /b 0
