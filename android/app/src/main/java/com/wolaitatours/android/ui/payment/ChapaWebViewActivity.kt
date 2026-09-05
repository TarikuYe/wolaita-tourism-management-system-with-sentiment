package com.wolaitatours.android.ui.payment

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.viewinterop.AndroidView
import com.wolaitatours.android.ui.theme.WolaitaTheme

class ChapaWebViewActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val checkout = intent?.getStringExtra(EXTRA_CHECKOUT_URL)
        setContent {
            WolaitaTheme {
                if (checkout != null) {
                    WebViewScreen(checkout)
                } else {
                    Text("Missing checkout URL")
                }
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    @Composable
    private fun WebViewScreen(url: String) {
        AndroidView(factory = { context ->
            WebView(context).apply {
                settings.javaScriptEnabled = true
                webViewClient = object : WebViewClient() {
                    override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                        // Handle deep link redirects
                        if (url != null && url.startsWith("wolaita://")) {
                            val intent = android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(url))
                            startActivity(intent)
                            finish()
                            return true
                        }
                        return false
                    }

                    override fun onPageFinished(view: WebView?, url: String?) {
                        super.onPageFinished(view, url)
                        // Check if payment was successful
                        if (url != null && (url.contains("success", true) || url.contains("paid", true))) {
                            // Try to extract bookingId from URL if available
                            val uri = android.net.Uri.parse(url)
                            val bookingId = uri.getQueryParameter("bookingId")
                            
                            // If we have a bookingId, trigger the deep link
                            if (!bookingId.isNullOrBlank()) {
                                val deepLinkIntent = android.content.Intent(android.content.Intent.ACTION_VIEW, 
                                    android.net.Uri.parse("wolaita://tours?status=paid&bookingId=$bookingId"))
                                startActivity(deepLinkIntent)
                            } else {
                                // Fallback: just finish and let the app handle it
                                setResult(RESULT_OK)
                            }
                            finish()
                        }
                    }
                }
                webChromeClient = WebChromeClient()
                loadUrl(url)
            }
        })
    }

    companion object {
        const val EXTRA_CHECKOUT_URL = "checkout"
    }
}

