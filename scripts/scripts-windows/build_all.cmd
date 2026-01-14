@echo off
setlocal

set ROOT=%~dp0
set NODE_EXE=%ROOT%release\roxify\node.exe

if not exist "%NODE_EXE%" (
    echo Node portable not found. Run make_release first or download it.
    exit /b 1
)

echo Using portable Node: %NODE_EXE%

cd /d "%ROOT%tools\roxify"

echo Installing dependencies...
"%NODE_EXE%" "%ROOT%tools\roxify\scripts\npm-install.js"

echo Building rox CLI...
call "%ROOT%tools\roxify\build.cmd"

echo.
echo Build complete. Release folder updated.
cd /d "%ROOT%"
call make_release.cmd

echo.
echo Ready for publish.
endlocal
