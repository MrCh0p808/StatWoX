
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testAuth() {
    try {
        console.log('--- STARTING AUTH TEST ---');

        // 1. Register
        const email = `test_${Date.now()}@example.com`;
        const password = 'password123';
        const username = `user_${Date.now()}`;

        console.log(`\n1. Registering user: ${email}`);
        try {
            await axios.post(`${API_URL}/auth/register`, {
                email,
                password,
                username
            });
            console.log('✅ Registration Successful');
        } catch (e) {
            console.error('❌ Registration Failed:', e.response?.data || e.message);
            // If email exists, we can try logging in
            if (e.response?.data?.message === 'Email exists') {
                console.log('User exists, proceeding to login...');
            } else {
                process.exit(1);
            }
        }

        // 2. Login
        console.log(`\n2. Logging in...`);
        let token = '';
        try {
            const res = await axios.post(`${API_URL}/auth/login`, {
                email,
                password
            });
            token = res.data.token;
            console.log('✅ Login Successful. Token received.');
        } catch (e) {
            console.error('❌ Login Failed:', e.response?.data || e.message);
            process.exit(1);
        }

        // 3. Create Survey (Protected Route)
        console.log(`\n3. Creating a Survey (Testing DB Connection)...`);
        try {
            const surveyRes = await axios.post(`${API_URL}/surveys`, {
                title: 'Test Survey',
                questions: []
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Survey Created:', surveyRes.data.id);
            console.log('✅ Auth + DB Integration Verified!');
        } catch (e) {
            console.error('❌ Survey Creation Failed:', e.response?.data || e.message);
            console.error('This means the user ID in the token might not exist in the DB (Foreign Key Error).');
            process.exit(1);
        }

    } catch (error) {
        console.error('Unexpected Error:', error);
    }
}

testAuth();
