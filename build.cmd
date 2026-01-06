@echo off
setlocal
pushd %~dp0
echo Installing npm dependencies...
npm ci
if errorlevel 1 (
  echo npm ci failed
  exit /b 1
)
echo Building rox.exe using pkg...
npm run build:exe
if errorlevel 1 (
  echo Build failed
  exit /b 1
)
echo Build complete. See dist\rox.exe
popd
endlocal
exit /b 0
