# Install Android Studio on Ubuntu (from scratch) and how to install the android wrapper


* **Document updated for version:** `0.2.0`

**goal** :
-  install android studio if necessary 
-  Load `android/dist/` inside a real Android app and see BeeMage run.

  


This section assumes **a fresh Ubuntu machine** with no Android tooling installed.

---

## Step 0 — Preconditions

in this doc we are installing on Ubuntu 24.04, adapt if necessary

You already have Node.js and npm working (you successfully ran `npm install` / `npm run build`).

You also already built the Android web bundle:

```bash
cd android
npm install
npm run build
```

This produced:

```
beemage/android/dist/
├─ index.html
├─ app/
│  ├─ panel.html
│  └─ panel.css
└─ assets/
   ├─ *.js
   └─ pipelines/*.json
```

**Do not modify this directory.**
It is the artifact that will be embedded into the Android app.

---

## Step 1 — Install required system packages

Open a terminal and run:

```bash
sudo apt update
sudo apt install -y \
  libc6:i386 \
  libstdc++6:i386 \
  lib32z1 \
  libbz2-1.0:i386 \
  unzip \
  wget \
  curl \
  openjdk-17-jdk

```

### Verify Java

```bash
java -version
```

Expected output (or similar):

```
openjdk version "17.x"
```

Android Studio currently works best with **JDK 17**.

---

## Step 2 — Download Android Studio

Go to the official site:

👉 [https://developer.android.com/studio](https://developer.android.com/studio)

Download **Linux (.tar.gz)**.

Or via terminal:

```bash
cd ~/Downloads
wget https://redirector.gvt1.com/edgedl/android/studio/ide-zips/2024.1.1.12/android-studio-2024.1.1.12-linux.tar.gz
```

(Version number may change; the site always gives the current one.)

---

## Step 3 — Extract Android Studio

```bash
cd /opt
sudo tar -xzf ~/Downloads/android-studio-*-linux.tar.gz
sudo chown -R $USER:$USER /opt/android-studio
```

Android Studio is now located at:

```
/opt/android-studio
```

---

## Step 4 — Launch Android Studio (first time)

```bash
/opt/android-studio/bin/studio.sh
```

The **Setup Wizard** will appear.

---

## Step 5 — Android Studio Setup Wizard (important choices)

Follow exactly:

1. **Import settings**
   → `Do not import settings`

2. **Install type**
   → `Standard`

3. **Select UI theme**
   → Your choice

4. **SDK Components**
   Make sure these are checked:

   * Android SDK
   * Android SDK Platform
   * Android Virtual Device

5. **SDK Location**
   Accept default:

   ```
   ~/Android/Sdk
   ```

6. Click **Finish** and wait for downloads.

This can take several minutes.

---

## Step 6 — Verify Android SDK installation

After Android Studio opens:

1. Open **Settings**
   `File → Settings → Android SDK`

2. Check:

   * **SDK Platforms**

     * At least one recent version (e.g. Android 14 / API 34)
   * **SDK Tools**

     * Android SDK Build-Tools
     * Android SDK Platform-Tools
     * Android Emulator

Click **Apply** if anything is missing.

---

## Step 7 — Set environment variables (recommended)

Add these to your shell config (`~/.bashrc` or `~/.zshrc`):

```bash
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH"
```

Reload shell:

```bash
source ~/.bashrc
```

Verify:

```bash
adb version
```

Expected:

```
Android Debug Bridge version x.x.x
```

---

## Step 8 — Create the BeeMage Android project

In Android Studio:

1. **New Project**
2. Template: **Empty Views Activity**
3. Name: `BeeMage`
4. Package name: `de.nathabee.beemage`
5. Language: **Kotlin**
6. Minimum SDK: **API 24**
7. Finish

Wait for Gradle sync.


this create BeeMage project inside ~/AndroidStudioProjects/

```sh
mv ~/AndroidStudioProjects/BeeMage <path to your beemage repository>/android-wrapper
mkdir -p <path to your beemage repository>/android-wrapper/app/src/main/assets

```

in ~.bashrc add:
```sh
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH"
studio() {
  /opt/android-studio/bin/studio.sh
}

```

change session and start android studio:
```sh
studio
```


---

## Step 9 — Prepare assets directory

In Android Studio (Project view → Android):

```
app
└─ src
   └─ main
      └─ assets   ← it should exists
```

---

## Step 10 — Copy BeeMage web bundle into Android assets

From your repo root:

```bash
cp -r android/dist/*  android-wrapper/app/src/main/assets/
```

After copy, you must have:

```
app/src/main/assets/
├─ index.html
├─ app/
│  ├─ panel.html
│  └─ panel.css
└─ assets/
   ├─ panel-*.js
   ├─ index-*.js
   └─ pipelines/
```

---

## Step 11 — Replace layout with WebView

Edit:

```
app/src/main/res/layout/activity_main.xml
```

Replace contents with:

```xml
<?xml version="1.0" encoding="utf-8"?>
<WebView xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/webView"
    android:layout_width="match_parent"
    android:layout_height="match_parent" />
```

---

## Step 12 — Replace MainActivity.kt

Edit:

```
app/src/main/java/de/nathabee/beemage/MainActivity.kt
```

Replace **entire file** with:

```kotlin
package de.nathabee.beemage

import android.os.Bundle
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        WebView.setWebContentsDebuggingEnabled(true)

        val webView = WebView(this)
        setContentView(webView)

        val settings: WebSettings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.mediaPlaybackRequiresUserGesture = false

        webView.webViewClient = WebViewClient()

        webView.loadUrl("file:///android_asset/index.html")
    }
}
```

---

## Step 13 — Run the app

1. Create an emulator (Device Manager)
   or connect a physical Android device (USB debugging enabled)

2. Click **Run ▶**

### Expected result

* BeeMage UI loads
* Tabs visible
* Image upload works
* Pipelines execute
* No crash on rotate

If this works → **Android wrapper v0 is complete**.

---

## Step 14 — Debugging (if needed)

### Inspect WebView

On your desktop browser:

```
chrome://inspect
```

You should see the WebView listed.

### Common issues

* Blank screen → wrong asset path
* JS error → check console via `chrome://inspect`
* Missing assets → confirm `base: "./"` in Vite config

---

## Final state

You now have:

* `/android` → web bundle builder
* Android Studio project → WebView wrapper
* Zero changes to `/src`
* A real Android app running BeeMage

From here, everything else is **incremental**.
 