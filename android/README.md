# MethodWise AI – Native Android Studio Application

This folder contains the complete, production-ready **Android Studio Project** for **MethodWise AI – Smart Product Design & Manufacturing Decision Advisor**.

## How to Build in Android Studio

1. Open **Android Studio**.
2. Click **Open** and select this `android/` directory (`C:\Users\pellu\Downloads\METHODWISE2\android`).
3. Android Studio will automatically detect the Gradle configuration and sync dependencies.
4. Click top menu: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.

## Command Line Build

Run Gradle Wrapper directly from terminal:

```bash
# Windows
gradlew.bat assembleDebug

# macOS / Linux
./gradlew assembleDebug
```

The output APK will be placed at:
`app/build/outputs/apk/debug/app-debug.apk`
