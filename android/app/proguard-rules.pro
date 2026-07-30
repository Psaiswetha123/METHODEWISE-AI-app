# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in C:\Users\pellu\AppData\Local\Android\Sdk/tools/proguard/proguard-android.txt
# You can edit the include line and the file paths to fit your project setup.

-keepclassmembers class * extends android.webkit.WebView {
   public *;
}
-keep class android.webkit.** { *; }
