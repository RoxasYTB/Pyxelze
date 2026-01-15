@echo off
REM Copy tools\roxify\dist -> release\roxify (minimal fallback used by CI)
if not exist release mkdir release


exit /b 0xcopy /E /Y tools\roxify\dist release\roxify >nul 2>nul || exit /b 0nif not exist release\roxify mkdir release\roxify