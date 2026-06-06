require('dotenv').config();
const roboflowService = require('./services/roboflowService');

async function test() {
    try {
        const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        console.log("Config:", roboflowService.ROBOFLOW_CONFIG);
        const result = await roboflowService.detectDefects(testImage);
        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Error:", e.message);
    }
}
test();
