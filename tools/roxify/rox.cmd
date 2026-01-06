@echo off
setlocal

rem Determine script directory
set SCRIPT_DIR=%~dp0

rem Prefer a local node.exe shipped alongside dist, otherwise use system node
if exist "%SCRIPT_DIR%node.exe" (
  set NODE_EXE="%SCRIPT_DIR%node.exe"
) else (
  for %%i in (node.exe) do set NODE_EXE=%%~$PATH:i
)

if "%NODE_EXE%"=="" (
  echo Node runtime not found. Please install Node.js or include node.exe next to this script.
  exit /b 1
)

rem Prefer the built bundle; fall back to roxify's CLI
if exist "%SCRIPT_DIR%build\rox-bundle.cjs" (
  %NODE_EXE% "%SCRIPT_DIR%build\rox-bundle.cjs" %*
) else if exist "%SCRIPT_DIR%roxify\dist\cli.js" (
  %NODE_EXE% "%SCRIPT_DIR%roxify\dist\cli.js" %*
) else (
  echo rox CLI not found in %SCRIPT_DIR% (expected build\rox-bundle.cjs or roxify\dist\cli.js)
  exit /b 1
)

endlocal