import axios from 'axios';

class PRPSMSService {
  constructor() {
    this.apiKey = process.env.PRPSMS_API_KEY;
    this.senderId = process.env.PRPSMS_SENDER_ID || 'VRUSOY';
    this.templateName = process.env.PRPSMS_OTP_TEMPLATE || 'Temp 4';
    this.baseUrl = 'https://api.bulksmsadmin.com/BulkSMSapi/keyApiSendSMS/SendSmsTemplateName';
  }

  normalizePhoneNumber(phone) {
    // Remove non-digits
    const digits = phone.replace(/[^0-9]/g, '');
    // For PRPSMS, assume it wants 10 digits or digits with 91 but no special characters
    // Most Indian gateways expect 10 digits or 12 digits (with 91)
    if (digits.length === 10) return digits;
    if (digits.length === 12 && digits.startsWith('91')) return digits;
    return digits.slice(-10); // Default to last 10 digits
  }

  async sendOTP(phone, otp) {
    try {
      const apiKey = this.apiKey || process.env.PRPSMS_API_KEY;
      const senderId = this.senderId || process.env.PRPSMS_SENDER_ID || 'VRUSOY';
      const templateName = this.templateName || process.env.PRPSMS_OTP_TEMPLATE || 'Temp 4';

      if (!apiKey) {
        console.warn('⚠️ [PRPSMS] Missing API Key. SMS NOT SENT.');
        return { success: false, error: 'Missing API Key' };
      }

      const mobileNo = this.normalizePhoneNumber(phone);

      const payload = {
        sender: senderId,
        templateName: templateName,
        smsReciever: [
          {
            mobileNo: mobileNo,
            templateParams: String(otp)
          }
        ]
      };

      console.log(`📨 [PRPSMS] Starting SMS request to ${mobileNo}...`);
      console.log(`📨 [PRPSMS] Base URL: ${this.baseUrl}`);
      console.log(`📨 [PRPSMS] Payload:`, JSON.stringify(payload));
      
      const startTime = Date.now();
      
      try {
        const response = await axios.post(this.baseUrl, payload, {
          headers: {
            'apikey': apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 seconds strict timeout
        });
        
        const duration = Date.now() - startTime;
        console.log(`📨 [PRPSMS] Response received in ${duration}ms. Status: ${response.status}`);
        console.log(`📨 [PRPSMS] Response Data:`, JSON.stringify(response.data));

        // PRPSMS always responds with HTTP 200, even on failure — the real result is in the body
        if (response.data?.isSuccess === true || response.data?.status === 'success') {
          console.log('✅ OTP Sent Successfully via PRPSMS');
          return { success: true, data: response.data };
        }

        console.log('⚠️ [PRPSMS] Provider returned success status but failed payload:', response.data);
        return { success: false, error: response.data?.returnMessage || 'PRPSMS failure', detail: response.data };

      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`❌ [PRPSMS] Service Error after ${duration}ms!`);
        console.error(`❌ [PRPSMS] Error Message: ${error.message}`);
        
        if (error.response) {
          console.error(`❌ [PRPSMS] Error Response Data:`, error.response.data);
        } else if (error.request) {
          console.error(`❌ [PRPSMS] No response received from server. Request hung or timed out.`);
        }
        
        return { success: false, error: error.message };
      }
    } catch (outerError) {
      console.error(`❌ [PRPSMS] Outer Service Error: ${outerError.message}`);
      return { success: false, error: outerError.message };
    }
  }

  // Generic SMS fallback (PRPSMS uses templates for everything usually)
  async sendSMS(phone, message) {
     console.warn('⚠️ [PRPSMS] sendSMS called, but PRPSMS is template-based. Using default OTP template.');
     return this.sendOTP(phone, message);
  }
}

export default new PRPSMSService();
