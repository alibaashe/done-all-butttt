# Wadaage Mobility — Somaliland Ride-Hailing & Logistics Platform

Wadaage is a bilingual (Somali & English) ride-hailing and fleet management platform tailored for Somaliland (Hargeisa, Borama, Berbera, Burao).

## 🚀 Key Applications

1. **Wadaage Rider App (`?app=rider`)**:
   - Live GPS booking, address autocomplete, ride estimation.
   - WadaageShare carpooling & split-fare calculation.
   - Zaad (+252 63) & eDahab (+252 65) mobile money payments.
   - Real-time connection with driver partners (Accept/Reject/Transfer).

2. **Wadaage Driver Partner App (`?app=driver`)**:
   - Online/Offline availability toggle.
   - Driver HUD with live ride dispatch (Accept, Decline, Transfer to nearest driver).
   - **Compulsory KYC Registration (`Foomka Buuxa ee Darawalka`)** for Somaliland ID, Driver's License, Vehicle details, and Guarantor info.
   - Driver Commission Wallet and real-time earnings tracker.

3. **Wadaage Super Admin Portal (`?app=admin`)**:
   - Live God's Eye fleet telemetry map.
   - Driver KYC verification and approval system.
   - Real-time trip dispatch, surge pricing, geofencing, and WhatsApp gateway configuration.
   - Ready for Hostinger cPanel / VPS web deployment.

---

## 📱 How to Clone from GitHub & Build Android APKs

### 1. Clone the Repository
```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd wadaage-taxi
npm install
```

### 2. Build Android APKs via CMD (Windows)
We provide automated batch scripts in the project root:

- **Build Rider APK**:
  Double-click or run in CMD:
  ```cmd
  build_rider_apk.bat
  ```
- **Build Driver APK**:
  Double-click or run in CMD:
  ```cmd
  build_driver_apk.bat
  ```

### 3. Build Android APKs via Terminal (Mac / Linux / WSL)
```bash
chmod +x build_apks.sh
./build_apks.sh
```

### 4. Locate Your Generated APK Files
After the build finishes, your Android APKs will be located at:
```text
android/app/build/outputs/apk/debug/app-debug.apk
```
Transfer this `.apk` file to your Android phone via USB or WhatsApp and tap to install!

---

## 💻 Web & Server Deployment

```bash
# Run full development server (Express + Vite on port 3000)
npm run dev

# Compile full-stack bundle (Web + API Server)
npm run build

# Start production server
npm start
```
