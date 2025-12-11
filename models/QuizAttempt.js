const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    score: {
        type: Number,
        required: true,
        min: 0,
        max: 10
    },
    totalQuestions: {
        type: Number,
        default: 10
    },
    passed: {
        type: Boolean,
        required: true
    },
    answers: [{
        questionId: String,
        selectedAnswer: Number,
        correct: Boolean
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
