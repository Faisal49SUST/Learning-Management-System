const express = require('express');
const router = express.Router();
const User = require('../models/User');
const BankAccount = require('../models/BankAccount');
const Transaction = require('../models/Transaction');
const Course = require('../models/Course');
const { authenticate, authorize } = require('../middleware/auth');

// @route   GET /api/admin/balance
// @desc    Get LMS balance
// @access  Private (Admin only)
router.get('/balance', authenticate, authorize('admin'), async (req, res) => {
    try {
        const lmsAccount = await BankAccount.findOne({
            accountNumber: process.env.LMS_BANK_ACCOUNT
        });

        if (!lmsAccount) {
            return res.status(404).json({
                success: false,
                message: 'LMS bank account not found'
            });
        }

        res.json({
            success: true,
            balance: lmsAccount.balance,
            accountNumber: lmsAccount.accountNumber,
            accountHolderName: lmsAccount.accountHolderName
        });
    } catch (error) {
        console.error('Get LMS balance error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/admin/transactions
// @desc    Get recent transactions
// @access  Private (Admin only)
router.get('/transactions', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { limit = 50, type } = req.query;

        const query = {};
        if (type) {
            query.type = type;
        }

        const transactions = await Transaction.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('userId', 'name email role')
            .populate('courseId', 'title price');

        // Calculate statistics
        const stats = {
            totalRevenue: 0,
            instructorPayments: 0,
            lmsCommission: 0,
            totalCoursesSold: 0
        };

        transactions.forEach(tx => {
            if (tx.type === 'course_purchase') {
                stats.totalRevenue += tx.amount;
                stats.totalCoursesSold++;
            } else if (tx.type === 'instructor_payment') {
                stats.instructorPayments += tx.amount;
            } else if (tx.type === 'lms_commission') {
                stats.lmsCommission += tx.amount;
            }
        });

        res.json({
            success: true,
            transactions,
            stats,
            count: transactions.length
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/admin/stats
// @desc    Get platform statistics
// @access  Private (Admin only)
router.get('/stats', authenticate, authorize('admin'), async (req, res) => {
    try {
        const [
            totalInstructors,
            totalLearners,
            totalCourses,
            activeCourses,
            lmsAccount
        ] = await Promise.all([
            User.countDocuments({ role: 'instructor' }),
            User.countDocuments({ role: 'learner' }),
            Course.countDocuments(),
            Course.countDocuments({ isActive: true }),
            BankAccount.findOne({ accountNumber: process.env.LMS_BANK_ACCOUNT })
        ]);

        res.json({
            success: true,
            stats: {
                totalInstructors,
                totalLearners,
                totalCourses,
                activeCourses,
                lmsBalance: lmsAccount ? lmsAccount.balance : 0
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
