const LOCAL_API_URL = 'http://localhost:5000/api';
const PROD_API_URL = 'https://api.nowstay.in/api';

const isLocalHostname = () => {
  if (typeof window === 'undefined') return false;
  return ['localhost', '127.0.0.1'].includes(window.location.hostname);
};

export const resolveApiUrl = () => {
  const envApiUrl = import.meta.env.VITE_API_URL?.trim();
  const resolvedApiUrl = envApiUrl || (isLocalHostname() ? LOCAL_API_URL : PROD_API_URL);

  if (typeof window !== 'undefined' && !window.__NOWSTAY_API_URL_LOGGED__) {
    window.__NOWSTAY_API_URL_LOGGED__ = true;
    console.log('[API] Resolved base URL:', resolvedApiUrl, {
      envApiUrl: envApiUrl || null,
      hostname: window.location.hostname,
      origin: window.location.origin
    });

    if (!envApiUrl && !isLocalHostname()) {
      console.warn('[API] VITE_API_URL is not set. Falling back to production API URL for this device.');
    }
  }

  return resolvedApiUrl;
};

export const resolveApiBase = () => resolveApiUrl().replace(/\/api\/?$/, '');
