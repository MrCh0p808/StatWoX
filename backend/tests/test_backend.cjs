const http = require('http');

function makeRequest(path, method, body) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({ statusCode: res.statusCode, data: data });
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function test() {
    console.log("Testing Backend Connectivity...");

    // 1. Health Check
    try {
        const health = await makeRequest('/', 'GET');
        console.log(`[Health Check] Status: ${health.statusCode}, Response: ${health.data}`);
    } catch (e) {
        console.error(`[Health Check] FAILED: ${e.message}`);
        console.log("Is the backend server running on port 5000?");
        return;
    }

    // 2. Login Test (Expect 401 or 400, but connection success)
    try {
        const login = await makeRequest('/api/auth/login', 'POST', {
            email: 'test@example.com',
            password: 'wrongpassword'
        });
        console.log(`[Login Test] Status: ${login.statusCode} (Expected 401/404), Response: ${login.data}`);
    } catch (e) {
        console.error(`[Login Test] FAILED: ${e.message}`);
    }
}

test();
