const axios = require('axios');
const apiKey = 'BCIYO13pGkmdHgmGGFSqhA';
const senderId = 'SMSHUB';
const mobileNo = '916268455485';
const otp = '1234';
const message = `Welcome to the Nowstay.in powered by SMSINDIAHUB. Your OTP for registration is ${otp}`;

axios.get('https://cloud.smsindiahub.in/api/mt/SendSMS', {
  params: {
    APIKey: apiKey,
    senderid: senderId,
    channel: 2,
    DCS: 0,
    flashsms: 0,
    number: mobileNo,
    text: message,
    route: 1
  }
}).then(res => console.log('Response:', res.data)).catch(err => console.error('Error:', err.message, err.response?.data));
