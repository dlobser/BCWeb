@echo off
echo ===================================================
echo  360 Viewer - Local Web Server Launcher
echo ===================================================
echo.

:: Check for python on PATH
where python >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Python detected.
    echo [INFO] Starting Python HTTP Server on port 8000...
    echo [INFO] Opening browser to http://localhost:8000/ ...
    start "" "http://localhost:8000"
    python -m http.server 8000
    goto end
)

:: Check for npx/node on PATH
where npx >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Node.js / npx detected.
    echo [INFO] Starting local server using 'npx http-server' on port 8000...
    echo [INFO] Opening browser to http://localhost:8000/ ...
    start "" "http://localhost:8000"
    npx -y http-server -p 8000
    goto end
)

echo ===================================================
echo  [WARNING] Neither Python nor Node.js was found.
echo ===================================================
echo.
echo  You can still double-click 'index.html' to open it 
echo  directly in your browser. 
echo.
echo  Note: Under the file:// protocol, automatic folder 
echo  scanning is blocked by browser CORS security.
echo  However, you can easily load and view panoramas by:
echo  1. Running 'update_images.bat' first to populate the list.
echo  2. Clicking "Load local JPG/PNG..." in the UI.
echo  3. Dragging and dropping JPGs/PNGs anywhere on the web page.
echo.
pause

:end
