const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const certificateSchema = new mongoose.Schema({
    certificateId: {
        type: String,
        default: () => `CERT-${uuidv4().substring(0, 8).toUpperCase()}`,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    courseTitle: {
        type: String,
        required: true
    },
    issuedDate: {
        type: Date,
        default: Date.now
    },
    completionDate: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Certificate', certificateSchema);
