@echo off
REM The CLI previously built under tools/roxify has been archived (tools/archive/roxify).
REM This script is therefore a no-op for the current version.
if not exist release mkdir release
echo No CLI distribution to copy; tools/roxify archived under tools/archive/roxify
exit /b 0