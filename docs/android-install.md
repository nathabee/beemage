# Install Android Studio on Ubuntu (from scratch) and run the BeeMage Android wrapper

* **Document updated for version:** `0.2.2`

**Goal**
- Install Android Studio (if necessary)
- Build the BeeMage Android web bundle
- Embed it into the native Android wrapper and run the app

This guide assumes **Ubuntu 24.04** (adjust if needed).

---

## Step 0 — Preconditions

You already have:

- a cloned BeeMage repository
- Node.js + npm working

Quick sanity checks:

```bash
node -v
npm -v
```

Repository layout (relevant parts):

* `apps/android-web/` — builds the WebView-compatible web bundle
* `apps/android-native/` — Android Studio / Gradle wrapper (WebView app)
* `src/` — shared application core (UI + pipelines)

---

## Step 1 — Install required system packages

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

Expected (or similar):

```text
openjdk version "17.x"
```

JDK 17 is a good baseline for Gradle builds.

---

## Step 2 — Download Android Studio

Use the official download page:

[https://developer.android.com/studio](https://developer.android.com/studio)

Download **Linux (.tar.gz)**.

Optional (CLI download): Android Studio versions change often, so prefer the website unless you intentionally pin a version.

---

## Step 3 — Install Android Studio under /opt

Assuming the tarball is in `~/Downloads`:

```bash
cd /opt
sudo tar -xzf ~/Downloads/android-studio-*-linux.tar.gz
sudo chown -R "$USER:$USER" /opt/android-studio
```

Android Studio is now here:

```text
/opt/android-studio
```

---

## Step 4 — First launch and SDK installation

Launch:

```bash
/opt/android-studio/bin/studio.sh
```

In the Setup Wizard:

1. **Do not import settings**
2. Install type: **Standard**
3. SDK location: accept default

   ```text
   ~/Android/Sdk
   ```
4. Make sure these are installed:

   * Android SDK Platform
   * Android SDK Build-Tools
   * Android SDK Platform-Tools
   * Android Emulator (if you want an emulator)

After Studio opens:

* `File → Settings → Android SDK`
* Install at least one recent SDK platform (API 34/35 is fine)

---

## Step 5 — Environment variables (recommended)

Add to `~/.bashrc` or `~/.zshrc`:

```bash
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH"

studio() {
  /opt/android-studio/bin/studio.sh
}
```

Reload:

```bash
source ~/.bashrc
```

Verify ADB:

```bash
adb version
```

---

## Step 6 — Build the Android web bundle and sync it into the wrapper

This is the required build order.

From the **repo root**:

```bash
./apps/android-web/scripts/build-android-web.sh
```

What this does:

1. Builds the WebView-compatible bundle:

   * output: `apps/android-web/dist/`
2. Copies the bundle into the native wrapper assets:

   * destination: `apps/android-native/app/src/main/assets/`

Expected asset tree inside the wrapper:

```text
apps/android-native/app/src/main/assets/
├─ index.html
├─ app/
│  ├─ panel.html
│  └─ panel.css
└─ assets/
   ├─ *.js
   └─ pipelines/
```

Nothing inside `apps/android-native/app/src/main/assets/` should be committed (except `.gitkeep`).

---

## Step 7 — Open the Android wrapper in Android Studio

1. Start Android Studio:

   ```bash
   studio
   ```
2. Open project folder:

   ```text
   <repo>/apps/android-native
   ```
3. Wait for Gradle sync.

If Android Studio asks for the SDK path, point it to:

```text
~/Android/Sdk
```

---

## Step 8 — Run the app

Choose one:

### Option A — Emulator

* `Tools → Device Manager`
* Create a device
* Run

### Option B — Physical device

* Enable Developer Options + USB debugging
* Connect via USB
* Confirm device appears:

  ```bash
  adb devices
  ```

Then press **Run** in Android Studio.

Expected result:

* BeeMage UI loads in the Android app
* Tabs render
* Image import works
* Pipelines execute
* No crash on rotate

---

## Step 9 — Debugging WebView

### Inspect WebView from Chrome

On your desktop Chrome:

```text
chrome://inspect
```

You should see the BeeMage WebView instance and be able to open DevTools.

### Common failures

* Blank screen: assets not copied (re-run Step 6)
* JS error: check WebView console via `chrome://inspect`
* Missing assets: verify the `assets/` folder exists under `app/src/main/assets/`

---

## Step 10 — Command-line build (optional, reproducible)

From repo root:

### Debug APK

```bash
./apps/android-native/gradlew -p apps/android-native assembleDebug
```

### Release APK + AAB (store artifacts)

```bash
./apps/android-native/gradlew -p apps/android-native assembleRelease
./apps/android-native/gradlew -p apps/android-native bundleRelease
```

Release signing must be configured for real store publishing. If signing is not configured yet, Gradle will fail on release tasks.

---

## Final state

You now have:

* `apps/android-web/` — builds the WebView bundle (no Chrome APIs, no OpenCV)
* `apps/android-native/` — native Android wrapper embedding the bundle
* shared app core stays in `src/` and is reused unchanged

The only required manual rule is:

1. build android-web
2. run android-native

 