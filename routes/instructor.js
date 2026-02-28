const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');
const BankAccount = require('../models/BankAccount');
const Transaction = require('../models/Transaction');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');
const { thumbnailStorage, videoStorage, audioStorage, pdfStorage } = require('../config/cloudinary');

// Configure multer with Cloudinary storage
const uploadThumbnail = multer({ storage: thumbnailStorage });
const uploadVideo = multer({ storage: videoStorage });
const uploadAudio = multer({ storage: audioStorage });
const uploadPdf = multer({ storage: pdfStorage });

// @route   GET /api/instructor/my-courses
// @desc    Get instructor's uploaded courses
// @access  Private (Instructor only)
router.get('/my-courses', authenticate, authorize('instructor'), async (req, res) => {
    try {
        const courses = await Course.find({ instructor: req.user._id })
            .populate('enrolledStudents', 'name email');

        res.json({
            success: true,
            count: courses.length,
            courses
        });
    } catch (error) {
        console.error('Get my courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/instructor/students
// @desc    Get all students enrolled in instructor's courses
// @access  Private (Instructor only)
router.get('/students', authenticate, authorize('instructor'), async (req, res) => {
    try {
        const courses = await Course.find({ instructor: req.user._id })
            .populate('enrolledStudents', 'name email');

        // Flatten the students from all courses
        const studentsMap = new Map();

        for (const course of courses) {
            // Get enrollment details from User model
            const enrollments = await User.find({
                'enrolledCourses.courseId': course._id
            }).select('name email enrolledCourses');

            for (const user of enrollments) {
                const enrollment = user.enrolledCourses.find(
                    ec => ec.courseId.toString() === course._id.toString()
                );

                if (enrollment) {
                    const key = `${user._id}-${course._id}`;
                    studentsMap.set(key, {
                        studentName: user.name,
                        studentEmail: user.email,
                        courseTitle: course.title,
                        enrolledAt: enrollment.enrolledAt,
                        completed: enrollment.completed || false
                    });
                }
            }
        }

        const students = Array.from(studentsMap.values());

        res.json({
            success: true,
            count: students.length,
            students
        });
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/instructor/upload-course
// @desc    Upload a new course and receive payment
// @access  Private (Instructor only)
router.post('/upload-course', authenticate, authorize('instructor'), uploadThumbnail.single('thumbnail'), async (req, res) => {
    try {
        const { title, description, price, category, duration, materials } = req.body;

        if (!title || !description || !price) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Check 5-course limit
        const totalCourses = await Course.countDocuments({ isActive: true });
        if (totalCourses >= 5) {
            return res.status(400).json({
                success: false,
                message: 'Maximum course limit reached. The LMS system can only host 5 courses.'
            });
        }

        // Check if this instructor already has a course with the same title
        const duplicateCourse = await Course.findOne({
            instructor: req.user._id,
            title: { $regex: new RegExp(`^${title.trim()}$`, 'i') } // case-insensitive exact match
        });
        if (duplicateCourse) {
            return res.status(400).json({
                success: false,
                message: `A course with the name "${title}" already exists. Please use a different title.`
            });
        }

        // Check if instructor has bank account
        const user = await User.findById(req.user._id);
        if (!user.bankAccount?.accountNumber) {
            return res.status(400).json({
                success: false,
                message: 'Please set up your bank account first'
            });
        }

        // Create course with Cloudinary thumbnail URL
        const course = new Course({
            title,
            description,
            price,
            instructor: req.user._id,
            instructorName: req.user.name,
            category: category || 'General',
            duration: duration || '4 weeks',
            materials: materials || [],
            thumbnail: req.file ? req.file.path : '', // Cloudinary URL
            quizQuestions: [] // Initialize empty quiz
        });

        await course.save();

        // Add to instructor's uploaded courses
        await User.findByIdAndUpdate(req.user._id, {
            $push: { uploadedCourses: course._id }
        });

        // Get LMS bank account
        let lmsAccount = await BankAccount.findOne({
            accountNumber: process.env.LMS_BANK_ACCOUNT
        });

        // Create LMS account if doesn't exist
        if (!lmsAccount) {
            lmsAccount = new BankAccount({
                accountNumber: process.env.LMS_BANK_ACCOUNT,
                accountHolderName: 'LMS Organization',
                secret: 'lms-secret-key',
                balance: 30000, // Initial LMS balance
                accountType: 'lms'
            });
            await lmsAccount.save();
        }

        // Get instructor's bank account
        const instructorAccount = await BankAccount.findOne({
            accountNumber: user.bankAccount.accountNumber
        });

        if (!instructorAccount) {
            return res.status(404).json({
                success: false,
                message: 'Instructor bank account not found'
            });
        }

        // Pay instructor for uploading course
        const uploadPayment = parseFloat(process.env.COURSE_UPLOAD_PAYMENT || 5000);

        if (lmsAccount.balance >= uploadPayment) {
            lmsAccount.balance -= uploadPayment;
            instructorAccount.balance += uploadPayment;

            await lmsAccount.save();
            await instructorAccount.save();

            // Create transaction record
            const transaction = new Transaction({
                fromAccount: lmsAccount.accountNumber,
                toAccount: instructorAccount.accountNumber,
                amount: uploadPayment,
                type: 'course_upload_payment',
                status: 'completed',
                courseId: course._id,
                userId: req.user._id,
                description: `Payment for uploading course: ${course.title}`
            });

            await transaction.save();

            res.status(201).json({
                success: true,
                message: 'Course uploaded successfully and payment received',
                course,
                payment: {
                    amount: uploadPayment,
                    transactionId: transaction.transactionId
                },
                newBalance: instructorAccount.balance
            });
        } else {
            res.status(201).json({
                success: true,
                message: 'Course uploaded successfully (payment pending due to insufficient LMS balance)',
                course
            });
        }
    } catch (error) {
        console.error('Upload course error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/instructor/collect-payment/:transactionId
// @desc    Collect payment for sold course
// @access  Private (Instructor only)
router.post('/collect-payment/:transactionId', authenticate, authorize('instructor'), async (req, res) => {
    try {
        const { secret } = req.body;
        const transactionId = req.params.transactionId;

        if (!secret) {
            return res.status(400).json({
                success: false,
                message: 'Please provide your bank secret'
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

        if (transaction.type !== 'instructor_payment') {
            return res.status(400).json({
                success: false,
                message: 'Invalid transaction type'
            });
        }

        if (transaction.validated) {
            return res.status(400).json({
                success: false,
                message: 'Payment already collected'
            });
        }

        // Verify instructor owns the course
        const course = await Course.findById(transaction.courseId);
        if (course.instructor.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to collect this payment'
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

        // Get LMS account (for validation only)
        const lmsAccount = await BankAccount.findOne({
            accountNumber: process.env.LMS_BANK_ACCOUNT
        });

        if (!lmsAccount) {
            return res.status(404).json({
                success: false,
                message: 'LMS account not found'
            });
        }

        // The payment was already transferred during purchase (70% to instructor)
        // This endpoint just validates/confirms the instructor has acknowledged it
        const instructorPayment = transaction.amount;

        // Update transaction to validated status
        transaction.validated = true;
        transaction.validatedAt = new Date();
        transaction.status = 'validated';
        await transaction.save();

        res.json({
            success: true,
            message: 'Payment collected successfully',
            payment: instructorPayment,
            newBalance: instructorAccount.balance
        });
    } catch (error) {
        console.error('Collect payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/instructor/earnings
// @desc    Get instructor earnings summary
// @access  Private (Instructor only)
router.get('/earnings', authenticate, authorize('instructor'), async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user.bankAccount?.accountNumber) {
            return res.status(400).json({
                success: false,
                message: 'Bank account not set up'
            });
        }

        // Get all transactions
        const transactions = await Transaction.find({
            userId: req.user._id,
            $or: [
                { type: 'course_upload_payment' },
                { type: 'instructor_payment' }
            ]
        }).populate('courseId', 'title');

        // Calculate totals - all completed transactions count toward earnings
        const uploadPayments = transactions
            .filter(t => t.type === 'course_upload_payment' && t.status === 'completed')
            .reduce((sum, t) => sum + t.amount, 0);

        const coursePayments = transactions
            .filter(t => t.type === 'instructor_payment' && t.status === 'completed')
            .reduce((sum, t) => sum + t.amount, 0);

        // Get current balance
        const account = await BankAccount.findOne({
            accountNumber: user.bankAccount.accountNumber
        });

        res.json({
            success: true,
            earnings: {
                uploadPayments,
                coursePayments,
                totalEarned: uploadPayments + coursePayments,
                currentBalance: account?.balance || 0
            },
            transactions
        });
    } catch (error) {
        console.error('Get earnings error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/instructor/pending-payments
// @desc    Get pending payments to collect
// @access  Private (Instructor only)
router.get('/pending-payments', authenticate, authorize('instructor'), async (req, res) => {
    try {
        // Get instructor's courses
        const courses = await Course.find({ instructor: req.user._id });
        const courseIds = courses.map(c => c._id);

        // Get pending transactions
        const pendingTransactions = await Transaction.find({
            courseId: { $in: courseIds },
            type: 'instructor_payment',
            validated: false
        }).populate('courseId', 'title price');

        res.json({
            success: true,
            count: pendingTransactions.length,
            transactions: pendingTransactions
        });
    } catch (error) {
        console.error('Get pending payments error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

router.post('/courses/:id/upload-video', authenticate, authorize('instructor'), uploadVideo.single('video'), async (req, res) => {
    try {
        const { title, description } = req.body;
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        if (course.instructor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const videoMaterial = {
            type: 'video',
            title: title || 'Video Material',
            content: req.file.path, // Cloudinary URL
            publicId: req.file.filename,
            description: description || '',
            uploadedAt: new Date()
        };

        course.materials.push(videoMaterial);
        await course.save();

        res.json({ success: true, material: videoMaterial });
    } catch (error) {
        console.error('Upload video error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/courses/:id/upload-audio', authenticate, authorize('instructor'), uploadAudio.single('audio'), async (req, res) => {
    try {
        const { title } = req.body;
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        if (course.instructor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const audioMaterial = {
            type: 'audio',
            title: title || 'Audio Material',
            content: req.file.path, // Cloudinary URL
            publicId: req.file.filename,
            uploadedAt: new Date()
        };

        course.materials.push(audioMaterial);
        await course.save();

        res.json({ success: true, material: audioMaterial });
    } catch (error) {
        console.error('Upload audio error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/instructor/courses/:id/quiz
// @desc    Add quiz question to course
// @access  Private (Instructor only)
router.post('/courses/:id/quiz', authenticate, authorize('instructor'), async (req, res) => {
    try {
        const { question, options, correctAnswer } = req.body;

        if (!question || !options || options.length !== 4 || correctAnswer === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Please provide question, 4 options, and correct answer (0-3)'
            });
        }

        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        if (course.instructor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        course.quizQuestions.push({ question, options, correctAnswer });
        await course.save();

        res.json({ success: true, quiz: course.quizQuestions });
    } catch (error) {
        console.error('Add quiz error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/instructor/courses/:id/quiz
// @desc    Get all quiz questions for course
// @access  Private (Instructor only)
router.get('/courses/:id/quiz', authenticate, authorize('instructor'), async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        if (course.instructor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        res.json({ success: true, questions: course.quizQuestions });
    } catch (error) {
        console.error('Get quiz error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   DELETE /api/instructor/courses/:courseId/quiz/:questionId
// @desc    Delete quiz question
// @access  Private (Instructor only)
router.delete('/courses/:courseId/quiz/:questionId', authenticate, authorize('instructor'), async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        if (course.instructor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        course.quizQuestions.pull(req.params.questionId);
        await course.save();

        res.json({ success: true, course });
    } catch (error) {
        console.error('Delete quiz question error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/instructor/pending-payments
// @desc    Get pending payments to collect
// @access  Private (Instructor only)
router.get('/pending-payments', authenticate, authorize('instructor'), async (req, res) => {
    try {
        // Get instructor's courses
        const courses = await Course.find({ instructor: req.user._id });
        const courseIds = courses.map(c => c._id);

        // Get pending transactions
        const pendingTransactions = await Transaction.find({
            courseId: { $in: courseIds },
            type: 'instructor_payment',
            validated: false
        }).populate('courseId', 'title price');

        res.json({
            success: true,
            count: pendingTransactions.length,
            transactions: pendingTransactions
        });
    } catch (error) {
        console.error('Get pending payments error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});



// @route   POST /api/instructor/courses/:id/quiz
// @desc    Add quiz question to course
// @access  Private (Instructor only)
router.post('/courses/:id/quiz', authenticate, authorize('instructor'), async (req, res) => {
    try {
        const { question, options, correctAnswer } = req.body;

        if (!question || !options || options.length !== 4 || correctAnswer === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Please provide question, 4 options, and correct answer (0-3)'
            });
        }

        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        if (course.instructor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        course.quizQuestions.push({ question, options, correctAnswer });
        await course.save();

        res.json({ success: true, quiz: course.quizQuestions });
    } catch (error) {
        console.error('Add quiz error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/instructor/courses/:id/quiz
// @desc    Get all quiz questions for course
// @access  Private (Instructor only)
router.get('/courses/:id/quiz', authenticate, authorize('instructor'), async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        if (course.instructor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        res.json({ success: true, questions: course.quizQuestions });
    } catch (error) {
        console.error('Get quiz error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   DELETE /api/instructor/courses/:courseId/quiz/:questionId
// @desc    Delete quiz question
// @access  Private (Instructor only)
router.delete('/courses/:courseId/quiz/:questionId', authenticate, authorize('instructor'), async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        if (course.instructor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        course.quizQuestions.id(req.params.questionId).remove();
        await course.save();

        res.json({ success: true, course });
    } catch (error) {
        console.error('Delete quiz question error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


router.post('/courses/:id/upload-textbook', authenticate, authorize('instructor'), uploadPdf.single('pdf'), async (req, res) => {
    try {
        const { textContent } = req.body;
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        if (course.instructor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Update textbook content if provided
        if (textContent) {
            course.textbookContent = textContent;
        }

        // Update PDF if uploaded
        if (req.file) {
            course.textbookPdf = {
                url: req.file.path, // Cloudinary URL
                publicId: req.file.filename,
                filename: req.file.originalname
            };
        }

        await course.save();

        res.json({
            success: true,
            textbook: {
                content: course.textbookContent,
                pdf: course.textbookPdf
            }
        });
    } catch (error) {
        console.error('Upload textbook error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/instructor/courses/:id
// @desc    Update course metadata and/or thumbnail
// @access  Private (Instructor only)
router.put('/courses/:id', authenticate, authorize('instructor'), uploadThumbnail.single('thumbnail'), async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        if (course.instructor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const { title, description, price, category, duration } = req.body;

        // Check for duplicate title (exclude current course)
        if (title && title.trim() !== course.title) {
            const duplicate = await Course.findOne({
                instructor: req.user._id,
                _id: { $ne: course._id },
                title: { $regex: new RegExp(`^${title.trim()}$`, 'i') }
            });
            if (duplicate) {
                return res.status(400).json({
                    success: false,
                    message: `A course with the name "${title}" already exists. Please use a different title.`
                });
            }
        }

        if (title) course.title = title;
        if (description) course.description = description;
        if (price !== undefined) course.price = parseFloat(price);
        if (category) course.category = category;
        if (duration) course.duration = duration;
        if (req.file) course.thumbnail = req.file.path; // new Cloudinary URL

        await course.save();

        res.json({ success: true, message: 'Course updated successfully', course });
    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   DELETE /api/instructor/courses/:courseId/materials/:materialId
// @desc    Remove a single material (video/audio) from a course
// @access  Private (Instructor only)
router.delete('/courses/:courseId/materials/:materialId', authenticate, authorize('instructor'), async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        if (course.instructor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const material = course.materials.id(req.params.materialId);
        if (!material) {
            return res.status(404).json({ success: false, message: 'Material not found' });
        }

        course.materials.pull(req.params.materialId);
        await course.save();

        res.json({ success: true, message: 'Material removed successfully' });
    } catch (error) {
        console.error('Delete material error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
