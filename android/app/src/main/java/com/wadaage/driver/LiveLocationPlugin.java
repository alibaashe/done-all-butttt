package com.wadaage.driver;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/**
 * Wadaage Driver - native live location bridge.
 *
 * Exposes the {@link LiveLocationService} foreground service to JavaScript and
 * forwards every native GPS fix into the WebView as a "location" event, so the
 * taximeter keeps counting while the phone is locked.
 */
@CapacitorPlugin(
        name = "LiveLocation",
        permissions = {
                @Permission(
                        alias = "location",
                        strings = { Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION }
                ),
                @Permission(
                        alias = "backgroundLocation",
                        strings = { Manifest.permission.ACCESS_BACKGROUND_LOCATION }
                ),
                @Permission(
                        alias = "notifications",
                        strings = { Manifest.permission.POST_NOTIFICATIONS }
                )
        }
)
public class LiveLocationPlugin extends Plugin {

    /** Held statically so the service can push fixes without binding to the plugin instance. */
    private static LiveLocationPlugin instance;

    @Override
    public void load() {
        instance = this;
    }

    @Override
    protected void handleOnDestroy() {
        if (instance == this) instance = null;
        super.handleOnDestroy();
    }

    /** Called from {@link LiveLocationService} on every GPS fix. */
    static void dispatchLocation(double lat, double lng, float accuracy, float speed, float bearing, long time) {
        LiveLocationPlugin plugin = instance;
        if (plugin == null) return;
        plugin.notifyLocation(lat, lng, accuracy, speed, bearing, time);
    }

    private void notifyLocation(double lat, double lng, float accuracy, float speed, float bearing, long time) {
        JSObject payload = new JSObject();
        payload.put("latitude", lat);
        payload.put("longitude", lng);
        payload.put("accuracy", (double) accuracy);
        payload.put("speed", (double) speed);
        payload.put("bearing", (double) bearing);
        payload.put("time", (double) time);
        payload.put("source", "native-service");
        try {
            notifyListeners("location", payload);
        } catch (Exception ignored) {}
    }

    // ------------------------------------------------------------------
    // Permissions
    // ------------------------------------------------------------------

    private String stateOf(String alias) {
        try {
            PermissionState state = getPermissionState(alias);
            return state != null ? state.toString() : "prompt";
        } catch (Exception e) {
            return "prompt";
        }
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        JSObject result = new JSObject();
        result.put("location", stateOf("location"));
        result.put("backgroundLocation", stateOf("backgroundLocation"));
        result.put("notifications", stateOf("notifications"));
        call.resolve(result);
    }

    /**
     * Ask for foreground location first. Android requires "while using the app"
     * to be granted before the background prompt is even allowed (API 30+).
     */
    @PluginMethod
    public void requestLocationPermission(PluginCall call) {
        if ("granted".equals(stateOf("location"))) {
            JSObject result = new JSObject();
            result.put("location", "granted");
            call.resolve(result);
            return;
        }
        requestPermissionForAlias("location", call, "locationPermissionCallback");
    }

    @PermissionCallback
    private void locationPermissionCallback(PluginCall call) {
        JSObject result = new JSObject();
        result.put("location", stateOf("location"));
        call.resolve(result);
    }

