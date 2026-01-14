@echo off
title Sync & Deploy - Ahsania Dashboard
color 0A

echo ========================================================
echo   AHSANIA DASHBOARD - AUTO SYNC & DEPLOY SYSTEM
echo ========================================================
echo.

:: 1. Ask for Commit Message
set /p msg="Step 1: What did you change? (Press Enter for 'Update'): "
if "%msg%"=="" set msg="General Update"

echo.
echo --------------------------------------------------------
echo [1/2] Backing up code to GitHub...
echo --------------------------------------------------------
git add .
git commit -m "%msg%"
git push origin main

echo.
echo --------------------------------------------------------
echo [2/2] Publishing to Live Website (Vercel)...
echo --------------------------------------------------------
call npx vercel --prod

echo.
echo ========================================================
echo   SUCCESS! GitHub and Live Website are both updated.
echo ========================================================
echo.
pause
