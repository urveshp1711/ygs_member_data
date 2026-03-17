const axios = require('axios');

async function checkApi() {
    try {
        const res = await axios.get('http://localhost:3000/api/total-donation');
        console.log('Summary Data:', JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkApi();
