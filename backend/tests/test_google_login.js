
// Native fetch test script

async function testGoogleLogin() {
    try {
        console.log("Testing Google Login Endpoint...");
        // 1. Test with a completely fake token (should fail verification, but let's see if it crashes)
        // This is a valid JWT structure but with fake data
        const fakeToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZW1haWwiOiJqb2huLmRvZUBleGFtcGxlLmNvbSIsImlhdCI6MTUxNjIzOTAyMn0.fake_signature";

        console.log("Sending request with dummy JWT...");
        const response = await fetch('http://localhost:5000/api/auth/google', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ credential: fakeToken })
        });

        console.log("Response Status:", response.status);
        const data = await response.json();
        console.log("Response Data:", data);
    } catch (error) {
        console.log("Error:", error.message);
    }
}

testGoogleLogin();
