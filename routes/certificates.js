const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');
const { authenticate } = require('../middleware/auth');

// @route   GET /api/certificates/my-certificates
// @desc    Get learner's certificates
// @access  Private
router.get('/my-certificates', authenticate, async (req, res) => {
    try {
        const certificates = await Certificate.find({ userId: req.user._id })
            .populate('courseId', 'title')
            .sort({ issuedDate: -1 });

        res.json({
            success: true,
            certificates: certificates || []
        });
    } catch (error) {
        console.error('Get certificates error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
