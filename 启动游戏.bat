@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Installing dependencies, please wait...
  call npm ci || call npm install
)
call npm start
if errorlevel 1 pause
