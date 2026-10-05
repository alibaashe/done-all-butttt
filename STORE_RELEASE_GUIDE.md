# Wadaage Mobility — Play Store & App Store Release Guide

**Prepared for:** Wadaage Mobility (Hargeisa, Somaliland)
**Apps:** `Wadaage Taxi` (rider) · `Wadaage Driver` (driver partner)
**Build date:** 2026-10-04

---

## 0. Website & app URLs

The public site uses clean path routing:

| URL | What it opens |
|---|---|
| `https://www.wadaage.com/` | **Welcome website** (marketing / landing page) |
| `https://www.wadaage.com/rider` | Passenger (rider) web app |
| `https://www.wadaage.com/driver` | Driver partner web app |
| `https://www.wadaage.com/admin` | Fleet operations dashboard |

Notes:

- The **root path always shows the welcome website**, even for a visitor who
  previously used the rider or driver app. App choice is no longer remembered
  for `/` — that only applied to old `?app=` links.
- Any unknown path (`/about`, `/privacy`, …) also shows the welcome website
  instead of a broken page.
- **Legacy links still work.** `?app=rider`, `?app=driver`, `?app=admin` and the
  `admin.` / `driver.` / `rider.` subdomains all continue to resolve correctly,
  so existing QR codes and shared links will not break.
- The sub-path URLs are **deep links** — no server rewrite is needed because the
  Node server already serves `index.html` for every path. They can be shared,
  bookmarked, and used in QR codes.
- PWA install manifests now start at the matching path: `/rider` and `/driver`
  (previously `/?app=rider` / `?app=driver`).

**Important:** these URLs only work once you **redeploy the new `dist/` build**
to `www.wadaage.com`. On an older deployment `/rider` would 404. After uploading,
open all four URLs and confirm each one loads the right screen.

Routing is covered by an automated test — run it any time you touch navigation:

```bash
npm run test:routes     # 22 URL cases, expects all to pass
```

---

## 1. What is in `build_output/`

| File | Size | Use this for |
|---|---|---|
| `Wadaage_Rider_Release.aab` | 13.27 MB | **Google Play upload — Rider app** |
| `Wadaage_Driver_Release.aab` | 13.27 MB | **Google Play upload — Driver app** |
| `Wadaage_Rider_Release.apk` | 13.48 MB | Sideloading / testers / direct download from your website |
| `Wadaage_Driver_Release.apk` | 13.48 MB | Sideloading / testers / direct download from your website |
| `Wadaage_Rider_Debug.apk` | 16.93 MB | Internal debugging only — **never publish** |
| `Wadaage_Driver_Debug.apk` | 16.93 MB | Internal debugging only — **never publish** |

Verified build facts:

| Property | Rider | Driver |
|---|---|---|
| Application ID | `com.wadaage.rider` | `com.wadaage.driver` |
| App label | Wadaage Taxi | Wadaage Driver |
| Version name | 1.0.0 | 1.0.0 |
| Version code | 1 | 1 |
| Min Android | 7.0 (API 24) | 7.0 (API 24) |
| Target Android | 16 (API 36) | 16 (API 36) |
| Signing | v2 + v3, verified | v2 + v3, verified |
| AAB | JAR signed, Play-ready | JAR signed, Play-ready |

