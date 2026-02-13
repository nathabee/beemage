

## fdroid conf

android configuration is at the repo root and define fastlane to be in the subdir apps/android-native

./.fdroid.yml


## fastlane

the information to puclish into fdroid are here:

```txt
android-native$ tree fastlane
fastlane
└── metadata
    └── android
        └── en-US
            ├── changelogs
            │   └── 1002005.txt
            ├── full_description.txt
            ├── images
            │   ├── icon.png
            │   └── phoneScreenshots
            │       └── 1.png
            ├── short_description.txt
            └── title.txt

```

### image
 
inkscape docs/icon.svg --export-type=png --export-filename apps/android-native/fastlane/metadata/android/en-US/images/icon.png -w 512 -h 512


### changelog
changelogs/<versionCode>.txt?

It’s the “What’s new” text shown in F-Droid for that specific release. The filename must match the APK’s versionCode literally, and it’s max 500 characters.

Key point: this file is catalog/user-facing, so keep it:

short (1–4 lines),

focused on user-visible outcomes,

not a full technical commit log.
