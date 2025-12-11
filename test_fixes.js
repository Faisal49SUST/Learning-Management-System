const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5000/api';

async function testFixes() {
    try {
        console.log('--- STARTING TESTS ---');

        // 1. Register
        const email = `instructor_${Date.now()}@example.com`;
        const registerRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Instructor',
                email: email,
                password: 'password123',
                role: 'instructor'
            })
        });
        const registerData = await registerRes.json();
        const token = registerData.token.trim();
        console.log('1. Registered. Token obtained.');

        // 2. Test Bank Setup Persistence
        console.log('2. Testing Bank Setup...');
        await fetch(`${API_URL}/bank/account`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                accountNumber: `BANK_${Date.now()}`,
                secret: '1234'
            })
        });

        // Verify persistence
        const bankRes = await fetch(`${API_URL}/bank/account`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const bankData = await bankRes.json();
        if (bankData.success && bankData.account && bankData.account.isSetup) {
            console.log('✅ Bank Setup Persistence: PASS');
        } else {
            console.log('❌ Bank Setup Persistence: FAIL', bankData);
        }

        // 3. Test Video Upload
        console.log('3. Testing Video Upload...');
        // Create course
        const courseRes = await fetch(`${API_URL}/instructor/upload-course`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title: 'Test Course',
                description: 'Desc',
                price: 100,
                category: 'Tech',
                duration: '1h'
            })
        });
        const courseData = await courseRes.json();
        const courseId = courseData.course._id;

        // Create dummy video
        const videoPath = path.join(__dirname, 'test.mp4');
        fs.writeFileSync(videoPath, 'dummy');
        const blob = new Blob([fs.readFileSync(videoPath)], { type: 'video/mp4' });

        const form = new FormData();
        form.append('type', 'video');
        form.append('title', 'Test Video');
        form.append('file', blob, 'test.mp4');

        const uploadRes = await fetch(`${API_URL}/courses/${courseId}/materials`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: form
        });
        const uploadData = await uploadRes.json();

        if (uploadData.success && uploadData.debug && uploadData.debug.materialsCount > 0) {
            console.log('✅ Video Upload Persistence: PASS (Count: ' + uploadData.debug.materialsCount + ')');
        } else {
            console.log('❌ Video Upload Persistence: FAIL', uploadData);
        }

        fs.unlinkSync(videoPath);

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testFixes();
