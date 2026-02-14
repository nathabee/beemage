# Testing BeeMage with F-Droid (Real Submission Flow)

## 1. Create a GitLab Account

1. Go to [https://gitlab.com](https://gitlab.com)
2. Click **Register**
3. Create a personal account (free plan is enough)
4. Verify email
5. Log in

You do NOT need to pay. Free tier is sufficient.

---

## 2. Fork the Official F-Droid Metadata Repository

Navigate to the official repository:

👉 [https://gitlab.com/fdroid/fdroiddata](https://gitlab.com/fdroid/fdroiddata)

Then:

1. Click **Fork**
2. Choose your **personal namespace** (e.g. `nathabee`) +  name Data=>fdroiddata
3. Set visibility to **Public**
4. Click **Fork project**
Wait until GitLab finishes cloning the repository.

You should now have:

```
https://gitlab.com/nathabee/fdroiddata
```
authentificate your phone to allow pipeline to work

---

## 3. Clone Your Fork Locally

```bash
git clone https://gitlab.com/nathabee/fdroiddata.git
cd fdroiddata
```
create a new branche (master must stay clean we will work on the branch 
```bash
git checkout -b de.nathabee.beemage
```
 

#optional :
#git remote add upstream https://gitlab.com/fdroid/fdroiddata.git
#git remote -v

---

## 4. Create BeeMage Metadata File

 

Create a new file:

```
touch metadata/de.nathabee.beemage.yml
```
 

---

## 5. Minimal Metadata Content

copy the ./fdroid.yml (from beemage repository) inside fdroiddata/metatdata :

`metadata/de.nathabee.beemage.yml`



Important:

* `versionCode` must match your check.sh logic
* `commit` must match your GitHub tag exactly

---

## 6. Commit and Push

```bash
git add metadata/de.nathabee.beemage.yml
git commit -m "Add BeeMage (initial metadata)"
git push -u origin de.nathabee.beemage

```

---

## 7. Observe GitLab CI

Now go to:

```
GitLab → Your fdroiddata fork → CI/CD → Pipelines
```

GitLab will automatically run the F-Droid validation pipeline.

This will tell you:

* If your YAML format is valid
* If the repo is accessible
* If the build process works
* If node installation works
* If Gradle build succeeds inside F-Droid environment

---

## 8. What This Actually Tests

This verifies:

* F-Droid can clone your GitHub repo
* It can checkout tag `v0.2.5`
* It can build `apps/android-native`
* Your build step correctly generates assets
* The APK is reproducible

This is a real simulation of F-Droid submission.

---

## 9. What We Are NOT Testing Yet

* Screenshots review
* App description quality
* Manual review stage
* Official merge into upstream

We are only validating build reproducibility.

---

## 10. If CI Fails

Copy the error log.

Most common issues:

* Wrong package name
* Missing gradle wrapper
* Node not available
* Wrong relative path in build step
* Missing SDK config

We fix them iteratively.

---

## 11. When It Works

When your fork builds successfully:

1. Open a Merge Request
2. Target upstream `fdroid/fdroiddata`
3. Wait for human review
 

---
 

## NOTE: configuration in beemage

### fdroid conf xml

android configuration is at the repo root and define fastlane to be in the subdir apps/android-native

./.fdroid.yml

the current version (of last commited in the github) must allways point to the one we want that fdroid is referencing currently
the version update will be done when we make a release-all.sh

(always publish the android : question is asl in )


### fastlane
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

#### image
 
inkscape docs/icon.svg --export-type=png --export-filename apps/android-native/fastlane/metadata/android/en-US/images/icon.png -w 512 -h 512


### changelog
changelogs/<versionCode>.txt?

It’s the “What’s new” text shown in F-Droid for that specific release. The filename must match the APK’s versionCode literally, and it’s max 500 characters.

Key point: this file is catalog/user-facing, so keep it:

short (1–4 lines),

focused on user-visible outcomes,

not a full technical commit log.


## publish

release-all call ... 

#