`targetSdkVersion 36` satisfies Google Play's current
[target API level requirement](https://developer.android.com/google/play/requirements/target-sdk)
(Play requires a recent API target for new apps and updates).

---

## 2. CRITICAL — Back up your signing keys first

Your upload keystores are in `build_keys/`:

```
build_keys/
  wadaage_rider_upload.keystore        <- Rider upload key
  wadaage_driver_upload.keystore       <- Driver upload key
  KEYSTORE_CREDENTIALS_DO_NOT_COMMIT.txt   <- passwords
```

**Do this now, before anything else.** Copy `build_keys/` to:

1. A password manager entry, and
2. An encrypted backup (external drive or private cloud folder).

> If you lose these files you can never publish an update to the same Play
> Store listing again. There is no recovery.

When you create the apps in Play Console, enable **Play App Signing**
(Play Console → *Test and release* → *App integrity*). Google then holds the
real app-signing key and this keystore is only your *upload* key. That is the
recommended setup and it lets you request an upload-key reset if you ever lose
it.

Print the fingerprints you will need for Google Maps and Firebase:

```powershell
$kt = "C:\Program Files\Eclipse Adoptium\jdk-21.0.4.7-hotspot\bin\keytool.exe"
& $kt -list -v -keystore "build_keys\wadaage_rider_upload.keystore"  -alias wadaage-rider
& $kt -list -v -keystore "build_keys\wadaage_driver_upload.keystore" -alias wadaage-driver
```

Add both **SHA-1** values to the Google Cloud Console API-key restrictions, and
both **SHA-256** values to your Firebase Android app registrations. Without this
step Google Maps and Firebase may reject requests coming from the production
builds.

---

## 3. Publishing to Google Play

### 3.1 One-time account setup

1. Create a **Google Play Developer account** — https://play.google.com/console/signup
   (one-time **US$25** fee, personal or organisation).
2. Complete the **developer identity verification** (name, address, phone, and
   for organisations a D-U-N-S number). This can take a few days — start early.
3. If your account is a **personal** (not organisation) account created after
   Nov 2023, Google also requires a **closed test with at least 12 testers for
   14 continuous days** before you can apply for production access. Plan for
   this delay.

### 3.2 Create app 1 — Wadaage Taxi

1. Play Console → **Create app**.
   - App name: `Wadaage Taxi`
   - Default language: `English (United States)` (add **Somali** too)
   - App or game: **App**
   - Free or paid: **Free**
2. Accept the developer program policies and US export declarations.
3. **Set up your app** checklist — complete each section:

| Section | What to enter |
|---|---|
| App access | "All functionality is available without special access" — or give reviewer demo rider + driver credentials if login is required. **Reviewers must be able to log in.** |
| Ads | No ads |
| Content rating | Complete the questionnaire (Taxi/ride-hailing → likely *Everyone*) |
| Target audience | 18+ (or 13+; ride-hailing is not for children) |
| News app | No |
| Data safety | Declare: **Location (precise)**, **Personal info (name, phone, email)**, **Financial info (payment)**, **Photos** — all *collected*, *not shared with third parties*, *encrypted in transit*. See §5. |
| Government apps | No |
| Financial features | If riders pay in-app, declare it |
| Privacy policy | **Required.** See §5. |

4. **Store listing** (see §4 for ready-to-paste text):
   - Short description (max 80 chars)
   - Full description (max 4000 chars)
   - App icon **512 × 512 PNG**, 32-bit, no transparency
   - Feature graphic **1024 × 500 PNG/JPG**
   - At least **2 phone screenshots** (min 320 px, max 3840 px per side)
5. **Production → Create new release**:
   - Upload `Wadaage_Rider_Release.aab`
   - Release name: `1.0.0`
   - Release notes: e.g. `First release — book taxis and Wadaage Share rides in Hargeisa with live metered fares.`
6. **Countries/regions** → select **Somalia** (and any others you serve).
7. **Send for review.** First review typically takes a few days to two weeks.

### 3.3 Create app 2 — Wadaage Driver

Repeat §3.2 with:

- App name: `Wadaage Driver`
- Upload `Wadaage_Driver_Release.aab`
- Use the **driver** screenshots
- In Data safety, the driver app additionally uses **background location** —
  declare location as collected *and* explain it is used to keep trips and the
  taximeter running while the screen is off.

### 3.4 Later updates

1. Bump **both** numbers in `android-rider/app/build.gradle` and
   `android-driver/app/build.gradle`:
   ```gradle
   versionCode 2          // must increase every upload, never reuse
   versionName "1.0.1"    // what users see
   ```
2. Re-run `.\build_release.ps1`
3. Upload the new `.aab` in Play Console → Production → Create new release.

---

## 4. Store listing text (ready to paste)

### Wadaage Taxi (rider) — short description (78 chars)
```
Book a taxi or Wadaage Share ride in Hargeisa. Live metered fare, fair price.
```

### Wadaage Taxi (rider) — full description
```
Wadaage Taxi is the easiest way to get around Hargeisa.

Book a ride in seconds, watch your captain approach on the live map, and see
exactly what you pay before you confirm. No haggling, no surprises.

WHY RIDERS CHOOSE WADAAGE
• Live metered fare — the digital taximeter shows your distance and price
  updating in real time, so you always know what you are paying
• Transparent standard pricing — first kilometre 12,000 SLSH (about $1.20),
  each extra kilometre +7,000 SLSH (about $0.70)
• Ride now or schedule for later
• Share trips (Wadaage Share) to split the cost with other passengers
• Track your ride live and share your trip with family
• SOS button, verified captains, and boarding PIN for safety
• Pay with cash or your Wadaage wallet
• Somali and English

WADAAGE SHARE
Travelling the same direction? Share the ride and pay less.

SAFETY FIRST
Every captain is verified. Every trip has a boarding PIN. One tap reaches
emergency help.

Wadaage — Safar wadaag, nolol wadaag.
```

### Wadaage Driver (driver) — short description (79 chars)
```
Drive with Wadaage. Accept trips, run the digital taximeter, track earnings.
```

### Wadaage Driver (driver) — full description
```
Earn on your own schedule with Wadaage Driver.

Go online, accept trips near you, and let the app handle the rest.

BUILT FOR PROFESSIONAL DRIVERS
• Live digital taximeter for standing pickups and street hails — the meter
  counts real kilometres from GPS and shows the same fare to you and your rider
• Transparent Hargeisa standard pricing: first kilometre 12,000 SLSH ($1.20),
  each extra kilometre +7,000 SLSH ($0.70)
• Automatic fare calculation, waiting-time meter, and instant trip receipts
• Wadaage Share trips to earn more on the same route
• Wallet balance and commission tracking
• Fuel monitor and vehicle health reminders
• GPS navigation with voice guidance
• Somali and English

GO ONLINE IN SECONDS
Set your vehicle, go online, and start receiving nearby ride requests.

Wadaage Driver — drive more, earn more.
```

---

## 5. Privacy policy (REQUIRED — Play will reject without it)

You must host a privacy policy at a public URL, e.g.
`https://www.wadaage.com/privacy`, and link it in Play Console.

It must cover:

- **What you collect:** name, phone number, email, precise location (GPS),
  trip history, payment records, device identifiers, and — for drivers —
  vehicle and KYC documents.
- **Why:** to match riders with drivers, calculate metered fares, process
  payments, provide safety features, and comply with law.
- **Background location (driver app):** explain that location is collected
  while the app is in the background so an active trip and the taximeter keep
  working when the screen is off. Play reviews this closely.
- **Sharing:** with the matched driver/rider, payment processors, and Firebase
  infrastructure — and that you do **not** sell personal data.
- **Retention and deletion:** how long you keep data and how a user requests
  deletion (email address plus in-app option).
- **Contact:** a real support email.
- **Children:** state the service is not for children under 18.

Also fill **Data safety** in Play Console consistently with this policy.
Mismatches between the policy, the Data safety form, and actual app behaviour
are the most common rejection reason for ride-hailing apps.

---

## 6. Screenshots to capture

Take these on a real phone with the release APK installed.

**Rider app (Wadaage Taxi):**
1. Home map with the ride booking card and estimated fare
2. Driver matched — captain card, vehicle and plate, boarding PIN
3. **Live taximeter running** — distance travelled and live fare updating
4. Fare breakdown / trip receipt
5. Wadaage Share seat selection

**Driver app (Wadaage Driver):**
1. Home map with the online toggle and earnings summary
2. Incoming ride request with pickup, dropoff and fare
3. **Standing Pickup — Open Taximeter screen** (the 12,000 SLSH flag drop)
4. **Live taximeter HUD during a trip** — KM travelled and live fare
5. Trip completion receipt

> Screenshot #3 in each list showcases the new live metering feature — make it
> the one that appears first on the store page.

---

## 7. iOS — what you must do on a Mac

**An iOS App Store build cannot be produced on Windows.** Apple requires
Xcode, which only runs on macOS. Everything that *can* be prepared on Windows
has been prepared; the remaining steps need a Mac (or a macOS cloud build
service such as Codemagic, Bitrise, or GitHub Actions `macos-latest` runners).

### 7.1 On the Mac

```bash
# 1. Get the project onto the Mac, then:
npm install --ignore-scripts

# 2. Add the iOS platform (this is why @capacitor/ios is already installed)
npx cap add ios

# 3. Build the web bundle and copy it in
npx cap sync ios

# 4. Open in Xcode
npx cap open ios
```

### 7.2 In Xcode

1. Select the **App** target → **Signing & Capabilities**
   - Team: your Apple Developer team
   - Bundle Identifier: `com.wadaage.rider` (and `com.wadaage.driver`)
   - Enable **Automatically manage signing**
2. **Info.plist** — Apple requires usage descriptions for every permission the
   app requests. Add:
   - `NSLocationWhenInUseUsageDescription` —
     "Wadaage uses your location to find nearby drivers and show your trip on the map."
   - `NSLocationAlwaysAndWhenInUseUsageDescription` (driver app) —
     "Wadaage Driver keeps reporting your location during an active trip so the
     taximeter keeps counting while your screen is off."
   - `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription` (document upload)
   - `NSMicrophoneUsageDescription` (in-app voice calls)
3. **Deployment target:** iOS 14.0 or newer.
4. **Archive:** Product → Archive → Distribute App → App Store Connect.

### 7.3 In App Store Connect

1. Enrol in the **Apple Developer Program** — **US$99/year**
   (https://developer.apple.com/programs/).
2. Create the app records (`Wadaage Taxi`, `Wadaage Driver`), same bundle IDs.
3. Fill in the listing: name, subtitle, description, keywords, support URL,
   privacy policy URL, **App Privacy** questionnaire (the iOS equivalent of
   Play's Data safety form), age rating, and screenshots.
4. Upload the build (Xcode or Transporter), attach it to a version, submit.

**Apple review is stricter than Google's.** The two most likely rejection
points for this app:

- **Background location without clear justification.** Explain the taximeter
  use case in the review notes field and in the app's Info.plist strings.
- **Account deletion.** Apple requires apps with account creation to offer
  in-app account deletion. Make sure that path exists before submitting.

---

## 8. Rebuilding after any code change

```powershell
# Full rebuild of both apps (web bundle + signed APK + signed AAB)
.\build_release.ps1

# Only one app
.\build_release.ps1 -Target rider
.\build_release.ps1 -Target driver

# Fast native-only rebuild (skip re-bundling the web assets)
.\build_release.ps1 -SkipWeb -SkipClean
```

Results always land in `build_output/`.

Requirements, all already satisfied on this machine:

| Tool | Version used | Note |
|---|---|---|
| Node.js | 24.13.1 | |
| JDK | Temurin **21** | Capacitor 7 requires Java 21 — the script auto-detects it |
| Android SDK | `%LOCALAPPDATA%\Android\Sdk` | compileSdk 36 installed |
| Gradle | 8.14.3 (wrapper) | downloaded by `gradlew` |

---

## 9. Known items to address before/soon after launch

These do not block publishing but you should fix them:

1. **Background metering stops when the driver's screen locks (important for revenue).**
   I verified how geolocation works in the native app:
   `Capacitor Bridge.java` calls `settings.setGeolocationEnabled(true)` and
   `BridgeWebChromeClient` grants the runtime permission, so the meter works
   correctly **while the driver's screen is on**. However, the driver app has
   **no Android foreground service** — the permissions
   (`FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_LOCATION`, `ACCESS_BACKGROUND_LOCATION`)
   are declared in the manifest but nothing actually starts a service. Android
   therefore freezes the WebView once the screen locks or the app is
   backgrounded, `watchPosition` stops delivering fixes, and the meter pauses.

   The code is defensive about this: on resume it detects the gap, re-anchors
   the odometer, and will not charge for a jump over 1.5 km, so the fare can
   never run away. But a driver who locks the screen for a long trip would
   under-report distance.

   **Mitigation today:** your driver app already holds a screen wake lock
   (`notificationService.requestWakeLock()`), which keeps the screen on and the
   meter running. Tell drivers to keep the app in the foreground during a
   metered trip until this is properly fixed.

   **Proper fix (needs a native change and on-device testing):**
   add a small Android `Service` with `startForeground(id, notification)` and a
   `LocationListener`, declared in the manifest as
   `android:foregroundServiceType="location"`, started when the driver goes
   online with an active metered trip and stopped when the trip ends. It should
   relay each fix into the WebView
   (`bridge.getWebView().post(() -> bridge.getWebView().evaluateJavascript(...))`)
   so the existing `accumulateMeterFromGps()` path is reused. I did not ship
   this because it cannot be verified without a physical test drive, and an
   untested service on the money path is riskier than the documented gap.

2. **`webContentsDebuggingEnabled: true`** in both
   `capacitor-*.config.json` files. Set it to `false` for production — it allows
   anyone with USB debugging to inspect the app's web layer.
3. **`usesCleartextTraffic="true"`** and `"cleartext": true`. Harmless while
   everything goes through `https://www.wadaage.com`, but Play flags it as
   insecure. Once you confirm no plain `http://` call remains, remove it.
4. **Google Maps API key restriction.** The key currently embedded is
   unrestricted. In Google Cloud Console restrict it to *Android apps* with
   package name + SHA-1 for `com.wadaage.rider` and `com.wadaage.driver`.
   An unrestricted key can be stolen and billed to you.
5. **No `google-services.json`.** Firebase Cloud Messaging push notifications
   are not active in the native builds. If you want push notifications, add
   `google-services.json` to `android/app/` for each app ID and rebuild.
6. **Rotate the secrets you shared in chat.** Your MySQL password and WhatsApp
   Cloud API token appeared in plain text in this conversation. Change the
   database password in Hostinger and regenerate the WhatsApp token in Meta's
   dashboard, then update `.env.server` on the VPS. `.env.server` is already
   listed in `.gitignore`, so it will never be committed.
