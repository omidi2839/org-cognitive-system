@echo off
title Organizational Cognitive AI - Build 0.4.8
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 20+ is required.
  echo Download it from https://nodejs.org/
  pause
  exit /b 1
)
start "Cognitive AI Server" cmd /k "node local-server.js"
timeout /t 2 /nobreak >nul
start "" "http://localhost:3000"
exit
