const API_URL = 'http://localhost:5000/api';

async function testResponse() {
    try {
        console.log('--- STARTING RESPONSE TEST ---');

        // 1. Login to Create Survey
        const email = `test_resp_${Date.now()}@example.com`;
        const password = 'password123';
        const username = `user_resp_${Date.now()}`;

        console.log(`\n1. Registering/Logging in author...`);
        let token = '';
        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, username })
            });
            if (!res.ok) console.log('User might exist, trying login...');
        } catch (e) { }

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(JSON.stringify(data));
            token = data.token;
            console.log('✅ Login Successful');
        } catch (e) {
            console.error('❌ Login Failed:', e.message);
            process.exit(1);
        }

        // 2. Create Survey
        console.log(`\n2. Creating Survey...`);
        let surveyId = '';
        try {
            const res = await fetch(`${API_URL}/surveys`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: 'Response Test Survey',
                    questions: [
                        { id: 'q1', title: 'What is your name?', type: 'shortText', required: true }
                    ]
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(JSON.stringify(data));
            surveyId = data.id;
            console.log('✅ Survey Created:', surveyId);
        } catch (e) {
            console.error('❌ Create Failed:', e.message);
            process.exit(1);
        }

        // 3. Submit Response (PUBLIC - NO TOKEN)
        console.log(`\n3. Submitting Response (Public)...`);
        try {
            const res = await fetch(`${API_URL}/surveys/${surveyId}/responses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    q1: 'John Doe'
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(JSON.stringify(data));
            console.log('✅ Response Submitted:', data.message);
        } catch (e) {
            console.error('❌ Submit Failed:', e.message);
            process.exit(1);
        }

        // 4. Verify Response Count (Private)
        console.log(`\n4. Verifying Response Count...`);
        try {
            const res = await fetch(`${API_URL}/surveys`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            const mySurvey = data.find(s => s.id === surveyId);
            if (mySurvey && mySurvey.responses === 1) {
                console.log('✅ Response Count Verified (1)');
            } else {
                throw new Error(`Expected 1 response, got ${mySurvey?.responses}`);
            }
        } catch (e) {
            console.error('❌ Verify Count Failed:', e.message);
            process.exit(1);
        }

        console.log('\n🎉 RESPONSE TEST PASSED!');

    } catch (error) {
        console.error('Unexpected Error:', error);
    }
}

testResponse();
