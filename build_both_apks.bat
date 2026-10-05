@echo off
title Wadaage Mobility - Build Both APKs (Rider and Driver)
echo ======================================================================
echo    WADAAGE MOBILITY - AUTOMATED ANDROID APK BUILD (RIDER ^& DRIVER)
echo ======================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "& '%~dp0build_apks.ps1' -Target both"

echo.
echo ======================================================================
echo Build process finished! Check the 'build_output' folder.
echo ======================================================================
pause
