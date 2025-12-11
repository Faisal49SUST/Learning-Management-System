const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const User = require('../models/User');
const Certificate = require('../models/Certificate');
const { authenticate } = require('../middleware/auth');

// @route   GET /api/courses/enrolled
// @desc    Get learner's enrolled courses
// @access  Private
router.get('/enrolled', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('enrolledCourses.courseId');

        res.json({
            success: true,
            courses: user.enrolledCourses || []
        });
    } catch (error) {
        console.error('Get enrolled courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
