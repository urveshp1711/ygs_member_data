const axios = require('axios');

async function checkApi() {
    try {
        const res = await axios.get('http://localhost:3000/api/MemberData/donationData?year=2026');
        console.log('Donation Data:', JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkApi();
