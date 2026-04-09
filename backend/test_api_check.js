
import mongoose from 'mongoose';
import express from 'express';
import { checkAvailability } from './controllers/availabilityController.js';

// Mock request and response
const req = {
  query: {
    propertyId: '69b51e64c7a6a54b1d7e8a65',
    checkIn: '2026-03-20',
    checkOut: '2026-03-21'
  }
};

const res = {
  json: (data) => {
    console.log('API RESPONSE:');
    console.log(JSON.stringify(data, null, 2));
    process.exit(0);
  },
  status: (code) => ({
    json: (data) => {
      console.log(`API ERROR (${code}):`);
      console.log(JSON.stringify(data, null, 2));
      process.exit(1);
    }
  })
};

const mongoUrl = "mongodb+srv://rukkooin:rukkooin@cluster0.6mzfrnp.mongodb.net/?appName=Cluster0";
mongoose.connect(mongoUrl).then(() => {
  console.log('Connected to DB. Calling controller...');
  checkAvailability(req, res);
});
