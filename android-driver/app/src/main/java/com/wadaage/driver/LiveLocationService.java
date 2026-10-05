package com.wadaage.driver;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

/**
 * Wadaage Driver - Live Taximeter Location Service.
 *
 * Purpose
 * -------
 * Android freezes a backgrounded WebView, which stops `navigator.geolocation` from
 * delivering fixes. That used to pause the digital taximeter whenever the driver
 * locked the screen. This foreground service keeps a real GPS stream alive while
 * the phone is locked or the app is in the background, and also keeps the app
 * process alive so the incoming-order ringtone can still play.
 *
 * Every fix is handed to {@link LiveLocationPlugin}, which forwards it into the
 * WebView so the existing taximeter odometer logic runs unchanged.
 */
public class LiveLocationService extends Service {

    public static final String ACTION_START = "com.wadaage.driver.LIVE_LOCATION_START";
    public static final String ACTION_STOP = "com.wadaage.driver.LIVE_LOCATION_STOP";
    public static final String EXTRA_INTERVAL_MS = "intervalMs";
    public static final String EXTRA_DISTANCE_M = "distanceM";
    public static final String EXTRA_TITLE = "title";
    public static final String EXTRA_TEXT = "text";

    private static final String TAG = "WadaageLiveLocation";
    private static final String CHANNEL_ID = "wadaage_live_trip";
    private static final int NOTIFICATION_ID = 7411;

    /** True while a location stream is running, so JS can query the real state. */
    public static volatile boolean isRunning = false;

    private LocationManager locationManager;
    private LocationListener locationListener;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : ACTION_START;

        if (ACTION_STOP.equals(action)) {
            stopEverything();
            return START_NOT_STICKY;
        }

        long intervalMs = intent != null ? intent.getLongExtra(EXTRA_INTERVAL_MS, 5000L) : 5000L;
        float distanceM = intent != null ? intent.getFloatExtra(EXTRA_DISTANCE_M, 10f) : 10f;
        String title = intent != null ? intent.getStringExtra(EXTRA_TITLE) : null;
        String text = intent != null ? intent.getStringExtra(EXTRA_TEXT) : null;

        if (title == null || title.trim().isEmpty()) title = "Wadaage Driver";
        if (text == null || text.trim().isEmpty()) text = "Taximeter is running - your trip is being recorded";

        // Must call startForeground promptly (Android 8+ requirement, 5s on 12+).
        startForegroundCompat(title, text);

        startLocationUpdates(intervalMs, distanceM);

        // If the OS kills us, do not auto-restart into a zombie stream.
        return START_NOT_STICKY;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;
            NotificationChannel existing = nm.getNotificationChannel(CHANNEL_ID);
            if (existing == null) {
                NotificationChannel channel = new NotificationChannel(
                        CHANNEL_ID,
                        "Active trip",
                        NotificationManager.IMPORTANCE_LOW // silent: this one is just the ongoing trip notice
                );
                channel.setDescription("Shown while the Wadaage taximeter is recording your trip");
                channel.setShowBadge(false);
                nm.createNotificationChannel(channel);
            }
        }
    }

    private void startForegroundCompat(String title, String text) {
        Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent pendingIntent = null;
        if (launchIntent != null) {
            int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                piFlags |= PendingIntent.FLAG_IMMUTABLE;
            }
            pendingIntent = PendingIntent.getActivity(this, 0, launchIntent, piFlags);
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(text)
                .setSmallIcon(getApplicationInfo().icon)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setCategory(NotificationCompat.CATEGORY_SERVICE);

        if (pendingIntent != null) {
            builder.setContentIntent(pendingIntent);
        }

        Notification notification = builder.build();

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Android 10+ requires an explicit foreground service type.
                startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);
            } else {
                startForeground(NOTIFICATION_ID, notification);
            }
        } catch (Exception e) {
            // Android 14 throws if the location permission is missing. Fail soft:
            // the JS layer still has the WebView stream available while foregrounded.
            Log.e(TAG, "startForeground failed (location permission missing?): " + e.getMessage());
        }
    }

    private void startLocationUpdates(long intervalMs, float distanceM) {
        if (locationListener != null) return; // already streaming

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
                != PackageManager.PERMISSION_GRANTED
                && ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION)
                != PackageManager.PERMISSION_GRANTED) {
            Log.w(TAG, "No location permission granted; not starting the GPS stream.");
            return;
        }

        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        if (locationManager == null) return;

        locationListener = new LocationListener() {
            @Override
            public void onLocationChanged(Location location) {
                if (location == null) return;
                LiveLocationPlugin.dispatchLocation(
                        location.getLatitude(),
                        location.getLongitude(),
                        location.getAccuracy(),
                        location.getSpeed(),
                        location.getBearing(),
                        location.getTime()
                );
            }

            @Override
            public void onStatusChanged(String provider, int status, Bundle extras) {}

            @Override
            public void onProviderEnabled(String provider) {}

            @Override
            public void onProviderDisabled(String provider) {}
        };

        boolean started = false;
        try {
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                locationManager.requestLocationUpdates(
                        LocationManager.GPS_PROVIDER, intervalMs, distanceM, locationListener, Looper.getMainLooper());
                started = true;
            }
            if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                locationManager.requestLocationUpdates(
                        LocationManager.NETWORK_PROVIDER, intervalMs, distanceM, locationListener, Looper.getMainLooper());
                started = true;
            }
        } catch (SecurityException e) {
            Log.e(TAG, "Location permission revoked: " + e.getMessage());
        } catch (Exception e) {
            Log.e(TAG, "requestLocationUpdates failed: " + e.getMessage());
        }

        isRunning = started;
        Log.i(TAG, "Location stream started=" + started + " intervalMs=" + intervalMs + " distanceM=" + distanceM);
    }

    private void stopEverything() {
        try {
            if (locationManager != null && locationListener != null) {
                locationManager.removeUpdates(locationListener);
            }
        } catch (Exception ignored) {}
        locationListener = null;
        isRunning = false;
        try {
            stopForeground(true);
        } catch (Exception ignored) {}
        stopSelf();
        Log.i(TAG, "Location stream stopped.");
    }

    @Override
    public void onDestroy() {
        try {
            if (locationManager != null && locationListener != null) {
                locationManager.removeUpdates(locationListener);
            }
        } catch (Exception ignored) {}
        locationListener = null;
        isRunning = false;
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null; // started service, not bound
    }
}
