@echo off
setlocal
set ROOT_DIR=%~dp0
set PROD_DIR=%ROOT_DIR%production

echo [1/3] Publishing GUI to publish_final...
dotnet publish -c Release -o "%ROOT_DIR%publish_final"
if errorlevel 1 (
  echo ERROR: dotnet publish failed
  exit /b 1
)

echo [2/3] Creating production folder structure...
if exist "%PROD_DIR%" rmdir /s /q "%PROD_DIR%"
mkdir "%PROD_DIR%"

echo [3/3] Copying GUI and CLI into production...
xcopy /e /y /q "%ROOT_DIR%publish_final\*" "%PROD_DIR%\"
if not exist "%ROOT_DIR%tools\roxify\dist" (
  echo WARNING: tools\roxify\dist not found. Using release\roxify instead.
  xcopy /e /y /q "%ROOT_DIR%release\roxify\*" "%PROD_DIR%\"
) else (
  xcopy /e /y /q "%ROOT_DIR%tools\roxify\dist\*" "%PROD_DIR%\"
)

echo Production folder created: %PROD_DIR%
endlocal
