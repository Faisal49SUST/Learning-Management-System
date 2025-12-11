const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
// Configure multer for file uploads
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath = 'uploads/';
        if (file.fieldname === 'thumbnail') {
            uploadPath = 'uploads/thumbnails/';
        } else {
            uploadPath = 'uploads/materials/';
        }

        // Ensure directory exists
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'thumbnail') {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed for thumbnails'), false);
        }
    } else {
        cb(null, true);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    }
});

// @route   GET /api/courses
// @desc    Get all active courses
// @access  Public
router.get('/', async (req, res) => {
    try {
        const courses = await Course.find({ isActive: true })
            .populate('instructor', 'name email')
            .select('-materials'); // Don't send materials in list view

        res.json({
            success: true,
            count: courses.length,
            courses
        });
    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

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

// @route   GET /api/courses/:id
// @desc    Get single course details
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('instructor', 'name email');

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        res.json({
            success: true,
            course
        });
    } catch (error) {
        console.error('Get course error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/courses
// @desc    Create a new course
// @access  Private (Instructor only)
router.post('/', authenticate, authorize('instructor'), upload.single('thumbnail'), async (req, res) => {
    try {
        const { title, description, price, category, duration } = req.body;

        if (!title || !description || !price) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Check 5-course limit as per project requirements
        const totalCourses = await Course.countDocuments({ isActive: true });
        if (totalCourses >= 5) {
            return res.status(400).json({
                success: false,
                message: 'Maximum course limit reached. The LMS system can only host 5 courses.'
            });
        }

        const course = new Course({
            title,
            description,
            price,
            instructor: req.user._id,
            instructorName: req.user.name,
            category: category || 'General',
            duration: duration || '4 weeks',
            thumbnail: req.file ? req.file.path : null
        });

        await course.save();

        // Add course to instructor's uploaded courses
        await User.findByIdAndUpdate(req.user._id, {
            $push: { uploadedCourses: course._id }
        });

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            course
        });
    } catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT /api/courses/:id
// @desc    Update a course
// @access  Private (Instructor only - own courses)
router.put('/:id', authenticate, authorize('instructor'), async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check if instructor owns the course
        if (course.instructor.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this course'
            });
        }

        const { title, description, price, category, duration, isActive } = req.body;

        if (title) course.title = title;
        if (description) course.description = description;
        if (price) course.price = price;
        if (category) course.category = category;
        if (duration) course.duration = duration;
        if (typeof isActive !== 'undefined') course.isActive = isActive;

        await course.save();

        res.json({
            success: true,
            message: 'Course updated successfully',
            course
        });
    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   DELETE /api/courses/:id
// @desc    Delete a course
// @access  Private (Instructor only - own courses)
router.delete('/:id', authenticate, authorize('instructor'), async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check if instructor owns the course
        if (course.instructor.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this course'
            });
        }

        await course.deleteOne();

        // Remove from instructor's uploaded courses
        await User.findByIdAndUpdate(req.user._id, {
            $pull: { uploadedCourses: course._id }
        });

        res.json({
            success: true,
            message: 'Course deleted successfully'
        });
    } catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/courses/:id/materials
// @desc    Add material to course
// @access  Private (Instructor only - own courses)
router.post('/:id/materials', authenticate, authorize('instructor'), upload.single('file'), async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check if instructor owns the course
        if (course.instructor.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to add materials to this course'
            });
        }

        const { type, title, content } = req.body;

        if (!type || !title) {
            return res.status(400).json({
                success: false,
                message: 'Please provide material type and title'
            });
        }

        const material = {
            type,
            title,
            content: content || '',
            filePath: req.file ? req.file.path : null
        };

        await Course.findByIdAndUpdate(
            req.params.id,
            { $push: { materials: material } },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Material added successfully',
            material
        });
    } catch (error) {
        console.error('Add material error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/courses/:id/materials
// @desc    Get course materials (only if enrolled)
// @access  Private
router.get('/:id/materials', authenticate, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check if user is enrolled or is the instructor
        const isEnrolled = course.enrolledStudents.includes(req.user._id);
        const isInstructor = course.instructor.toString() === req.user._id.toString();

        if (!isEnrolled && !isInstructor) {
            return res.status(403).json({
                success: false,
                message: 'You must be enrolled in this course to access materials'
            });
        }

        res.json({
            success: true,
            materials: course.materials
        });
    } catch (error) {
        console.error('Get materials error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
