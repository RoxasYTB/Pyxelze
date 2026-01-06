@echo off
cd release\roxify
set PATH=
call rox.cmd --version
exit /b %errorlevel%
