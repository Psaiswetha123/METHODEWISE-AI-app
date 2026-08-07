package ai.methodwise.app

import ai.methodwise.app.models.ProjectItem
import ai.methodwise.app.network.ApiClient
import ai.methodwise.app.sync.SyncManager
import android.os.Bundle
import android.webkit.*
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity(), SyncManager.SyncCallback {

    private lateinit var webView: WebView
    private lateinit var syncManager: SyncManager
    private val hostNetworkUrl = "http://10.0.2.2:8080"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        webView = WebView(this)
        setContentView(webView)

        ApiClient.setBaseUrl(hostNetworkUrl)

        configureWebView()
        initRealTimeSync()
        loadWebApp()
    }

    private fun configureWebView() {
        val settings: WebSettings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW

        // Register Native JavaScript Bridge Interface
        webView.addJavascriptInterface(WebAppInterface(), "AndroidNativeBridge")

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                return false
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                view?.evaluateJavascript("window.SERVER_HOST_URL = '$hostNetworkUrl';", null)
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                if (request?.isForMainFrame == true) {
                    view?.loadUrl("file:///android_asset/index.html")
                }
            }
        }
    }

    private fun initRealTimeSync() {
        syncManager = SyncManager(this)
        syncManager.setSyncListener(this)
        try {
            syncManager.startSseRealTimeSync(hostNetworkUrl)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun loadWebApp() {
        val liveUrl = "$hostNetworkUrl/index.html"
        webView.loadUrl(liveUrl)
    }

    override fun onProjectsUpdated(projects: List<ProjectItem>) {
        runOnUiThread {
            webView.evaluateJavascript("if(window.MethodWiseSync && window.MethodWiseSync.fetchProjectsFromNetwork) window.MethodWiseSync.fetchProjectsFromNetwork();", null)
        }
    }

    override fun onProfileUpdated(userJson: String) {
        runOnUiThread {
            webView.evaluateJavascript("if(window.MethodWiseSync && window.MethodWiseSync.fetchProjectsFromNetwork) window.MethodWiseSync.fetchProjectsFromNetwork();", null)
        }
    }

    override fun onSettingsUpdated(settingsJson: String) {
        runOnUiThread {
            webView.evaluateJavascript("if(window.MethodWiseSync && window.MethodWiseSync.fetchProjectsFromNetwork) window.MethodWiseSync.fetchProjectsFromNetwork();", null)
        }
    }

    inner class WebAppInterface {
        @JavascriptInterface
        fun showToast(message: String) {
            runOnUiThread {
                Toast.makeText(this@MainActivity, message, Toast.LENGTH_SHORT).show()
            }
        }

        @JavascriptInterface
        fun setAuthToken(token: String) {
            ApiClient.setAuthToken(token)
        }

        @JavascriptInterface
        fun getServerHostUrl(): String {
            return hostNetworkUrl
        }
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        syncManager.stopSync()
    }
}
