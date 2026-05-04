import apiService from './apiService';
import { initRazorpayPayment } from '../lib/utils/razorpay';

class PaymentService {
  /**
   * Create Razorpay order for booking payment
   */
  async createOrder(bookingId) {
    const response = await apiService.post('/payments/create-order', { bookingId });
    return response.data;
  }

  /**
   * Verify Razorpay payment
   */
  async verifyPayment(verificationData) {
    const response = await apiService.post('/payments/verify', verificationData);
    return response.data;
  }

  /**
   * Process refund
   */
  async processRefund(bookingId, amount, reason) {
    const response = await apiService.post(`/payments/refund/${bookingId}`, {
      amount,
      reason
    });
    return response.data;
  }

  /**
   * Get payment details
   */
  async getPaymentDetails(paymentId) {
    const response = await apiService.get(`/payments/${paymentId}`);
    return response.data;
  }

  /**
   * Open Razorpay checkout using the centralized utility
   */
  async openCheckout(options) {
    return new Promise((resolve, reject) => {
      initRazorpayPayment({
        ...options,
        handler: (response) => resolve(response),
        onClose: () => reject(new Error('Payment cancelled by user')),
        onError: (error) => reject(error)
      });
    });
  }
}

export default new PaymentService();
