@echo off
set SCRIPT_DIR=%~dp0
if exist "%SCRIPT_DIR%roxify\dist\cli.js" (echo clijs) else (echo no_clijs)
if exist "%SCRIPT_DIR%dist\roxify\dist\cli.js" (echo dist_clijs) else (echo no_dist_cli)
if exist "%SCRIPT_DIR%dist\build\rox-bundle.cjs" (echo dist_bundle) else (echo no_dist_bundle)
if exist "%SCRIPT_DIR%build\rox-bundle.cjs" (echo build_bundle) else (echo no_build_bundle)
"