    /**
     * Background location. On Android 11+ this must be requested separately,
     * after foreground location has already been granted, otherwise the system
     * silently denies it.
     */
    @PluginMethod
    public void requestBackgroundPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
                && !"granted".equals(stateOf("location"))) {
            JSObject result = new JSObject();
            result.put("location", stateOf("location"));
            result.put("backgroundLocation", "prompt");
            result.put("reason", "foreground_required_first");
            call.resolve(result);
            return;
        }
        requestPermissionForAlias("backgroundLocation", call, "backgroundPermissionCallback");
    }

    @PermissionCallback
    private void backgroundPermissionCallback(PluginCall call) {
        JSObject result = new JSObject();
        result.put("backgroundLocation", stateOf("backgroundLocation"));
        call.resolve(result);
    }

    /** Android 13+ needs POST_NOTIFICATIONS before the ongoing trip notification can show. */
    @PluginMethod
    public void requestNotificationPermission(PluginCall call) {
        JSObject result = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && !"granted".equals(stateOf("notifications"))) {
            requestPermissionForAlias("notifications", call, "notificationPermissionCallback");
            return;
        }
        result.put("notifications", "granted");
        call.resolve(result);
    }

    @PermissionCallback
    private void notificationPermissionCallback(PluginCall call) {
        JSObject result = new JSObject();
        result.put("notifications", stateOf("notifications"));
        call.resolve(result);
    }

    // ------------------------------------------------------------------
    // Service control
    // ------------------------------------------------------------------

    private boolean hasLocationPermission() {
        Context context = getContext();
        return ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                || ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    @PluginMethod
    public void start(PluginCall call) {
        if (!hasLocationPermission()) {
            call.reject("Location permission not granted");
            return;
        }

        Context context = getContext();

        Long intervalMs = call.getLong("intervalMs", 5000L);
        Double distanceM = call.getDouble("distanceFilterM", 10.0);
        String title = call.getString("title", "Wadaage Driver");
        String text = call.getString("text", "Taximeter is running - your trip is being recorded");

        Intent intent = new Intent(context, LiveLocationService.class);
        intent.setAction(LiveLocationService.ACTION_START);
        intent.putExtra(LiveLocationService.EXTRA_INTERVAL_MS, intervalMs != null ? intervalMs : 5000L);
        intent.putExtra(LiveLocationService.EXTRA_DISTANCE_M, distanceM != null ? distanceM.floatValue() : 10f);
        intent.putExtra(LiveLocationService.EXTRA_TITLE, title);
        intent.putExtra(LiveLocationService.EXTRA_TEXT, text);

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent);
            } else {
                context.startService(intent);
            }
        } catch (Exception e) {
            call.reject("Could not start the live location service: " + e.getMessage());
            return;
        }

        JSObject result = new JSObject();
        result.put("running", true);
        call.resolve(result);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        try {
            Intent intent = new Intent(getContext(), LiveLocationService.class);
            intent.setAction(LiveLocationService.ACTION_STOP);
            getContext().startService(intent);
        } catch (Exception ignored) {}

        JSObject result = new JSObject();
        result.put("running", false);
        call.resolve(result);
    }

    @PluginMethod
    public void isRunning(PluginCall call) {
        JSObject result = new JSObject();
        result.put("running", LiveLocationService.isRunning);
        call.resolve(result);
    }

    /**
     * Native vibration. `navigator.vibrate()` is unreliable inside a WebView and
     * does nothing once the screen is locked, which is exactly when a driver most
     * needs to feel an incoming order.
     */
    @PluginMethod
    public void vibrate(PluginCall call) {
        try {
            com.getcapacitor.JSArray patternArray = call.getArray("pattern");
            long[] pattern;
            if (patternArray != null && patternArray.length() > 0) {
                pattern = new long[patternArray.length()];
                for (int i = 0; i < patternArray.length(); i++) {
                    pattern[i] = patternArray.optLong(i, 250L);
                }
            } else {
                pattern = new long[] { 0, 800, 200, 800, 200, 1000, 200, 1000 };
            }

            android.os.Vibrator vibrator;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                android.os.VibratorManager vm =
                        (android.os.VibratorManager) getContext().getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
                vibrator = vm != null ? vm.getDefaultVibrator() : null;
            } else {
                vibrator = (android.os.Vibrator) getContext().getSystemService(Context.VIBRATOR_SERVICE);
            }

            if (vibrator != null && vibrator.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(android.os.VibrationEffect.createWaveform(pattern, -1));
                } else {
                    vibrator.vibrate(pattern, -1);
                }
            }
        } catch (Exception e) {
            // Vibration is a nice-to-have; never fail the order alert because of it.
            call.resolve();
            return;
        }
        call.resolve();
    }

    /** Stop any vibration still running (e.g. driver accepted or declined). */
    @PluginMethod
    public void cancelVibration(PluginCall call) {
        try {
            android.os.Vibrator vibrator;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                android.os.VibratorManager vm =
                        (android.os.VibratorManager) getContext().getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
                vibrator = vm != null ? vm.getDefaultVibrator() : null;
            } else {
                vibrator = (android.os.Vibrator) getContext().getSystemService(Context.VIBRATOR_SERVICE);
            }
            if (vibrator != null) vibrator.cancel();
        } catch (Exception ignored) {}
        call.resolve();
    }
}
