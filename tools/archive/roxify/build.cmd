@echo off
setlocal
pushd %~dp0

echo Cleaning previous builds...
if exist dist rmdir /s /q dist
if exist build rmdir /s /q build

echo Installing npm dependencies...
call npm install
if errorlevel 1 (
  echo npm install failed
  exit /b 1
)
echo Building rox CLI bundle...
call npm run build:exe
if errorlevel 1 (
  echo Build failed
  exit /b 1
)
echo Build complete. See dist\rox.exe
popd
endlocal
exit /b 0
