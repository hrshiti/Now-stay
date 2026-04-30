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
          console.log('[Flutter Picker] Received Result:', result);
          
          if (!result) {
            reject(new Error('Native app returned no data. Please ensure camera permissions are granted.'));
            return;
          }

          // Case 1: Result is already a base64 string (Direct return)
          if (typeof result === 'string') {
             // Basic regex check if it looks like base64 or has data-uri
             if (result.length > 100) {
                resolve({
                  success: true,
                  images: [{ base64: result, mimeType: 'image/jpeg', fileName: 'capture.jpg' }],
                  base64: result,
                  mimeType: 'image/jpeg',
                  fileName: 'capture.jpg'
                });
                return;
             }
          }

          // Case 2: Result is an object with images array (Multiple selection)
          if (result.images && Array.isArray(result.images) && result.images.length > 0) {
             resolve({
                success: true,
                images: result.images,
                base64: result.images[0].base64,
                mimeType: result.images[0].mimeType || 'image/jpeg',
                fileName: result.images[0].fileName || 'capture.jpg'
             });
             return;
          }

          // Case 3: Result is an object with base64 property (Single selection)
          if (result.base64) {
             resolve({
                success: true,
                images: [{ 
                  base64: result.base64, 
                  mimeType: result.mimeType || 'image/jpeg', 
                  fileName: result.fileName || 'capture.jpg' 
                }],
                base64: result.base64,
                mimeType: result.mimeType || 'image/jpeg',
                fileName: result.fileName || 'capture.jpg'
             });
             return;
          }

          // Case 4: Result has success: true but no image yet? (Unexpected but possible)
          if (result && (result.success === true || result === true)) {
             // If it's just 'true', it's useless for info but maybe it's a multi-step process?
             // But usually it should have data. Let's log it.
             console.warn('[Flutter Picker] Success is truthy but no image data found:', result);
          }

          // If we reach here, it failed the checks
          console.error('[Flutter Picker] Invalid or empty result format:', result);
          const customMsg = (typeof result === 'object' && result?.message) ? result.message : 'Image capture failed. Please check camera permissions in your phone settings.';
          reject(new Error(customMsg));
        })
        .catch((error) => {
          console.error('[Flutter Picker] Bridge Call Error:', error);
          reject(new Error('Unable to communicate with the app for camera. Please restart the app.'));
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

/**
 * Trigger Native Share Sheet
 */
export const shareViaFlutter = async (shareData) => {
  return new Promise((resolve, reject) => {
    try {
      if (!window.flutter_inappwebview) {
        reject(new Error('Flutter bridge not available.'));
        return;
      }
      
      window.flutter_inappwebview.callHandler('nativeShare', shareData)
        .then((result) => resolve(result))
        .catch((error) => reject(error));
    } catch (e) {
      reject(e);
    }
  });
};

/**
 * Get Location from Flutter Native
 */
export const getFlutterLocation = async () => {
  return new Promise((resolve, reject) => {
    try {
      if (!window.flutter_inappwebview) {
        reject(new Error('Flutter bridge not available.'));
        return;
      }
      
      window.flutter_inappwebview.callHandler('getLocation')
        .then((result) => {
          if (result && result.success) {
            resolve(result);
          } else {
            reject(new Error(result?.message || 'Failed to get location from app'));
          }
        })
        .catch((error) => reject(error));
    } catch (e) {
      reject(e);
    }
  });
};

export default {
  isFlutterApp,
  openFlutterCamera,
  uploadBase64Image,
  pickImage,
  shareViaFlutter,
  getFlutterLocation
};
