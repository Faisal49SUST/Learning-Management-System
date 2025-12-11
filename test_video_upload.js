const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5000/api';

async function testVideoUpload() {
    try {
        // 1. Register a new instructor
        console.log('Registering new instructor...');
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
        if (!registerData.success && !registerData.token) throw new Error(registerData.message || 'Registration failed');

        const token = registerData.token.trim();
        console.log('Registered and logged in. Token:', token.substring(0, 20) + '...');

        // 1.5 Setup bank account (required for upload)
        console.log('Setting up bank account...');
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

        // 2. Create a course
        console.log('Creating course...');
        const courseData = {
            title: 'Test Course for Video Upload ' + Date.now(),
            description: 'Testing video upload',
            price: 100,
            category: 'Programming',
            duration: '1 week'
        };
        const courseRes = await fetch(`${API_URL}/instructor/upload-course`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(courseData)
        });
        const courseResData = await courseRes.json();
        if (!courseResData.success) throw new Error(courseResData.message);
        const courseId = courseResData.course._id;
        console.log('Course created. ID:', courseId);

        // 3. Create dummy video file
        const videoPath = path.join(__dirname, 'test-video.mp4');
        fs.writeFileSync(videoPath, 'dummy video content');

        // 4. Upload video
        console.log('Uploading video...');
        const fileContent = fs.readFileSync(videoPath);
        const blob = new Blob([fileContent], { type: 'video/mp4' });

        const form = new FormData();
        form.append('type', 'video');
        form.append('title', 'Test Video');
        form.append('file', blob, 'test-video.mp4');

        const uploadRes = await fetch(`${API_URL}/courses/${courseId}/materials`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: form
        });

        const uploadData = await uploadRes.json();
        console.log('Upload response:', uploadData);

        // 5. Verify materials
        console.log('Verifying materials...');
        const materialsRes = await fetch(`${API_URL}/courses/${courseId}/materials`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const materialsData = await materialsRes.json();
        console.log('Materials:', materialsData.materials);

        if (materialsData.materials && materialsData.materials.length > 0) {
            console.log('SUCCESS: Video uploaded and found in materials.');
        } else {
            console.log('FAILURE: Materials array is empty.');
        }

        // Cleanup
        fs.unlinkSync(videoPath);

    } catch (error) {
        console.error('Error:', error);
    }
}

testVideoUpload();
