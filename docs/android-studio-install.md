# Install Android Studio on Ubuntu and run the BeeMage Android wrapper

**BeeMage — Explore image processing through visual pipelines**  
* **Document updated for version:** `0.2.2`

**Goal**
- Install Android Studio + Android SDK on Ubuntu (fresh machine).
- Build the BeeMage Android web bundle.
- Embed it into the native wrapper and run it (emulator or device).

This guide assumes Ubuntu 24.04. Adapt package names if needed.

---

## 0. Preconditions

You already have:

- `git`
- Node.js + npm (you can run `npm install` and `npm run build`)
- your BeeMage repo cloned

From repo root, you should see:

- `apps/android-web/`
- `apps/android-native/`

---

## 1. Install required system packages

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

Expected: OpenJDK 17.x.

---

## 2. Download Android Studio

Download from the official site:

* [https://developer.android.com/studio](https://developer.android.com/studio)

Or via terminal (example URL; version may change):

```bash
cd ~/Downloads
wget https://redirector.gvt1.com/edgedl/android/studio/ide-zips/2024.1.1.12/android-studio-2024.1.1.12-linux.tar.gz
```

---

## 3. Install Android Studio into /opt

```bash
cd /opt
sudo tar -xzf ~/Downloads/android-studio-*-linux.tar.gz
sudo chown -R $USER:$USER /opt/android-studio
```

Android Studio lives here:

```
/opt/android-studio
```

---

## 4. (Optional but recommended) Add environment + helper command

Add this to `~/.bashrc` (or `~/.zshrc` if using zsh):

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

Launch:

```bash
studio
```

---

## 5. First launch: Android Studio Setup Wizard

On the first start:

1. **Import settings** → Do not import
2. **Install type** → Standard
3. **SDK location** → accept default (`~/Android/Sdk`)
4. Finish and wait for downloads

After Android Studio opens:

* `File → Settings → Android SDK`

  * install at least one recent SDK platform (e.g. API 34/35)
  * ensure build-tools + platform-tools are installed

---

## 6. Enable emulator acceleration (KVM) on Ubuntu

This is required for a fast emulator.

### 6.1 Check CPU virtualization support

```bash
egrep -c '(vmx|svm)' /proc/cpuinfo
```

If result is `0`, hardware virtualization is disabled in BIOS/UEFI.

### 6.2 Install checker

```bash
sudo apt-get install -y cpu-checker
sudo kvm-ok
```

### 6.3 Install KVM packages

```bash
sudo apt-get install -y qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils
```

### 6.4 Add your user to groups

```bash
sudo usermod -aG kvm,libvirt $USER
```

Log out and log in again (or reboot), then verify:

```bash
groups | tr ' ' '\n' | egrep 'kvm|libvirt'
kvm-ok
```

Expected output includes:

* `kvm`
* `libvirt`
* `KVM acceleration can be used`

---

## 7. Build BeeMage Android web bundle and sync into wrapper

From repo root:

```bash
./apps/android-web/scripts/build-android-web.sh
```

This must result in a copied bundle in:

```
apps/android-native/app/src/main/assets/
```

Expected asset structure:

```
apps/android-native/app/src/main/assets/
├─ index.html
├─ app/
│  ├─ panel.html
│  └─ panel.css
└─ assets/
   ├─ *.js
   └─ pipelines/
      ├─ *.json
```

If this directory is empty, stop and fix the android-web build first.

---

## 8. Open the Android wrapper in Android Studio

Open Android Studio and choose:

* **Open** → select the folder:

  ```
  apps/android-native/
  ```

Wait for Gradle sync to finish.

---

## 9. Run on emulator or device

### 9.1 Emulator (recommended for dev)

* Tools → Device Manager → Create device
* Install a system image (x86_64 recommended)
* Start the emulator
* Click **Run ▶**

### 9.2 Physical device (optional)

* Enable developer options + USB debugging
* Plug device via USB
* Approve debugging prompt
* Verify:

```bash
adb devices
```

Then run from Android Studio.

---

## 10. Debugging WebView

### 10.1 Inspect WebView

In desktop Chrome:

```
chrome://inspect
```

You should see the WebView instance.

### 10.2 Common issues

* **Blank screen**

  * assets not copied into `app/src/main/assets/`
  * wrong base path in the web bundle (must be relative)
* **Missing JS files**

  * confirm the `assets/` folder exists under `assets/`
* **Pipelines missing**

  * ensure `assets/pipelines/` exists in the bundle

---

## 11. Clean rebuild workflow

When you change shared code (`src/`) or android-web host:

```bash
./apps/android-web/scripts/build-android-web.sh
./apps/android-native/scripts/build-android-native.sh apk debug
```

Then reinstall/run.

---

## Final state

You now have:

* `apps/android-web/` building a WebView-compatible web bundle from shared `src/`
* `apps/android-native/` embedding that bundle into an Android app
* no fork of `src/`
* deterministic rebuilds suitable for CI and store distribution later

 