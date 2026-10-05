@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo   WADAAGE DRIVER PARTNER - ANDROID APK BUILD SCRIPT
echo ========================================================
echo.

echo [1/5] Setting configuration for Driver App (com.wadaage.driver)...
copy /Y capacitor-driver.config.json capacitor.config.json >nul

echo [2/5] Checking dependencies...
if not exist "node_modules" (
    call npm install
)

echo [3/5] Compiling Driver Production Bundle...
set VITE_APP_MODE=driver
call npm run build:driver

echo [4/5] Syncing Android Project Assets...
if exist "android-driver" (
    xcopy /E /I /Y android-driver android >nul 2>&1
)
call npx cap sync android
if exist "android-driver" (
    xcopy /E /I /Y dist android-driver\app\src\main\assets\public >nul 2>&1
)

echo [5/5] Building Android Debug APK with Gradle...
if not exist "build_output" mkdir build_output

if exist "android-driver\gradlew.bat" (
    cd android-driver
    call gradlew.bat assembleDebug
    cd ..
    if exist "android-driver\app\build\outputs\apk\debug\app-debug.apk" (
        copy /Y android-driver\app\build\outputs\apk\debug\app-debug.apk build_output\Wadaage_Driver_Debug.apk >nul
        echo.
        echo ========================================================
        echo  SUCCESS: Driver APK ready at:
        echo  build_output\Wadaage_Driver_Debug.apk
        echo ========================================================
    )
) else (
    cd android
    if exist "gradlew.bat" (
        call gradlew.bat assembleDebug
        cd ..
        copy /Y android\app\build\outputs\apk\debug\app-debug.apk build_output\Wadaage_Driver_Debug.apk >nul
        echo.
        echo ========================================================
        echo  SUCCESS: Driver APK ready at:
        echo  build_output\Wadaage_Driver_Debug.apk
        echo ========================================================
    ) else (
        cd ..
        echo Gradle wrapper not found. Opening Android Studio...
        call npx cap open android
    )
)

echo.
pause
