const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const transactionSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        default: () => `TXN-${uuidv4()}`,
        unique: true
    },
    fromAccount: {
        type: String,
        required: true
    },
    toAccount: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    type: {
        type: String,
        enum: ['course_purchase', 'instructor_payment', 'course_upload_payment', 'lms_commission'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'validated'],
        default: 'pending'
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    validated: {
        type: Boolean,
        default: false
    },
    validatedAt: Date,
    description: String
}, {
    timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);
