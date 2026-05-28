require('dotenv').config({ path: '../.env' });
const { db } = require('../firebase');

// 1x1 transparent PNG base64
const dummyBase64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

async function testImgBBUpload() {
    try {
        console.log('Testing ImgBB Upload from Backend...');
        const imgBBKey = process.env.IMGBB_API_KEY || 'cc5f5821379a3c9ad1eaa066381662d0';
        console.log('Using Key:', imgBBKey);

        const params = new URLSearchParams();
        params.append('key', imgBBKey);
        params.append('image', dummyBase64Image);

        const imgbbResponse = await fetch('https://api.imgbb.com/1/upload', {
            method: 'POST',
            body: params,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (!imgbbResponse.ok) {
            const errText = await imgbbResponse.text();
            throw new Error(`ImgBB upload failed with status ${imgbbResponse.status}: ${errText}`);
        }

        const responseData = await imgbbResponse.json();
        console.log('ImgBB Response received successfully!');
        console.log('Direct URL:', responseData.data.url);
        console.log('Thumb URL:', responseData.data.thumb.url);
        console.log('Delete URL:', responseData.data.delete_url);
        console.log('\nSUCCESS: ImgBB integration is working perfectly!');
        process.exit(0);
    } catch (e) {
        console.error('\nERROR: Test Failed:', e.message);
        process.exit(1);
    }
}

testImgBBUpload();
