@echo off
setlocal

cd /d "%~dp0\.."

set QT_DIR=C:\Qt\6.8.3\msvc2022_64
set BUILD_DIR=build
set DEPLOY_DIR=%BUILD_DIR%\deploy
set VCVARS="C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvarsall.bat"

if not exist %VCVARS% (
    echo ERREUR: vcvarsall.bat introuvable
    exit /b 1
)

call %VCVARS% x64

echo [1/5] Configuration CMake Release...
cmake -B %BUILD_DIR% -DCMAKE_BUILD_TYPE=Release -DCMAKE_PREFIX_PATH="%QT_DIR%" -G "Ninja"
if %errorlevel% neq 0 exit /b 1

echo [2/5] Compilation Release...
cmake --build %BUILD_DIR% --config Release
if %errorlevel% neq 0 exit /b 1

echo [3/5] Deploiement Qt...
if exist "%DEPLOY_DIR%" rmdir /s /q "%DEPLOY_DIR%"
mkdir "%DEPLOY_DIR%"
copy /y "%BUILD_DIR%\pyxelze.exe" "%DEPLOY_DIR%\pyxelze.exe" >nul
"%QT_DIR%\bin\windeployqt.exe" "%DEPLOY_DIR%\pyxelze.exe"

echo [3b/5] Copie ressources...
if exist "%BUILD_DIR%\roxify\roxify_native.exe" (
    mkdir "%DEPLOY_DIR%\roxify" 2>nul
    copy /y "%BUILD_DIR%\roxify\roxify_native.exe" "%DEPLOY_DIR%\roxify\roxify_native.exe" >nul
) else (
    for /f "delims=" %%i in ('npm root -g 2^>nul') do set NPM_ROOT=%%i
    if exist "!NPM_ROOT!\roxify\dist\roxify_native.exe" (
        mkdir "%DEPLOY_DIR%\roxify" 2>nul
        copy /y "!NPM_ROOT!\roxify\dist\roxify_native.exe" "%DEPLOY_DIR%\roxify\roxify_native.exe" >nul
    )
)
if exist "appIcon.ico" copy /y "appIcon.ico" "%DEPLOY_DIR%\appIcon.ico" >nul
if exist "LICENSE" copy /y "LICENSE" "%DEPLOY_DIR%\LICENSE" >nul

echo [4/5] Construction installateur InnoSetup...
where iscc >nul 2>&1
if %errorlevel% equ 0 (
    iscc packaging\windows\installer.iss
    echo Installateur cree dans %BUILD_DIR%\
) else (
    if exist "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" (
        "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" packaging\windows\installer.iss
        echo Installateur cree dans %BUILD_DIR%\
    ) else (
        echo ATTENTION: InnoSetup non trouve, installateur non cree
        echo Installer depuis: https://jrsoftware.org/isdl.php
    )
)

echo [5/5] Done.
echo Binaire: %DEPLOY_DIR%\pyxelze.exe
