package com.trynthink.app;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONArray;
import java.util.HashSet;
import java.util.Set;

@CapacitorPlugin(name = "FocusBlocker")
public class FocusPlugin extends Plugin {
    static final String PREFS = "focus_prefs";
    static final String KEY_END = "end_ms";
    static final String KEY_APPS = "apps";

    @PluginMethod
    public void start(PluginCall call) {
        int minutes = call.getInt("minutes", 25);
        JSONArray arr = call.getArray("apps");
        Set<String> apps = new HashSet<>();
        if (arr != null) {
            for (int i = 0; i < arr.length(); i++) {
                String p = arr.optString(i, "");
                if (!p.isEmpty()) apps.add(p);
            }
        }
        long end = System.currentTimeMillis() + minutes * 60L * 1000L;
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        prefs.edit().putLong(KEY_END, end).putStringSet(KEY_APPS, apps).apply();
        JSObject ret = new JSObject();
        ret.put("ok", true);
        ret.put("blocked", apps.size());
        call.resolve(ret);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().clear().apply();
        call.resolve();
    }

    @PluginMethod
    public void isEnabled(PluginCall call) {
        String enabled = Settings.Secure.getString(getContext().getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
        String pkg = getContext().getPackageName();
        String target = pkg + "/" + pkg + ".FocusAccessibilityService";
        JSObject ret = new JSObject();
        ret.put("enabled", enabled != null && enabled.contains(target));
        call.resolve(ret);
    }

    @PluginMethod
    public void openSettings(PluginCall call) {
        Intent i = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(i);
        call.resolve();
    }
}