import { api } from '../services/apiService';

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
 * Open Flutter native picker (Camera/Gallery) and get base64 image(s)
 * Handles both single capture and multiple selection
 * @returns {Promise<Object>} {success, images: [{base64, mimeType, fileName}], ...}
 */
export const openFlutterCamera = async () => {
  return new Promise((resolve, reject) => {
    try {
      if (!window.flutter_inappwebview) {
        reject(new Error('Flutter bridge not available. Please ensure you are opening this in the official app.'));
        return;
      }

      window.flutter_inappwebview
        .callHandler('openCamera')
        .then((result) => {
          console.log('[Flutter Picker] Result:', result);
          if (result && result.success) {
            // Support both single result and multiple results from Flutter
            const images = result.images || [
              {
                base64: result.base64,
                mimeType: result.mimeType || 'image/jpeg',
                fileName: result.fileName || `image-${Date.now()}.jpg`
              }
            ];

            resolve({
              success: true,
              images: images,
              // Keep legacy single field for backward compatibility
              base64: images[0].base64,
              mimeType: images[0].mimeType,
              fileName: images[0].fileName
            });
          } else {
            console.warn('[Flutter Picker] Failed result:', result);
            reject(new Error(result?.message || 'Image capture failed or cancelled'));
          }
        })
        .catch((error) => {
          console.error('[Flutter Picker] Bridge Error:', error);
          reject(error);
        });
    } catch (error) {
      console.error('[Flutter Picker] Exception:', error);
      reject(error);
    }
  });
};

/**
 * Upload base64 image(s) to backend using Axios (api instance)
 */
export const uploadBase64Image = async (dataOrBase64, mimeType = 'image/jpeg', fileName = 'image.jpg') => {
  try {
    let images = [];

    // Polymorphic handling: Check if we got an array of objects or single arguments
    if (Array.isArray(dataOrBase64)) {
      images = dataOrBase64;
    } else {
      images = [{
        base64: dataOrBase64,
        mimeType,
        fileName
      }];
    }

    // Use the central Axios instance from apiService for consistency (URL, Headers, Interceptors)
    const response = await api.post('/auth/partner/upload-docs-base64', { images });
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || 'Upload failed';
    console.error('[Upload Base64] Error:', errorMsg);
    throw new Error(errorMsg);
  }
};

/**
 * Universal image picker - handles single and multiple images depending on context
 * @param {Function} onSuccess - Success callback (returns first file OR array of all files)
 * @param {Function} onError - Error callback
 */
export const pickImage = async (onSuccess, onError) => {
  try {
    if (isFlutterApp()) {
      console.log('[Image Picker] Using Flutter native bridge...');

      const result = await openFlutterCamera();

      if (result.success && result.images) {
        console.log(`[Image Picker] Uploading ${result.images.length} images...`);

        const uploadResult = await uploadBase64Image(result.images);

        if (uploadResult.success && uploadResult.files && uploadResult.files.length > 0) {
          // Process each file
          uploadResult.files.forEach(file => {
            onSuccess && onSuccess(file.url, file.publicId);
          });
        } else {
          throw new Error('Upload failed');
        }
      }
    } else {
      console.log('[Image Picker] Browser detected. Please use manual file input.');
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
