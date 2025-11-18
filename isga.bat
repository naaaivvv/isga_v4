@echo off
ECHO Starting WampManager...
start "" "C:\wamp64\wampmanager.exe"
TIMEOUT /T 5 /NOBREAK > NUL

ECHO Navigating to project directory and running development server...
cd /d "C:\wamp64\www\isga_v4"
start "Development Server" cmd /k "npm run dev"

ECHO Done.