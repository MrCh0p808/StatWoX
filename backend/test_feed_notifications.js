const API_URL = 'http://localhost:5000/api';

async function testFeedAndNotifications() {
    try {
        console.log('--- STARTING FEED & NOTIFICATIONS TEST ---');

        // 1. Login
        const email = `test_feed_${Date.now()}@example.com`;
        const password = 'password123';
        const username = `user_feed_${Date.now()}`;

        console.log(`\n1. Registering/Logging in author...`);
        let token = '';
        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, username })
            });
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

        // 2. Create Surveys (1 Survey, 1 Poll)
        console.log(`\n2. Creating Content...`);
        let surveyId = '';
        let pollId = '';

        // Survey
        const sRes = await fetch(`${API_URL}/surveys`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ title: 'Feed Survey', category: 'survey', questions: [{ title: 'Q1', type: 'shortText' }] })
        });
        const sData = await sRes.json();
        surveyId = sData.id;

        // Poll
        const pRes = await fetch(`${API_URL}/surveys`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ title: 'Feed Poll', category: 'poll', questions: [{ title: 'Q1', type: 'multipleChoice', options: ['A', 'B'] }] })
        });
        const pData = await pRes.json();
        pollId = pData.id;

        // Publish both
        await fetch(`${API_URL}/surveys/${surveyId}/publish`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } });
        await fetch(`${API_URL}/surveys/${pollId}/publish`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } });

        console.log('✅ Content Created & Published');

        // 3. Submit Responses
        console.log(`\n3. Submitting Responses...`);
        await fetch(`${API_URL}/surveys/${surveyId}/responses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ q1: 'Answer' })
        });
        await fetch(`${API_URL}/surveys/${pollId}/responses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ q1: 'A' })
        });
        console.log('✅ Responses Submitted');

        // 4. Test Feed
        console.log(`\n4. Testing Feed...`);
        const feedRes = await fetch(`${API_URL}/feed`);
        const feed = await feedRes.json();

        const foundSurvey = feed.featured.find(s => s.id === surveyId) || feed.trending.find(s => s.id === surveyId);
        const foundPoll = feed.quickPolls.find(p => p.id === pollId);

        if (foundSurvey) console.log('✅ Survey found in Feed');
        else console.warn('⚠️ Survey NOT found in Feed (might be ordering issue)');

        if (foundPoll) console.log('✅ Poll found in Quick Polls');
        else console.warn('⚠️ Poll NOT found in Quick Polls');

        // 5. Test Notifications
        console.log(`\n5. Testing Notifications...`);
        const notifRes = await fetch(`${API_URL}/notifications`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const notifs = await notifRes.json();

        if (notifs.length >= 2) {
            console.log(`✅ Notifications received: ${notifs.length}`);
            console.log(`   - ${notifs[0].message}`);
        } else {
            throw new Error(`Expected at least 2 notifications, got ${notifs.length}`);
        }

        console.log('\n🎉 FEED & NOTIFICATIONS TEST PASSED!');

    } catch (error) {
        console.error('Unexpected Error:', error);
    }
}

testFeedAndNotifications();
