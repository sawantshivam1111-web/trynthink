package com.trynthink.app;

import android.accessibilityservice.AccessibilityService;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.view.accessibility.AccessibilityEvent;
import android.widget.TextView;
import java.util.Set;

public class FocusAccessibilityService extends AccessibilityService {
    private long lastBlock = 0;
    private View overlay = null;
    private WindowManager wm;

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event.getEventType() != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return;
        CharSequence pkgCs = event.getPackageName();
        if (pkgCs == null) return;
        String pkg = pkgCs.toString();
        if (pkg.equals(getPackageName())) return;

        SharedPreferences p = getSharedPreferences(FocusPlugin.PREFS, Context.MODE_PRIVATE);
        long end = p.getLong(FocusPlugin.KEY_END, 0);
        if (end <= System.currentTimeMillis()) return;

        Set<String> apps = p.getStringSet(FocusPlugin.KEY_APPS, null);
        if (apps == null || !apps.contains(pkg)) return;

        long now = System.currentTimeMillis();
        if (now - lastBlock < 1500) return;
        lastBlock = now;

        performGlobalAction(GLOBAL_ACTION_HOME);
        showGreyOverlay();

        Intent i = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (i != null) {
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
            startActivity(i);
        }
    }

    private void showGreyOverlay() {
        if (overlay != null) return;
        if (wm == null) wm = (WindowManager) getSystemService(WINDOW_SERVICE);
        TextView tv = new TextView(this);
        tv.setText("Blocked during your focus session.\nStay with your own thinking.");
        tv.setTextColor(Color.WHITE);
        tv.setTextSize(20);
        tv.setGravity(Gravity.CENTER);
        tv.setBackgroundColor(0xE6808080);
        tv.setPadding(60, 60, 60, 60);
        WindowManager.LayoutParams lp = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT);
        overlay = tv;
        wm.addView(tv, lp);
        new Handler(Looper.getMainLooper()).postDelayed(this::removeOverlay, 2500);
    }

    private void removeOverlay() {
        if (overlay != null && wm != null) {
            try { wm.removeView(overlay); } catch (Exception e) { }
            overlay = null;
        }
    }

    @Override
    public void onInterrupt() {
        removeOverlay();
    }
}