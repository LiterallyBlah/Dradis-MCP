import { config } from 'dotenv';

config();

async function testConnection() {
  const url = process.env.DRADIS_URL;
  const token = process.env.DRADIS_API_TOKEN;
  
  try {
    const response = await fetch(`${url}/api/`, {
      headers: {
        'Authorization': `Token token=${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    
    const text = await response.text();
    console.log('Response:', text);
  } catch (error) {
    console.error('Error:', error);
  }
}

testConnection();
