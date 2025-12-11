// Quick debug script to check course materials
const mongoose = require('mongoose');
const Course = require('./models/Course');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');

        const courses = await Course.find().select('title materials quizQuestions');

        courses.forEach(course => {
            console.log('\n===================');
            console.log('Course:', course.title);
            console.log('Materials count:', course.materials?.length || 0);
            console.log('Quiz questions:', course.quizQuestions?.length || 0);

            if (course.materials && course.materials.length > 0) {
                course.materials.forEach((mat, idx) => {
                    console.log(`  Material ${idx + 1}:`, {
                        type: mat.type,
                        title: mat.title,
                        hasContent: !!mat.content,
                        contentPreview: mat.content?.substring(0, 50)
                    });
                });
            }
        });

        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
