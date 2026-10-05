# 📱 Wadaage Mobility - Windows PowerShell APK Build Guide
**Hage Tallaabo-Tallaabo ah: Ku Dhisida Rider APK iyo Driver APK Nidaamka Windows PowerShell**

---

## 📋 Hordhac (Overview)

Mashruuca Wadaage Mobility wuxuu si buuxda ugu diyaar garoobay in labada App ee Android si toos ah looga dhiso **Windows PowerShell**:
1. **Wadaage Rider APK (Passenger)**: `com.wadaage.rider` — Magaca: **Wadaage Taxi**
2. **Wadaage Driver APK (Driver Partner)**: `com.wadaage.driver` — Magaca: **Wadaage Driver**

Labada mashruuc waxay leeyihiin faylalkooda Android oo u gooni ah (`android-rider` iyo `android-driver`), taasoo ka hortagaysa in ay isku dhacaan ama telefoonka dushiisa iska tirtiraan marka la wada shido.

---

## 🛠️ Waxyaabaha Looga Baahan Yahay Windows (Prerequisites)

Kahor inta aadan amarka bixin, hubi in kombuyuutarkaaga Windows ay ku rakiban yihiin:

1. **Node.js (v18 ama v20+)**
   - Kala soo deg: [https://nodejs.org](https://nodejs.org)
   - Hubi adoo PowerShell ku qoraya: `node -v`

2. **Java JDK 17 ama JDK 21**
   - Eclipse Temurin OpenJDK: [https://adoptium.net/](https://adoptium.net/) (ama JDK-ga la socda Android Studio)
   - Hubi adoo ku qoraya: `java -version`

3. **Android Studio & Android SDK**
   - Kala soo deg: [https://developer.android.com/studio](https://developer.android.com/studio)
   - Hubi in Android SDK Command-line Tools iyo Build-tools lagu dhex rakibay Android Studio (`Tools -> SDK Manager`).

---

## 🚀 TALLAABADA 1: Fur Windows PowerShell

1. Tag galka uu ku jiro mashruuca Wadaage (Project Folder).
2. Guji midigta meel banaan ah oo dooro **"Open in Terminal"** ama **"Open PowerShell window here"**.
3. Hubi in PowerShell ku furmay galka mashruuca:
   ```powershell
   ls
   ```

---

## 🔓 TALLAABADA 2: Fasax Execution Policy-ga PowerShell

Haddii ay tahay markii ugu horeysay ee aad PowerShell script ku waddo kombuyuutarka, qor amarkan si uu PowerShell kuugu ogolaado in script-ku ordo:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```
*(Guji `Y` haddii uu ku weydiiyo Ogolaansho).*

---

## 🔨 TALLAABADA 3: Bilow Dhisida Labada APK

Waxaad haysataa **3 hab** oo aad u fudud:

### Habka 1: Interactive Menu (Ugu Fudud)
Qor amarkan si uu kuugu soo baxo menu midabaysan oo aad ka dooran karto Rider, Driver, ama Labadaba:

```powershell
.\build_apks.ps1
```

Waxay ku weydiin doontaa:
```text
 [1] Build Wadaage Rider (Passenger) APK
 [2] Build Wadaage Driver Partner APK
 [3] Build Both Rider and Driver APKs
 [4] Open Rider Project in Android Studio
 [5] Open Driver Project in Android Studio
 [6] Check Prerequisites & Environment
 [0] Exit
```
- Geli `3` haddii aad rabto labada APK hal mar in laguugu dhiso.
- Geli `1` haddii aad rabto Rider kaliya.
- Geli `2` haddii aad rabto Driver kaliya.

---

### Habka 2: Hal Amar oo Toos ah (Direct Commands)

Haddii aadan rabin menu, waxaad toos u qori kartaa:

- **Labadaba hal mar dhis:**
  ```powershell
  .\build_apks.ps1 -Target both
  ```

- **Rider APK kaliya:**
  ```powershell
  .\build_rider.ps1
  ```
  *(ama `npm run build:rider:apk`)*

- **Driver APK kaliya:**
  ```powershell
  .\build_driver.ps1
  ```
  *(ama `npm run build:driver:apk`)*

---

## 📦 TALLAABADA 4: Halkee Laga Helayaa Faylasha APK?

Marka dhisidu dhamaato, script-ku wuxuu si toos ah faylasha APK ugu soo diyaarinayaa galka **`build_output\`**:

```text
📁 mashruuca\build_output\
   ├── 📱 Wadaage_Rider_Debug.apk    (Wadaage Taxi Passenger App)
   └── 📱 Wadaage_Driver_Debug.apk   (Wadaage Driver Partner App)
```

---

## 📲 TALLAABADA 5: Ku Shubida Telefoonka Android (Testing)

1. Ku xidh telefoonkaaga Android kombuyuutarka adoo isticmaalaya USB Cable.
2. Faylasha `Wadaage_Rider_Debug.apk` iyo `Wadaage_Driver_Debug.apk` ku koobi galka `Downloads` ee telefoonkaaga.
3. Telefoonka ka fur **My Files / File Manager** -> **Downloads**.
4. Guji faylka APK-ga si aad u rakibto (Haddii telefoonku ku weydiiyo, dooro *"Allow from this source"* ama *"Install anyway"*).
5. Fur labada App oo tijaabi:
   - **Rider App**: Dooro meesha aad tagayso, fiiri qiimaha, dalbo Wadaage ama Standard Taxi.
   - **Driver App**: Gal mode-ka "Online", arag dalabaadka kugu dhow, qaado Wadaage Share dalab labaad oo jidka ku jira!

---

## ⚙️ Xallinta Khaladaadka Caadiga ah (Troubleshooting)

### 1. "JAVA_HOME is not set" ama "Java not found"
Haddii aad Android Studio horay u rakibatay, waxaad PowerShell ku qori kartaa:
```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;" + $env:PATH
```

### 2. "ANDROID_HOME is not set"
Haddii Android SDK la waayo, qor:
```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH = "$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\cmdline-tools\latest\bin;" + $env:PATH
```

### 3. Ku Furista Android Studio (Haddii aad doonayso GUI)
Waxaad toos ugu furan kartaa Android Studio:
- Rider: `npx cap open android` (ama menu-ga dooro option `4`)
- Driver: Menu-ga dooro option `5`
Android Studio dhexdiisa, waxaad ka riixaysaa: **Build -> Build Bundle(s) / APK(s) -> Build APK(s)**.
