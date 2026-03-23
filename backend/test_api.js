
import axios from 'axios';

async function testApi() {
  const url = "http://localhost:5000/api/availability/check?propertyId=697ccad640037001c1eb2e58&roomTypeId=697ccad940037001c1eb2e74&checkIn=2026-03-26&checkOut=2026-03-27&rooms=1";
  
  try {
    console.log(`Calling API: ${url}`);
    const response = await axios.get(url);
    console.log("Status Code:", response.status);
    console.log("Response Data:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.log("API Error Status:", error.response.status);
      console.log("API Error Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.log("Request Error:", error.message);
    }
  }
}

testApi();
