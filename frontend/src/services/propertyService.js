import { api, handleResponse, handleError } from './apiService';
import { isFlutterApp } from '../utils/flutterBridge';

export const propertyService = {
  getPublicProperties: async (params) => {
    try {
      const response = await api.get('/properties', { params });
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getPropertyDetails: async (id) => {
    try {
      const response = await api.get(`/properties/${id}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Categories
  getCategories: async () => {
    try {
      const response = await api.get('/categories');
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Helper to get location
  getCurrentLocation: () => {
    return new Promise(async (resolve, reject) => {
      // 1. Try Flutter Native Bridge first (if inside App)
      if (isFlutterApp() && window.flutter_inappwebview) {
        try {
          const result = await window.flutter_inappwebview.callHandler('getLocation');
          if (result && result.lat && result.lng) {
            return resolve({
              lat: parseFloat(result.lat),
              lng: parseFloat(result.lng)
            });
          }
        } catch (err) {
          console.warn('[Flutter Location] Bridge failed or not implemented, falling back to browser API.', err);
        }
      }

      // 2. Browser standard Geolocation API
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          (error) => {
            console.error("Geolocation Error:", error);
            // Check if testing locally on non-secure context (HTTP over IP)
            if (error.code === 1 && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
                reject(new Error("Location blocked. If testing on phone, use HTTPS or localhost."));
            } else {
                reject(error);
            }
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
      }
    });
  }
};
