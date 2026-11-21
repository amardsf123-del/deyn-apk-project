package com.deyn.app;

import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.nio.charset.StandardCharsets;
import java.security.KeyStore;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/**
 * AES-256-GCM with a NON-EXPORTABLE key generated inside Android Keystore (one per installation).
 * JavaScript never receives the key; it only sends data to encrypt/decrypt.
 * STATUS: written but NOT compiled or tested on a device (no Android SDK in the authoring environment).
 */
@CapacitorPlugin(name = "DeynVault")
public class DeynVaultPlugin extends Plugin {
    private static final String ALIAS = "deyn_data_key_v1";
    private static final String PROVIDER = "AndroidKeyStore";

    private synchronized SecretKey key() throws Exception {
        KeyStore ks = KeyStore.getInstance(PROVIDER);
        ks.load(null);
        if (!ks.containsAlias(ALIAS)) {
            KeyGenerator kg = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, PROVIDER);
            kg.init(new KeyGenParameterSpec.Builder(ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .setRandomizedEncryptionRequired(true)   // Keystore picks a fresh random IV for every encryption
                .build());
            kg.generateKey();
        }
        return (SecretKey) ks.getKey(ALIAS, null);
    }

    private byte[] aad(PluginCall call) {
        String a = call.getString("aad", "");
        return a.getBytes(StandardCharsets.UTF_8);
    }

    @PluginMethod
    public void status(PluginCall call) {
        try {
            // Self-test: a real encrypt/decrypt round trip must work before JS is allowed to rely on the vault.
            SecretKey k = key();
            Cipher e = Cipher.getInstance("AES/GCM/NoPadding");
            e.init(Cipher.ENCRYPT_MODE, k);
            byte[] ct = e.doFinal(new byte[] {1, 2, 3});
            Cipher d = Cipher.getInstance("AES/GCM/NoPadding");
            d.init(Cipher.DECRYPT_MODE, k, new GCMParameterSpec(128, e.getIV()));
            byte[] pt = d.doFinal(ct);
            JSObject r = new JSObject();
            r.put("ready", pt.length == 3 && pt[0] == 1 && pt[2] == 3);
            call.resolve(r);
        } catch (Exception ex) {
            call.reject("vault unavailable: " + ex.getClass().getSimpleName());
        }
    }

    @PluginMethod
    public void encrypt(PluginCall call) {
        try {
            byte[] data = Base64.decode(call.getString("data", ""), Base64.NO_WRAP);
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.ENCRYPT_MODE, key());
            c.updateAAD(aad(call));
            byte[] ct = c.doFinal(data);
            JSObject r = new JSObject();
            r.put("iv", Base64.encodeToString(c.getIV(), Base64.NO_WRAP));
            r.put("data", Base64.encodeToString(ct, Base64.NO_WRAP));
            call.resolve(r);
        } catch (Exception ex) {
            call.reject("encrypt failed: " + ex.getClass().getSimpleName());
        }
    }

    @PluginMethod
    public void decrypt(PluginCall call) {
        try {
            byte[] iv = Base64.decode(call.getString("iv", ""), Base64.NO_WRAP);
            byte[] data = Base64.decode(call.getString("data", ""), Base64.NO_WRAP);
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(128, iv));
            c.updateAAD(aad(call));
            byte[] pt = c.doFinal(data);        // throws AEADBadTagException if tampered / wrong key
            JSObject r = new JSObject();
            r.put("data", Base64.encodeToString(pt, Base64.NO_WRAP));
            call.resolve(r);
        } catch (Exception ex) {
            call.reject("decrypt failed: " + ex.getClass().getSimpleName());
        }
    }
}
