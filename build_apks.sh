#!/usr/bin/env bash
set -e

echo "========================================================"
echo "      WADAAGE MOBILITY - CROSS-PLATFORM APK BUILDER     "
echo "========================================================"
echo ""
echo "Select App to build:"
echo "1) Wadaage Rider (Passenger) APK   [com.wadaage.rider]"
echo "2) Wadaage Driver Partner APK      [com.wadaage.driver]"
echo "3) Both APKs (Rider + Driver)"
read -p "Enter choice [1-3]: " choice

build_rider() {
    echo "--- Building Wadaage Rider ---"
    cp capacitor-rider.config.json capacitor.config.json
    if [ ! -d "node_modules" ]; then npm install; fi
    VITE_APP_MODE=rider npm run build:rider

    mkdir -p build_output
    if [ -d "android-rider" ]; then
        cp -r dist/* android-rider/app/src/main/assets/public/
        cd android-rider
        ./gradlew assembleDebug
        cd ..
        cp android-rider/app/build/outputs/apk/debug/app-debug.apk build_output/Wadaage_Rider_Debug.apk
    else
        cp -r dist/* android/app/src/main/assets/public/
        cd android
        ./gradlew assembleDebug
        cd ..
        cp android/app/build/outputs/apk/debug/app-debug.apk build_output/Wadaage_Rider_Debug.apk
    fi
    echo "Rider APK ready at: build_output/Wadaage_Rider_Debug.apk"
}

build_driver() {
    echo "--- Building Wadaage Driver ---"
    cp capacitor-driver.config.json capacitor.config.json
    if [ ! -d "node_modules" ]; then npm install; fi
    VITE_APP_MODE=driver npm run build:driver

    mkdir -p build_output
    if [ -d "android-driver" ]; then
        cp -r dist/* android-driver/app/src/main/assets/public/
        cd android-driver
        ./gradlew assembleDebug
        cd ..
        cp android-driver/app/build/outputs/apk/debug/app-debug.apk build_output/Wadaage_Driver_Debug.apk
    else
        cp -r dist/* android/app/src/main/assets/public/
        cd android
        ./gradlew assembleDebug
        cd ..
        cp android/app/build/outputs/apk/debug/app-debug.apk build_output/Wadaage_Driver_Debug.apk
    fi
    echo "Driver APK ready at: build_output/Wadaage_Driver_Debug.apk"
}

case $choice in
    1)
        build_rider
        ;;
    2)
        build_driver
        ;;
    3)
        build_rider
        build_driver
        echo ""
        echo "========================================================"
        echo " Both APKs successfully saved to ./build_output/"
        echo " 1. build_output/Wadaage_Rider_Debug.apk"
        echo " 2. build_output/Wadaage_Driver_Debug.apk"
        echo "========================================================"
        ;;
    *)
        echo "Invalid option. Exiting."
        exit 1
        ;;
esac
