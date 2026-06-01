const axios = require('axios');
async function run() {
  try {
    const resLogin = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'bacsi_an@hospital.vn',
      password: 'doctor123'
    });
    const token = resLogin.data.data.accessToken;
    
    const resPatients = await axios.get('http://localhost:5000/api/patients', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Success:', resPatients.data);
  } catch (e) {
    if (e.response) {
      console.error('API Error:', e.response.status, JSON.stringify(e.response.data));
    } else {
      console.error('Error:', e);
    }
  }
}
run();
