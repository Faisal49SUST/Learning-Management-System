const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['learner', 'instructor', 'admin'],
        default: 'learner'
    },
    bankAccount: {
        accountNumber: String,
        secret: String,
        isSetup: {
            type: Boolean,
            default: false
        }
    },
    enrolledCourses: [{
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        },
        enrolledAt: {
            type: Date,
            default: Date.now
        },
        completed: {
            type: Boolean,
            default: false
        },
        completedAt: Date
    }],
    uploadedCourses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    }]
}, {
    timestamps: true
});
//register 4
// Hash password before saving 
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next(); //skips the hook if password remains unchanged
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next(); // goes back to auth.js to save the user
    } catch (error) {
        next(error);
    }
});
//login 4
// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
