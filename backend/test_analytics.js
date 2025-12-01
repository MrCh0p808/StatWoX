const API_URL = 'http://localhost:5000/api';

async function testAnalytics() {
    try {
        console.log('--- STARTING ANALYTICS TEST ---');

        // 1. Login
        const email = `test_analytics_${Date.now()}@example.com`;
        const password = 'password123';
        const username = `user_analytics_${Date.now()}`;

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
                    title: 'Analytics Test Survey',
                    questions: [
                        { id: 'q1', title: 'Favorite Color?', type: 'multipleChoice', options: ['Red', 'Blue'] },
                        { id: 'q2', title: 'Rating?', type: 'rating' }
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

        // 3. Submit Responses (3 responses)
        console.log(`\n3. Submitting 3 Responses...`);
        const responses = [
            { q1: 'Red', q2: 5 },
            { q1: 'Blue', q2: 4 },
            { q1: 'Red', q2: 3 }
        ];

        for (const resp of responses) {
            await fetch(`${API_URL}/surveys/${surveyId}/responses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(resp)
            });
        }
        console.log('✅ Responses Submitted');

        // 4. Get Analytics
        console.log(`\n4. Fetching Analytics...`);
        try {
            const res = await fetch(`${API_URL}/surveys/${surveyId}/analytics`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(JSON.stringify(data));

            // Verify Total
            if (data.totalResponses !== 3) throw new Error(`Expected 3 responses, got ${data.totalResponses}`);

            // Verify Q1 (Red=2, Blue=1)
            const q1 = data.questions.find(q => q.title === 'Favorite Color?');
            const red = q1.stats.find(s => s.label === 'Red');
            const blue = q1.stats.find(s => s.label === 'Blue');

            if (red.count !== 2) throw new Error(`Expected 2 Red, got ${red.count}`);
            if (blue.count !== 1) throw new Error(`Expected 1 Blue, got ${blue.count}`);

            console.log('✅ Analytics Verified Successfully!');
        } catch (e) {
            console.error('❌ Analytics Verification Failed:', e.message);
            process.exit(1);
        }

        console.log('\n🎉 ANALYTICS TEST PASSED!');

    } catch (error) {
        console.error('Unexpected Error:', error);
    }
}

testAnalytics();
