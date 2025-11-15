@echo off
REM Build script for Windows with embedded API keys
REM Run this on a Windows machine with Node.js and Rust installed

echo Building Pluely for Windows with API keys...

set APP_ENDPOINT=https://pluely.com/pluely/v2
set API_ACCESS_KEY=***REMOVED***

echo APP_ENDPOINT=%APP_ENDPOINT%
echo API_ACCESS_KEY=%API_ACCESS_KEY:~0,20%...

npm run tauri build

echo.
echo Build complete!
echo MSI Installer: src-tauri\target\release\bundle\msi\Pluely_0.1.8_x64_en-US.msi
echo EXE Installer: src-tauri\target\release\bundle\nsis\Pluely_0.1.8_x64-setup.exe
pause
