const http = require('http');

const endpoints = [
    '/api/orders',
    '/api/reports',
    '/api/users'
];

async function test(path) {
    return new Promise((resolve) => {
        console.log(`Testing ${path}...`);
        const req = http.get(`http://localhost:5000${path}`, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`Status: ${res.statusCode}`);
                try {
                    const json = JSON.parse(data);
                    console.log(`Result: Success! (Found ${Array.isArray(json) ? json.length : 1} items)`);
                    if (Array.isArray(json) && json.length > 0) {
                        console.log(`Sample ID: ${json[0].id}`);
                    }
                } catch (e) {
                    console.log(`Result: Failed to parse JSON. Data preview: ${data.substring(0, 100)}`);
                }
                resolve();
            });
        });
        req.on('error', (e) => {
            console.log(`Error: ${e.message}`);
            resolve();
        });
        req.setTimeout(5000, () => {
            console.log('Timeout');
            req.destroy();
            resolve();
        });
    });
}

async function run() {
    for (const ep of endpoints) {
        await test(ep);
    }
}

run();
