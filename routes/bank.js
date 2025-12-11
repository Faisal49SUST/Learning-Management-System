const express = require('express');
const router = express.Router();
const BankAccount = require('../models/BankAccount');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

// @route   POST /api/bank/account
// @desc    Create a bank account
// @access  Private
router.post('/account', authenticate, async (req, res) => {
    try {
        const { accountNumber, secret } = req.body;

        if (!accountNumber || !secret) {
            return res.status(400).json({
                success: false,
                message: 'Please provide account number and secret'
            });
        }

        // Check if account already exists
        const existingAccount = await BankAccount.findOne({ accountNumber });
        if (existingAccount) {
            return res.status(400).json({
                success: false,
                message: 'Account number already exists'
            });
        }

        // Create bank account
        const bankAccount = new BankAccount({
            accountNumber,
            userId: req.user._id,
            accountHolderName: req.user.name,
            secret,
            balance: 10000 // Initial balance for demo
        });

        await bankAccount.save();

        // Update user's bank account info
        await User.findByIdAndUpdate(req.user._id, {
            'bankAccount.accountNumber': accountNumber,
            'bankAccount.isSetup': true
        });

        res.status(201).json({
            success: true,
            message: 'Bank account created successfully',
            account: {
                accountNumber: bankAccount.accountNumber,
                balance: bankAccount.balance,
                accountHolderName: bankAccount.accountHolderName
            }
        });
    } catch (error) {
        console.error('Create account error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/bank/account
// @desc    Get bank account details
// @access  Private
router.get('/account', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user.bankAccount?.accountNumber) {
            return res.status(404).json({
                success: false,
                message: 'Bank account not set up'
            });
        }

        const account = await BankAccount.findOne({
            accountNumber: user.bankAccount.accountNumber
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Bank account not found'
            });
        }

        res.json({
            success: true,
            account: {
                accountNumber: account.accountNumber,
                balance: account.balance,
                accountHolderName: account.accountHolderName,
                isSetup: true
            }
        });
    } catch (error) {
        console.error('Get account error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/bank/balance
// @desc    Get account balance
// @access  Private
router.get('/balance', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user.bankAccount?.accountNumber) {
            return res.status(400).json({
                success: false,
                message: 'Bank account not set up'
            });
        }

        const account = await BankAccount.findOne({
            accountNumber: user.bankAccount.accountNumber
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Bank account not found'
            });
        }

        res.json({
            success: true,
            balance: account.balance,
            accountNumber: account.accountNumber,
            accountHolderName: account.accountHolderName
        });
    } catch (error) {
        console.error('Get balance error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/bank/transaction
// @desc    Process a transaction
// @access  Private
router.post('/transaction', authenticate, async (req, res) => {
    try {
        const { fromAccount, toAccount, amount, secret, type, courseId, description } = req.body;

        if (!fromAccount || !toAccount || !amount || !secret) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Get sender account
        const senderAccount = await BankAccount.findOne({ accountNumber: fromAccount });
        if (!senderAccount) {
            return res.status(404).json({
                success: false,
                message: 'Sender account not found'
            });
        }

        // Verify secret
        const isValidSecret = await senderAccount.verifySecret(secret);
        if (!isValidSecret) {
            return res.status(401).json({
                success: false,
                message: 'Invalid secret'
            });
        }

        // Check balance
        if (senderAccount.balance < amount) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient balance'
            });
        }

        // Get receiver account
        const receiverAccount = await BankAccount.findOne({ accountNumber: toAccount });
        if (!receiverAccount) {
            return res.status(404).json({
                success: false,
                message: 'Receiver account not found'
            });
        }

        // Process transaction
        senderAccount.balance -= amount;
        receiverAccount.balance += amount;

        await senderAccount.save();
        await receiverAccount.save();

        // Create transaction record
        const transaction = new Transaction({
            fromAccount,
            toAccount,
            amount,
            type: type || 'course_purchase',
            status: 'completed',
            courseId,
            userId: req.user._id,
            description
        });

        await transaction.save();

        res.json({
            success: true,
            message: 'Transaction completed successfully',
            transaction: {
                transactionId: transaction.transactionId,
                amount: transaction.amount,
                status: transaction.status
            },
            newBalance: senderAccount.balance
        });
    } catch (error) {
        console.error('Transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during transaction'
        });
    }
});

// @route   POST /api/bank/validate
// @desc    Validate and process instructor payment transaction
// @access  Private
router.post('/validate', authenticate, async (req, res) => {
    try {
        const { transactionId, secret } = req.body;

        if (!transactionId || !secret) {
            return res.status(400).json({
                success: false,
                message: 'Please provide transaction ID and secret'
            });
        }

        // Get transaction
        const transaction = await Transaction.findOne({ transactionId });
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        if (transaction.validated) {
            return res.status(400).json({
                success: false,
                message: 'Transaction already validated'
            });
        }

        // Get instructor's bank account
        const user = await User.findById(req.user._id);
        const instructorAccount = await BankAccount.findOne({
            accountNumber: user.bankAccount.accountNumber
        });

        if (!instructorAccount) {
            return res.status(404).json({
                success: false,
                message: 'Instructor bank account not found'
            });
        }

        // Verify secret
        const isValidSecret = await instructorAccount.verifySecret(secret);
        if (!isValidSecret) {
            return res.status(401).json({
                success: false,
                message: 'Invalid secret'
            });
        }

        // Get LMS account
        const lmsAccount = await BankAccount.findOne({
            accountNumber: process.env.LMS_BANK_ACCOUNT
        });

        if (!lmsAccount) {
            return res.status(404).json({
                success: false,
                message: 'LMS account not found'
            });
        }

        // Calculate instructor payment (70% of course price)
        const instructorPayment = transaction.amount * parseFloat(process.env.INSTRUCTOR_COMMISSION_RATE || 0.7);

        // Check LMS balance
        if (lmsAccount.balance < instructorPayment) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient LMS balance'
            });
        }

        // Transfer from LMS to instructor
        lmsAccount.balance -= instructorPayment;
        instructorAccount.balance += instructorPayment;

        await lmsAccount.save();
        await instructorAccount.save();

        // Mark transaction as validated
        transaction.validated = true;
        transaction.validatedAt = new Date();
        transaction.status = 'validated';
        await transaction.save();

        res.json({
            success: true,
            message: 'Transaction validated and payment transferred',
            payment: instructorPayment,
            newBalance: instructorAccount.balance
        });
    } catch (error) {
        console.error('Validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during validation'
        });
    }
});

// @route   GET /api/bank/transactions
// @desc    Get transaction history
// @access  Private
router.get('/transactions', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user.bankAccount?.accountNumber) {
            return res.status(400).json({
                success: false,
                message: 'Bank account not set up'
            });
        }

        const transactions = await Transaction.find({
            $or: [
                { fromAccount: user.bankAccount.accountNumber },
                { toAccount: user.bankAccount.accountNumber }
            ]
        }).populate('courseId', 'title').sort({ createdAt: -1 });

        res.json({
            success: true,
            transactions
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
