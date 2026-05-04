/**
 * Razorpay Payment Integration Utility
 * Handles Razorpay payment initialization and verification
 */

let razorpayLoaded = false;

/**
 * Detect if the app is running in a WebView
 */
const isProbablyWebView = () => {
  try {
    const ua = String(navigator?.userAgent || "");
    // Common WebView indicators:
    // - Android WebView: "; wv" or "Version/x.x" without Chrome brand
    // - iOS WebView: AppleWebKit but missing Safari
    const isAndroid = /Android/i.test(ua);
    const hasWv = /\bwv\b/i.test(ua);
    const hasVersion = /Version\/\d+/i.test(ua);
    const hasSafari = /Safari/i.test(ua);
    const isIOSWebView = /iPhone|iPad|iPod/i.test(ua) && !hasSafari;
    return (isAndroid && (hasWv || hasVersion)) || isIOSWebView;
  } catch {
    return false;
  }
};

/**
 * Load Razorpay checkout script
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve, reject) => {
    if (razorpayLoaded) {
      resolve();
      return;
    }

    if (window.Razorpay) {
      razorpayLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      razorpayLoaded = true;
      resolve();
    };
    script.onerror = () => {
      reject(new Error('Failed to load Razorpay script'));
    };
    document.body.appendChild(script);
  });
};

/**
 * Initialize Razorpay payment
 * @param {Object} options - Payment options
 */
export const initRazorpayPayment = async (options) => {
  try {
    // Load Razorpay script if not already loaded
    await loadRazorpayScript();

    if (!window.Razorpay) {
      throw new Error('Razorpay SDK not available');
    }

    // Prepare Razorpay options with explicit UPI enablement and deep-linking support
    const razorpayOptions = {
      key: options.key,
      amount: options.amount,
      currency: options.currency || 'INR',
      order_id: options.order_id,
      name: options.name || 'NowStay',
      description: options.description || 'Booking Payment',
      image: options.image || '/logo.png',
      
      // 1. Explicitly enable UPI and other methods to fix visibility in WebViews
      method: options.method || {
        upi: true,
        card: true,
        netbanking: true,
        wallet: true,
        emi: true,
        paylater: true,
      },

      // 2. Allow redirect/deep-link for UPI intent apps (GPay/PhonePe/etc.)
      redirect: options.redirect ?? true,

      // 3. Razorpay requirement for enabling UPI Intent inside Android WebView checkout
      webview_intent: options.webview_intent ?? isProbablyWebView(),

      prefill: {
        name: options.prefill?.name || '',
        email: options.prefill?.email || '',
        contact: options.prefill?.contact || ''
      },

      notes: options.notes || {},

      theme: {
        color: options.theme?.color || '#0F172A'
      },

      handler: function(response) {
        if (options.handler) {
          options.handler(response);
        }
      },

      modal: {
        ondismiss: function() {
          if (options.onClose) {
            options.onClose();
          }
        },
        escape: true,
        animation: true
      },

      // 4. Custom config display to ensure UPI apps list appears (matching App A working config)
      config: options.config || {
        display: {
          blocks: {
            upi: {
              name: "UPI / Apps",
              instruments: [
                {
                  method: "upi"
                }
              ]
            }
          },
          sequence: ["block.upi", "block.card", "block.netbanking", "block.wallet"],
          preferences: {
            show_default_blocks: true
          }
        }
      },

      retry: {
        enabled: true,
        max_count: 3
      }
    };

    const razorpay = new window.Razorpay(razorpayOptions);
    
    // Handle payment failures
    razorpay.on('payment.failed', function(response) {
      console.error('Razorpay payment failed:', response);
      if (options.onError) {
        options.onError(response.error || { description: 'Payment failed. Please try again.' });
      }
    });

    // Open Razorpay modal
    razorpay.open();
    
    console.log('✅ Razorpay checkout opened successfully');
    return razorpay;
  } catch (error) {
    console.error('Error initializing Razorpay:', error);
    if (options.onError) {
      options.onError(error);
    }
    throw error;
  }
};

/**
 * Format amount for display
 * @param {Number} amount - Amount in paise
 * @returns {String} Formatted amount string
 */
export const formatAmount = (amount) => {
  return `₹${(amount / 100).toFixed(2)}`;
};
