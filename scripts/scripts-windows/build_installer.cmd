@echo off
setlocal

set SCRIPT_DIR=%~dp0
set ROOT=%SCRIPT_DIR%..\..
set PUBLISH_DIR=%ROOT%\publish_final
set INSTALLER_DIR=%SCRIPT_DIR%tools\installer
set OUTPUT_DIR=%ROOT%\installer_output

if not exist "%PUBLISH_DIR%\Pyxelze.exe" (
    echo Building release...
    dotnet publish "%ROOT%\Pyxelze.csproj" -c Release -o "%PUBLISH_DIR%" --self-contained false
    if not exist "%PUBLISH_DIR%\roxify" (
        xcopy /E /I /Y "%ROOT%\bin\Release\net8.0-windows\roxify" "%PUBLISH_DIR%\roxify"
    )
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
