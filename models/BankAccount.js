const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const bankAccountSchema = new mongoose.Schema({
    accountNumber: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    accountHolderName: {
        type: String,
        required: true
    },
    balance: {
        type: Number,
        default: 10000, // Initial balance for demo
        min: 0
    },
    secret: {
        type: String,
        required: true
    },
    accountType: {
        type: String,
        enum: ['user', 'lms', 'instructor'],
        default: 'user'
    }
}, {
    timestamps: true
});

// Hash secret before saving
bankAccountSchema.pre('save', async function (next) {
    if (!this.isModified('secret')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.secret = await bcrypt.hash(this.secret, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to verify secret
bankAccountSchema.methods.verifySecret = async function (candidateSecret) {
    return await bcrypt.compare(candidateSecret, this.secret);
};

module.exports = mongoose.model('BankAccount', bankAccountSchema);
