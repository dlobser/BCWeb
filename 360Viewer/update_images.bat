@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo  360 Viewer - Dynamic Image List Generator
echo ===================================================
echo.
echo Scanning current folder for .jpg, .jpeg, and .png files...
echo.

echo const IMAGES = [ > images.js

set count=0
for %%i in (*.jpg *.jpeg *.png) do (
    set "filename=%%i"
    echo   "!filename!", >> images.js
    set /a count+=1
    echo   Found: !filename!
)

echo ]; >> images.js

echo.
echo ===================================================
echo  Done! images.js generated with %count% file(s).
echo ===================================================
echo.
pause
