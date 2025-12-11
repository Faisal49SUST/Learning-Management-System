// Script to create an admin user
// Run this once: node create_admin.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const BankAccount = require('./models/BankAccount');

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@lms.com' });
        if (existingAdmin) {
            console.log('Admin user already exists!');
            process.exit(0);
        }

        // Create admin user
        const admin = new User({
            name: 'LMS Administrator',
            email: 'admin@lms.com',
            password: 'admin123', // Will be hashed by the pre-save hook
            role: 'admin'
        });

        await admin.save();
        console.log('✅ Admin user created successfully!');
        console.log('Email: admin@lms.com');
        console.log('Password: admin123');
        console.log('\n⚠️  Please change the password after first login!');

        // Create LMS bank account if it doesn't exist
        const lmsAccount = await BankAccount.findOne({
            accountNumber: process.env.LMS_BANK_ACCOUNT
        });

        if (!lmsAccount) {
            const newLmsAccount = new BankAccount({
                accountNumber: process.env.LMS_BANK_ACCOUNT || 'LMS-MAIN-ACCOUNT',
                accountHolderName: 'LMS Organization',
                secret: 'lms-secret-key',
                balance: 100000,
                accountType: 'lms'
            });
            await newLmsAccount.save();
            console.log('✅ LMS bank account created!');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
}

createAdmin();
