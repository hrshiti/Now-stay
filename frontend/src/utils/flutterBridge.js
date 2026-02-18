/**
 * Flutter WebView Bridge - Camera Handler
 * Detects if running in Flutter app and provides camera access
 */

// Check if running in Flutter InAppWebView
export const isFlutterApp = () => {
  return window.flutter_inappwebview !== undefined ||
    window.flutter !== undefined ||
    navigator.userAgent.includes('FlutterWebView');
};

/**
 * Open Flutter native camera and get base64 image
 * @returns {Promise<Object>} {success, base64, mimeType, fileName}
 */
export const openFlutterCamera = async () => {
  return new Promise((resolve, reject) => {
    try {
      // Check if Flutter bridge exists
      if (!window.flutter_inappwebview) {
        reject(new Error('Flutter bridge not available'));
        return;
      }

      // Call Flutter camera handler
      window.flutter_inappwebview
        .callHandler('openCamera')
        .then((result) => {
          console.log('[Flutter Camera] Result:', result);
          if (result && result.success) {
            resolve({
              success: true,
              base64: result.base64,
              mimeType: result.mimeType || 'image/jpeg',
              fileName: result.fileName || `image-${Date.now()}.jpg`
            });
          } else {
            reject(new Error('Camera capture failed'));
          }
        })
        .catch((error) => {
          console.error('[Flutter Camera] Error:', error);
          reject(error);
        });
    } catch (error) {
      console.error('[Flutter Camera] Exception:', error);
      reject(error);
    }
  });
};

/**
 * Upload base64 image to backend
 * @param {string} base64 - Base64 string
 * @param {string} mimeType - MIME type
 * @param {string} fileName - File name
 * @returns {Promise<Object>} Upload result
 */
export const uploadBase64Image = async (base64, mimeType = 'image/jpeg', fileName = 'image.jpg') => {
  try {
    const response = await fetch('/api/auth/partner/upload-docs-base64', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        images: [
          {
            base64,
            mimeType,
            fileName
          }
        ]
      })
    });

    if (!response.ok) {
      const text = await response.text();
      try {
        const error = JSON.parse(text);
        throw new Error(error.message || 'Upload failed');
      } catch (e) {
        throw new Error(`Upload failed (${response.status}): ${text.substring(0, 50)}...`);
      }
    }

    return await response.json();
  } catch (error) {
    console.error('[Upload Base64] Error:', error);
    throw error;
  }
};

/**
 * Universal image picker - uses Flutter camera in app, file input in browser
 * @param {Function} onSuccess - Success callback (url, publicId)
 * @param {Function} onError - Error callback
 */
export const pickImage = async (onSuccess, onError) => {
  try {
    if (isFlutterApp()) {
      console.log('[Image Picker] Using Flutter camera...');

      // Use Flutter camera
      const result = await openFlutterCamera();

      if (result.success) {
        console.log('[Image Picker] Uploading to backend...');

        // Upload base64 to backend
        const uploadResult = await uploadBase64Image(
          result.base64,
          result.mimeType,
          result.fileName
        );

        if (uploadResult.success && uploadResult.files && uploadResult.files.length > 0) {
          const file = uploadResult.files[0];
          onSuccess && onSuccess(file.url, file.publicId);
        } else {
          throw new Error('Upload failed');
        }
      }
    } else {
      console.log('[Image Picker] Using web file input...');
      // Fallback to regular file input (already handled by existing code)
      onError && onError(new Error('Please use file input in browser'));
    }
  } catch (error) {
    console.error('[Image Picker] Error:', error);
    onError && onError(error);
  }
};

export default {
  isFlutterApp,
  openFlutterCamera,
  uploadBase64Image,
  pickImage
};
