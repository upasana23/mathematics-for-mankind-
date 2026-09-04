package com.dpm.mathapp

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.OnBackPressedCallback
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView

class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            MathWebView()
        }

        // Android back button handling
        onBackPressedDispatcher.addCallback(
            this,
            object : OnBackPressedCallback(true) {
                override fun handleOnBackPressed() {
                    if (webView.canGoBack()) {
                        webView.goBack()
                    } else {
                        finish()
                    }
                }
            }
        )
    }

    @SuppressLint("SetJavaScriptEnabled")
    @Composable
    fun MathWebView() {

        webView = remember {
            WebView(this).apply {

                // Enable JavaScript
                settings.javaScriptEnabled = true

                // Enable local/session storage
                settings.domStorageEnabled = true

                // Allow normal web navigation inside the app
                webViewClient = WebViewClient()

                // Your deployed mathematics website
                loadUrl("https://mathematics-for-mankind.vercel.app/")
            }
        }

        AndroidView(
            factory = {
                webView
            },
            modifier = Modifier.fillMaxSize()
        )
    }
}