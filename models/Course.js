const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    instructorName: {
        type: String,
        required: true
    },
    materials: [{
        type: {
            type: String,
            enum: ['text', 'audio', 'video', 'mcq'],
            required: true
        },
        title: {
            type: String,
            required: true
        },
        content: {
            type: String, // Cloudinary URL for audio/video
            required: true
        },
        description: {
            type: String,
            default: ''
        },
        filePath: String, // For backward compatibility
        publicId: String, // Cloudinary public ID
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    enrolledStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    category: {
        type: String,
        default: 'General'
    },
    duration: {
        type: String,
        default: '4 weeks'
    },
    thumbnail: {
        type: String, // Cloudinary URL
        default: ''
    },
    quizQuestions: [{
        question: {
            type: String,
            required: true
        },
        options: [{
            type: String,
            required: true
        }], // Array of 4 options
        correctAnswer: {
            type: Number,
            required: true,
            min: 0,
            max: 3
        }
    }],
    textbookContent: {
        type: String,
        default: ''
    },
    textbookPdf: {
        url: {
            type: String,
            default: ''
        },
        publicId: {
            type: String,
            default: ''
        },
        filename: {
            type: String,
            default: ''
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);
