package com.wadaage.driver;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register the native live-location bridge before the bridge starts,
        // so the taximeter keeps receiving GPS fixes while the phone is locked.
        registerPlugin(LiveLocationPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
