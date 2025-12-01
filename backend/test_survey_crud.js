const API_URL = 'http://localhost:5000/api';

async function testCRUD() {
    try {
        console.log('--- STARTING SURVEY CRUD TEST ---');

        // 1. Login
        const email = `test_crud_${Date.now()}@example.com`;
        const password = 'password123';
        const username = `user_crud_${Date.now()}`;

        console.log(`\n1. Registering/Logging in user: ${email}`);
        let token = '';

        // Register
        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, username })
            });
            if (!res.ok) {
                // If already exists, try login
                console.log('User might exist, trying login...');
            }
        } catch (e) { }

        // Login
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
                    title: 'My First Survey',
                    description: 'Testing CRUD',
                    category: 'survey',
                    questions: [
                        { title: 'Q1', type: 'shortText', required: true },
                        { title: 'Q2', type: 'multipleChoice', options: ['A', 'B'] }
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

        // 3. Get Survey
        console.log(`\n3. Getting Survey...`);
        try {
            const res = await fetch(`${API_URL}/surveys/${surveyId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(JSON.stringify(data));
            if (data.title !== 'My First Survey') throw new Error('Title mismatch');
            if (data.questions.length !== 2) throw new Error('Question count mismatch');
            console.log('✅ Get Survey Successful');
        } catch (e) {
            console.error('❌ Get Failed:', e.message);
            process.exit(1);
        }

        // 4. Update Survey
        console.log(`\n4. Updating Survey...`);
        try {
            const res = await fetch(`${API_URL}/surveys/${surveyId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: 'Updated Title',
                    description: 'Updated Desc',
                    questions: [
                        { title: 'Q1 Updated', type: 'shortText' }
                    ]
                })
            });
            if (!res.ok) throw new Error(await res.text());
            console.log('✅ Update Survey Successful');
        } catch (e) {
            console.error('❌ Update Failed:', e.message);
            process.exit(1);
        }

        // 5. Verify Update
        console.log(`\n5. Verifying Update...`);
        try {
            const res = await fetch(`${API_URL}/surveys/${surveyId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.title !== 'Updated Title') throw new Error('Title not updated');
            if (data.questions.length !== 1) throw new Error('Questions not updated');
            console.log('✅ Verify Update Successful');
        } catch (e) {
            console.error('❌ Verify Update Failed:', e.message);
            process.exit(1);
        }

        // 6. Delete Survey
        console.log(`\n6. Deleting Survey...`);
        try {
            const res = await fetch(`${API_URL}/surveys/${surveyId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(await res.text());
            console.log('✅ Delete Survey Successful');
        } catch (e) {
            console.error('❌ Delete Failed:', e.message);
            process.exit(1);
        }

        // 7. Verify Delete
        console.log(`\n7. Verifying Delete...`);
        try {
            const res = await fetch(`${API_URL}/surveys/${surveyId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 404) {
                console.log('✅ Verify Delete Successful (404 returned)');
            } else {
                throw new Error('Survey still exists');
            }
        } catch (e) {
            console.error('❌ Verify Delete Failed:', e.message);
            process.exit(1);
        }

        console.log('\n🎉 ALL CRUD TESTS PASSED!');

    } catch (error) {
        console.error('Unexpected Error:', error);
    }
}

testCRUD();
