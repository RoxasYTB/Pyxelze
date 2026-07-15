@echo off
setlocal

cd /d "%~dp0\.."

set QT_DIR=C:\Qt\6.8.3\msvc2022_64
set BUILD_DIR=build-win-debug
set VCVARS="C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvarsall.bat"

if not exist %VCVARS% (
    echo ERREUR: vcvarsall.bat introuvable, installer MSVC Build Tools 2022
    exit /b 1
)

call %VCVARS% x64

echo [1/4] Configuration CMake...
cmake -B %BUILD_DIR% -DCMAKE_BUILD_TYPE=Debug -DCMAKE_PREFIX_PATH="%QT_DIR%" -G "Ninja"
if %errorlevel% neq 0 (
    echo ERREUR: cmake configure echoue
    exit /b 1
)

echo [2/4] Compilation...
cmake --build %BUILD_DIR% --config Debug
if %errorlevel% neq 0 (
    echo ERREUR: compilation echouee
    exit /b 1
)

echo [3/4] Deploiement Qt...
if not exist "%BUILD_DIR%\Qt6Cored.dll" (
    "%QT_DIR%\bin\windeployqt.exe" "%BUILD_DIR%\pyxelze.exe"
)

echo [3b/4] Copie roxify_native...
if not exist "%BUILD_DIR%\roxify" mkdir "%BUILD_DIR%\roxify"
for /f "delims=" %%i in ('npm root -g 2^>nul') do set NPM_ROOT=%%i
if exist "%NPM_ROOT%\roxify\dist\roxify_native.exe" (
    copy /y "%NPM_ROOT%\roxify\dist\roxify_native.exe" "%BUILD_DIR%\roxify\roxify_native.exe" >nul
)

if exist "appIcon.ico" copy /y "appIcon.ico" "%BUILD_DIR%\appIcon.ico" >nul

echo [4/4] Lancement en debug...
start "" "%BUILD_DIR%\pyxelze.exe"

echo Done.
