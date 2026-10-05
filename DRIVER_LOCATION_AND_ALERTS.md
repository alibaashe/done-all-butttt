# Wadaage Driver — Location, Screen-Off GPS & Order Alerts

**Applies to:** `Wadaage Driver` (`com.wadaage.driver`) — Android
**Related files:** `LiveLocationService.java`, `LiveLocationPlugin.java`, `src/services/liveLocationService.ts`

---

## 1. What the driver app now does

| Situation | Behaviour |
|---|---|
| First launch | Asks for location permission ("While using the app") |
| After location is granted | Asks separately for "Allow all the time" (background location) |
| Android 13+ | Asks for notification permission so the trip notice can appear |
| Driver goes **Online** | Starts a foreground service; a small "Taximeter is running" notice appears in the shade |
| Phone screen locked / app in background | **GPS keeps reporting.** Distance and fare keep counting |
| New order arrives while phone is locked | Loud alarm notification on a MAX-importance channel **+** native vibration **+** the in-app ringtone |
| Driver goes **Offline** | Foreground service stops; the notice disappears |

---

## 2. The permission dialogs — what the driver must tap

On first run the driver sees **three** prompts. The order matters:

### Prompt 1 — Location
> "Allow Wadaage Driver to access this device's location?"

**Tap "While using the app"** (or "Precise").

### Prompt 2 — Notifications (Android 13+)
> "Allow Wadaage Driver to send you notifications?"

**Tap "Allow."** Without this the ongoing-trip notice and order alerts are silent.

### Prompt 3 — Background location
> "Allow Wadaage Driver to access this device's location all the time?"

**Tap "Allow all the time."**

> **This third prompt is the one that decides whether the taximeter keeps
> counting when the phone is locked.** If the driver picks "Only while using the
> app", the foreground service still helps but Android may throttle the GPS
> stream while the screen is off.

If the driver dismissed a prompt by mistake, they can fix it later:

**Settings → Apps → Wadaage Driver → Permissions → Location → "Allow all the time"**

---

## 3. How the driver can confirm it is working

On the driver home map there is a live status bar:

| What it shows | Meaning |
|---|---|
| 🟢 **Live GPS: receiving** + **SCREEN-OFF ON** | Everything is working. Location keeps reporting with the screen locked. |
| 🟢 **Live GPS: receiving** + **APP ONLY** | Location works, but background permission was not granted. Tell the driver to enable "Allow all the time". |
| 🟡 **Live GPS: waiting...** | No GPS fix yet — usually indoors. Move to open sky. |

A persistent notification **"Wadaage Driver — Taximeter is running"** also appears
in the notification shade while the driver is online. If that notice is missing,
the system has stopped the service.

---

## 4. How the order alert works when the phone is asleep

There are three independent layers, so at least one gets through:

1. **Loud alarm notification** — routed to an Android notification channel
   (`wadaage-orders-urgent`) created at MAX importance with the *alarm* sound and
   `bypassDnd`. Android plays a channel's sound even on a locked screen, based on
   the **channel**, not the individual notification.
2. **Native vibration** — done in Java, not `navigator.vibrate()`, because the
   WebView's vibrate API does nothing once the screen is locked.
3. **In-app ringtone** — the looping Web Audio chime. This keeps playing because
   the foreground service keeps the app process alive; without it Android would
   freeze the WebView and the sound would stop after a few seconds.

To verify on a real phone:

1. Driver app open, go **Online**.
2. Lock the phone. Wait a minute.
3. From the rider app (or admin panel / another phone), place an order.
4. The phone should **sound the alarm and vibrate**, and the screen should light up
   with the order notification.
5. Unlock and accept. The alarm sound must stop (it is cancelled on accept/decline).

If the phone stays silent, check in this order:

- Notification permission is **Allowed**.
- The **"Taximeter is running"** notice is in the shade (service is alive).
- Battery optimisation is **not** restricting the app:
  *Settings → Apps → Wadaage Driver → Battery → Unrestricted*.
  Some phones (Xiaomi, Oppo, Vivo, Samsung) aggressively kill background apps —
  also enable **Autostart** for Wadaage Driver if the phone has that setting.
- The phone is not in **Do Not Disturb** (the channel requests bypassDnd, but the
  user can still block it manually).

---

## 5. Battery note

The foreground service requests a GPS fix at most every **5 seconds / 10 metres**,
and only while the driver is **Online**. When the driver goes Offline the service
stops and the notification disappears. This keeps battery use reasonable, and it
is also what Google Play expects: background location is only permitted for a
user-visible, ongoing activity.

---

## 6. Where this is implemented

| File | Role |
|---|---|
| `android-driver/app/src/main/java/com/wadaage/driver/LiveLocationService.java` | The foreground service: `startForeground()` + `LocationManager` updates |
| `android-driver/app/src/main/java/com/wadaage/driver/LiveLocationPlugin.java` | Capacitor bridge: permissions, start/stop, `location` events, native vibrate |
| `android-driver/app/src/main/java/com/wadaage/driver/MainActivity.java` | Registers the plugin before the bridge starts |
| `android-driver/app/src/main/AndroidManifest.xml` | Declares the service with `android:foregroundServiceType="location"` |
| `src/services/liveLocationService.ts` | TypeScript wrapper + permission flow |
| `src/components/Driver/MobileDriverApp.tsx` | Starts/stops the service, feeds fixes into the taximeter, shows the GPS badge |
| `public/sw.js` | Creates the loud order channel and routes notification taps to `/driver` |

`build_release.ps1` verifies on every build that the driver manifest really
declares the service and that the rider manifest does not — so this can never
silently regress.

---

## 7. Not covered here: iOS

iOS has no equivalent foreground service for this. The iOS driver app needs the
`location` background mode (`UIBackgroundModes`) in Xcode plus
`NSLocationAlwaysAndWhenInUseUsageDescription`. See §7 of
`STORE_RELEASE_GUIDE.md`.
