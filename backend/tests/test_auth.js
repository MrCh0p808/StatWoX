// test_auth.js
// Run this script to test Registration and Login against your local backend.
// Usage: node test_auth.js

const API_URL = "http://localhost:5000/api/auth";

async function testAuth() {
    const timestamp = Date.now();
    const testUser = {
        username: `user_${timestamp}`,
        email: `user_${timestamp}@example.com`,
        password: "password123"
    };

    console.log("🔵 1. Testing Registration...");
    console.log(`   Sending: ${testUser.email}`);

    try {
        const regRes = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(testUser)
        });

        const regData = await regRes.json();

        if (regRes.status === 201) {
            console.log("   ✅ Registration SUCCESS");
            console.log("   Response:", regData);
        } else {
            console.error("   ❌ Registration FAILED");
            console.error("   Status:", regRes.status);
            console.error("   Response:", regData);
            return; // Stop if registration fails
        }

        console.log("\n🔵 2. Testing Login...");
        const loginRes = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: testUser.email,
                password: testUser.password
            })
        });

        const loginData = await loginRes.json();

        if (loginRes.status === 200 && loginData.token) {
            console.log("   ✅ Login SUCCESS");
            console.log("   Token received:", loginData.token.substring(0, 20) + "...");
        } else {
            console.error("   ❌ Login FAILED");
            console.error("   Status:", loginRes.status);
            console.error("   Response:", loginData);
        }

    } catch (err) {
        console.error("\n❌ NETWORK ERROR");
        console.error("Could not connect to http://localhost:5000");
        console.error("Is the backend server running?");
        console.error("Error details:", err.message);
    }
}

testAuth();
