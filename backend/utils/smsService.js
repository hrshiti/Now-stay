import axios from 'axios';
import PlatformSettings from '../models/PlatformSettings.js';

class SMSService {
  constructor() {
    // SMS India Hub configuration
    this.apiKey = process.env.SMSINDIAHUB_API_KEY || 'YOUR_SMS_INDIA_HUB_API_KEY';
    this.senderId = process.env.SMSINDIAHUB_SENDER_ID || 'NOWSTY';
    this.baseUrl = 'https://cloud.smsindiahub.in/api/mt/SendSMS';

    // PRP SMS configuration
    this.prpApiKey = process.env.PRPSMS_API_KEY;
    this.prpSenderId = process.env.PRPSMS_SENDER_ID || 'VRUHOI';
    this.prpTemplateName = process.env.PRPSMS_OTP_TEMPLATE || 'Vruahahiholiday';
    this.prpBaseUrl = 'https://api.bulksmsadmin.com/BulkSMSapi/keyApiSendSMS/SendSmsTemplateName';
  }

  async getActiveProvider() {
    try {
      const settings = await PlatformSettings.getSettings();
      if (settings && settings.smsProvider) {
        return settings.smsProvider.toUpperCase();
      }
    } catch (err) {
      console.warn('⚠️ [SMSService] Could not fetch PlatformSettings, falling back to process.env.SMS_PROVIDER:', err.message);
    }
    return (process.env.SMS_PROVIDER || 'SMSINDIAHUB').toUpperCase();
  }

  normalizePhoneNumber(phone) {
    const digits = phone.replace(/[^0-9]/g, '');
    // SMS India Hub usually expects a 10-digit number or with 91 prefix.
    if (digits.length === 10) return '91' + digits;
    if (digits.length === 12 && digits.startsWith('91')) return digits;
    return digits.length > 10 ? digits.slice(-10) : digits;
  }

  async sendViaPRPSMS(phone, otp) {
    const apiKey = process.env.PRPSMS_API_KEY || this.prpApiKey;
    const senderId = process.env.PRPSMS_SENDER_ID || this.prpSenderId || 'VRUHOI';
    const templateName = process.env.PRPSMS_OTP_TEMPLATE || this.prpTemplateName || 'Vruahahiholiday';

    if (!apiKey) {
      console.warn('⚠️ [PRPSMS] Missing API Key. SMS NOT SENT.');
      return { success: false, error: 'Missing PRP API Key' };
    }

    const mobileNo = phone.replace(/[^0-9]/g, '');
    let finalMobileNo = mobileNo;
    if (mobileNo.length === 10) finalMobileNo = mobileNo;
    else if (mobileNo.length === 12 && mobileNo.startsWith('91')) finalMobileNo = mobileNo;
    else finalMobileNo = mobileNo.slice(-10);

    const payload = {
      sender: senderId,
      templateName: templateName,
      smsReciever: [
        {
          mobileNo: finalMobileNo,
          templateParams: String(otp)
        }
      ]
    };

    console.log(`📨 [PRPSMS] Starting SMS request to ${finalMobileNo}...`);
    const startTime = Date.now();

    try {
      const response = await axios.post(this.prpBaseUrl, payload, {
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      const duration = Date.now() - startTime;
      console.log(`📨 [PRPSMS] Response received in ${duration}ms. Status: ${response.status}`);
      console.log(`📨 [PRPSMS] Response Data:`, response.data);

      if (response.data?.isSuccess === true || response.data?.status === 'success') {
        console.log('✅ OTP Sent Successfully via PRPSMS');
        return { success: true, data: response.data };
      }

      console.log('⚠️ [PRPSMS] Provider returned success status but failed payload:', response.data);
      return { success: false, error: response.data?.returnMessage || 'PRPSMS failure', detail: response.data };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [PRPSMS] Service Error after ${duration}ms!`, error.message);
      return { success: false, error: error.message };
    }
  }

  async sendViaSMSIndiaHub(phone, otp) {
    const apiKey = process.env.SMSINDIAHUB_API_KEY || this.apiKey;
    const senderId = process.env.SMSINDIAHUB_SENDER_ID || this.senderId;
    const mobileNo = this.normalizePhoneNumber(phone);

    const message = `Welcome to the Nowstay.in powered by SMSINDIAHUB. Your OTP for registration is ${otp}`;

    console.log(`📨 [SMSIndiaHub] Starting SMS request to ${mobileNo}...`);
    const startTime = Date.now();

    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          APIKey: apiKey,
          senderid: senderId,
          channel: 2,
          DCS: 0,
          flashsms: 0,
          number: mobileNo,
          text: message,
          route: 1
        },
        timeout: 10000
      });

      const duration = Date.now() - startTime;
      console.log(`📨 [SMSIndiaHub] Response received in ${duration}ms. Status: ${response.status}`);
      console.log(`📨 [SMSIndiaHub] Response Data:`, response.data);

      if (response.status === 200 && response.data) {
        const data = response.data;
        if (data.ErrorCode === '000' || (typeof data === 'string' && data.toLowerCase().includes('jobid'))) {
          console.log('✅ OTP Sent Successfully via SMSIndiaHub');
          return { success: true, data: response.data };
        } else {
          console.log('⚠️ [SMSIndiaHub] Provider returned but might have failed:', response.data);
          return { success: false, error: data.ErrorMessage || 'SMSIndiaHub failure', detail: response.data };
        }
      }

      return { success: false, error: 'SMSIndiaHub request failed', detail: response.data };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [SMSIndiaHub] Service Error after ${duration}ms!`, error.message);
      return { success: false, error: error.message };
    }
  }

  async sendOTP(phone, otp) {
    try {
      const activeProvider = await this.getActiveProvider();
      console.log(`📱 [SMSService] Using active SMS Provider: [${activeProvider}]`);

      if (activeProvider === 'PRP') {
        return await this.sendViaPRPSMS(phone, otp);
      } else {
        return await this.sendViaSMSIndiaHub(phone, otp);
      }
    } catch (outerError) {
      console.error(`❌ [SMSService] Outer Service Error: ${outerError.message}`);
      return { success: false, error: outerError.message };
    }
  }

  async sendSMS(phone, message) {
    return this.sendOTP(phone, message);
  }
}

export default new SMSService();
