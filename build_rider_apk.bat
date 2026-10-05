@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo   WADAAGE RIDER (PASSENGER) - ANDROID APK BUILD SCRIPT
echo ========================================================
echo.

echo [1/5] Setting configuration for Rider App (com.wadaage.rider)...
copy /Y capacitor-rider.config.json capacitor.config.json >nul

echo [2/5] Checking dependencies...
if not exist "node_modules" (
    call npm install
)

echo [3/5] Compiling Rider Production Bundle...
set VITE_APP_MODE=rider
call npm run build:rider

echo [4/5] Syncing Android Project Assets...
if exist "android-rider" (
    xcopy /E /I /Y android-rider android >nul 2>&1
)
call npx cap sync android
if exist "android-rider" (
    xcopy /E /I /Y dist android-rider\app\src\main\assets\public >nul 2>&1
)

echo [5/5] Building Android Debug APK with Gradle...
if not exist "build_output" mkdir build_output

if exist "android-rider\gradlew.bat" (
    cd android-rider
    call gradlew.bat assembleDebug
    cd ..
    if exist "android-rider\app\build\outputs\apk\debug\app-debug.apk" (
        copy /Y android-rider\app\build\outputs\apk\debug\app-debug.apk build_output\Wadaage_Rider_Debug.apk >nul
        echo.
        echo ========================================================
        echo  SUCCESS: Rider APK ready at:
        echo  build_output\Wadaage_Rider_Debug.apk
        echo ========================================================
    )
) else (
    cd android
    if exist "gradlew.bat" (
        call gradlew.bat assembleDebug
        cd ..
        copy /Y android\app\build\outputs\apk\debug\app-debug.apk build_output\Wadaage_Rider_Debug.apk >nul
        echo.
        echo ========================================================
        echo  SUCCESS: Rider APK ready at:
        echo  build_output\Wadaage_Rider_Debug.apk
        echo ========================================================
    ) else (
        cd ..
        echo Gradle wrapper not found. Opening Android Studio...
        call npx cap open android
    )
)

echo.
pause
