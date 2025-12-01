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
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, username })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(JSON.stringify(data));
            console.log('✅ Registration Successful');
        } catch (e) {
            console.error('❌ Registration Failed:', e.message);
            process.exit(1);
        }

        // 2. Login
        console.log(`\n2. Logging in...`);
        let token = '';
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(JSON.stringify(data));
            token = data.token;
            console.log('✅ Login Successful. Token received.');
        } catch (e) {
            console.error('❌ Login Failed:', e.message);
            process.exit(1);
        }

        // 3. Create Survey (Protected Route)
        console.log(`\n3. Creating a Survey (Testing DB Connection)...`);
        try {
            const res = await fetch(`${API_URL}/surveys`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: 'Test Survey',
                    questions: []
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(JSON.stringify(data));
            console.log('✅ Survey Created:', data.id);
            console.log('✅ Auth + DB Integration Verified!');
        } catch (e) {
            console.error('❌ Survey Creation Failed:', e.message);
            console.error('This means the user ID in the token might not exist in the DB (Foreign Key Error).');
            process.exit(1);
        }

    } catch (error) {
        console.error('Unexpected Error:', error);
    }
}

testAuth();
