@echo off
echo Installing dependencies for 3D Rubik's Cube project...
echo.
echo Prerequisites:
echo - Node.js version 16 or higher
echo - npm (comes with Node.js)
echo.
echo If you haven't installed Node.js yet, please:
echo 1. Go to https://nodejs.org/
echo 2. Download and install the LTS version
echo 3. Restart your terminal/command prompt
echo 4. Run this script again
echo.

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js first, then run this script again.
    pause
    exit /b 1
)

echo Node.js found! Installing project dependencies...
npm install

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Installation complete!
    echo.
    echo To start the development server:
    echo   npm run dev
    echo.
    echo To build for production:
    echo   npm run build
    echo.
) else (
    echo.
    echo ❌ Installation failed. Please check the error messages above.
    echo.
)

pause
