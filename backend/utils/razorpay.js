import Razorpay from 'razorpay';
import PaymentConfig from '../config/payment.config.js';

let razorpayInstance = null;
let currentKeyId = null;

/**
 * Get a Razorpay instance initialized with current environment credentials.
 * Re-initializes if credentials have changed.
 */
export const getRazorpayInstance = () => {
  const keyId = PaymentConfig.razorpayKeyId;
  const keySecret = PaymentConfig.razorpayKeySecret;

  if (!razorpayInstance || currentKeyId !== keyId) {
    if (keyId && keySecret) {
      console.log(`[Razorpay] Initializing backend instance with Key ID: ${keyId}`);
      razorpayInstance = new Razorpay({
        key_id: keyId,
        key_secret: keySecret
      });
      currentKeyId = keyId;
    } else {
      console.warn("⚠️ Razorpay Keys missing in environment. Returning mock instance.");
      return {
        orders: {
          create: () => Promise.reject(new Error("Razorpay Not Initialized")),
          fetch: () => Promise.reject(new Error("Razorpay Not Initialized"))
        },
        payments: {
          fetch: () => Promise.reject(new Error("Razorpay Not Initialized")),
          refund: () => Promise.reject(new Error("Razorpay Not Initialized"))
        },
        payouts: {
          create: () => Promise.reject(new Error("Razorpay Not Initialized"))
        }
      };
    }
  }
  return razorpayInstance;
};

export default getRazorpayInstance;
