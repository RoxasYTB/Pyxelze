@echo off
setlocal

set ROOT=%~dp0
set PUBLISH_DIR=%ROOT%publish_final
set INSTALLER_DIR=%ROOT%tools\installer
set OUTPUT_DIR=%ROOT%installer_output

if not exist "%PUBLISH_DIR%\Pyxelze.exe" (
    echo ERROR: Publish folder not found. Run "dotnet publish -c Release -o publish_final" first.
    exit /b 1
)

if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

echo Building installer with Inno Setup...
echo Publish dir: %PUBLISH_DIR%
echo Output dir: %OUTPUT_DIR%

iscc /DPublishDir="%PUBLISH_DIR%" /O"%OUTPUT_DIR%" "%INSTALLER_DIR%\installer.iss"

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Inno Setup build failed.
    echo Make sure Inno Setup is installed: https://jrsoftware.org/isdl.php
    exit /b 1
)

echo.
echo Installer created successfully in: %OUTPUT_DIR%
dir /b "%OUTPUT_DIR%\*.exe"
endlocal
