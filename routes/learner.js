const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');
const BankAccount = require('../models/BankAccount');
const Transaction = require('../models/Transaction');
const Certificate = require('../models/Certificate');
const { authenticate, authorize } = require('../middleware/auth');

// @route   POST /api/learner/bank-setup
// @desc    Set up bank account for learner
// @access  Private (Learner only)
router.post('/bank-setup', authenticate, authorize('learner'), async (req, res) => {
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
            balance: 10000 // Initial balance
        });

        await bankAccount.save();

        // Update user
        await User.findByIdAndUpdate(req.user._id, {
            'bankAccount.accountNumber': accountNumber,
            'bankAccount.isSetup': true
        });

        res.json({
            success: true,
            message: 'Bank account set up successfully',
            account: {
                accountNumber: bankAccount.accountNumber,
                balance: bankAccount.balance
            }
        });
    } catch (error) {
        console.error('Bank setup error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/learner/my-courses
// @desc    Get learner's enrolled courses
// @access  Private (Learner only)
router.get('/my-courses', authenticate, authorize('learner'), async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('enrolledCourses.courseId');

        res.json({
            success: true,
            courses: user.enrolledCourses
        });
    } catch (error) {
        console.error('Get my courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/learner/purchase/:courseId
// @desc    Purchase a course
// @access  Private (Learner only)
router.post('/purchase/:courseId', authenticate, authorize('learner'), async (req, res) => {
    try {
        const { secret } = req.body;
        const courseId = req.params.courseId;

        if (!secret) {
            return res.status(400).json({
                success: false,
                message: 'Please provide your bank secret'
            });
        }

        // Get course
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check if already enrolled
        const user = await User.findById(req.user._id);
        const alreadyEnrolled = user.enrolledCourses.some(
            ec => ec.courseId.toString() === courseId
        );

        if (alreadyEnrolled) {
            return res.status(400).json({
                success: false,
                message: 'You are already enrolled in this course'
            });
        }

        // Check if bank account is set up
        if (!user.bankAccount?.accountNumber) {
            return res.status(400).json({
                success: false,
                message: 'Please set up your bank account first'
            });
        }

        // Get learner's bank account
        const learnerAccount = await BankAccount.findOne({
            accountNumber: user.bankAccount.accountNumber
        });

        if (!learnerAccount) {
            return res.status(404).json({
                success: false,
                message: 'Bank account not found'
            });
        }

        // Verify secret
        try {
            const isValidSecret = await learnerAccount.verifySecret(secret);
            if (!isValidSecret) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid secret'
                });
            }
        } catch (error) {
            console.error('Secret verification error:', error);
            return res.status(500).json({
                success: false,
                message: 'Error verifying secret'
            });
        }

        // Check balance
        if (learnerAccount.balance < course.price) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient balance'
            });
        }

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
                balance: 0,
                accountType: 'lms'
            });
            await lmsAccount.save();
        }

        // Get instructor's bank account
        const instructor = await User.findById(course.instructor);
        if (!instructor || !instructor.bankAccount?.accountNumber) {
            return res.status(400).json({
                success: false,
                message: 'Instructor bank account not found'
            });
        }

        const instructorAccount = await BankAccount.findOne({
            accountNumber: instructor.bankAccount.accountNumber
        });

        if (!instructorAccount) {
            return res.status(404).json({
                success: false,
                message: 'Instructor bank account not found'
            });
        }

        // Calculate split: 70% to instructor, 30% to LMS
        const instructorShare = course.price * 0.7;
        const lmsCommission = course.price * 0.3;

        // Process payment
        learnerAccount.balance -= course.price;
        instructorAccount.balance += instructorShare;
        lmsAccount.balance += lmsCommission;

        await learnerAccount.save();
        await instructorAccount.save();
        await lmsAccount.save();

        // Create transaction records
        // 1. Course purchase transaction
        const purchaseTransaction = new Transaction({
            fromAccount: learnerAccount.accountNumber,
            toAccount: lmsAccount.accountNumber,
            amount: course.price,
            type: 'course_purchase',
            status: 'completed',
            courseId: course._id,
            userId: req.user._id,
            description: `Purchase of course: ${course.title}`
        });

        // 2. Instructor payment transaction
        const instructorPayment = new Transaction({
            fromAccount: lmsAccount.accountNumber,
            toAccount: instructorAccount.accountNumber,
            amount: instructorShare,
            type: 'instructor_payment',
            status: 'completed',
            courseId: course._id,
            userId: instructor._id,
            description: `70% payment for course: ${course.title}`
        });

        // 3. LMS commission transaction
        const lmsCommissionTx = new Transaction({
            fromAccount: lmsAccount.accountNumber,
            toAccount: lmsAccount.accountNumber,
            amount: lmsCommission,
            type: 'lms_commission',
            status: 'completed',
            courseId: course._id,
            userId: req.user._id,
            description: `30% commission for course: ${course.title}`
        });

        await purchaseTransaction.save();
        await instructorPayment.save();
        await lmsCommissionTx.save();

        // Enroll user in course
        await User.findByIdAndUpdate(req.user._id, {
            $push: {
                enrolledCourses: {
                    courseId: course._id,
                    enrolledAt: new Date()
                }
            }
        });

        // Add user to course's enrolled students
        await Course.findByIdAndUpdate(course._id, {
            $push: { enrolledStudents: req.user._id }
        });

        res.json({
            success: true,
            message: 'Course purchased successfully',
            newBalance: learnerAccount.balance
        });
    } catch (error) {
        console.error('Purchase course error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/learner/complete/:courseId
// @desc    Mark course as completed and get certificate
// @access  Private (Learner only)
router.post('/complete/:courseId', authenticate, authorize('learner'), async (req, res) => {
    try {
        const courseId = req.params.courseId;

        // Get user
        const user = await User.findById(req.user._id);

        // Find enrolled course
        const enrolledCourse = user.enrolledCourses.find(
            ec => ec.courseId.toString() === courseId
        );

        if (!enrolledCourse) {
            return res.status(400).json({
                success: false,
                message: 'You are not enrolled in this course'
            });
        }

        if (enrolledCourse.completed) {
            return res.status(400).json({
                success: false,
                message: 'Course already completed'
            });
        }

        // Get course details
        const course = await Course.findById(courseId);

        // Mark as completed
        enrolledCourse.completed = true;
        enrolledCourse.completedAt = new Date();
        await user.save();

        // Generate certificate
        const certificate = new Certificate({
            userId: req.user._id,
            userName: req.user.name,
            courseId: course._id,
            courseTitle: course.title,
            completionDate: new Date()
        });

        await certificate.save();

        res.json({
            success: true,
            message: 'Course completed successfully',
            certificate: {
                certificateId: certificate.certificateId,
                courseTitle: certificate.courseTitle,
                issuedDate: certificate.issuedDate
            }
        });
    } catch (error) {
        console.error('Complete course error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/learner/certificates
// @desc    Get all certificates
// @access  Private (Learner only)
router.get('/certificates', authenticate, authorize('learner'), async (req, res) => {
    try {
        const certificates = await Certificate.find({ userId: req.user._id })
            .populate('courseId', 'title');

        res.json({
            success: true,
            certificates
        });
    } catch (error) {
        console.error('Get certificates error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/learner/certificate/:courseId
// @desc    Get certificate for specific course
// @access  Private (Learner only)
router.get('/certificate/:courseId', authenticate, authorize('learner'), async (req, res) => {
    try {
        const certificate = await Certificate.findOne({
            userId: req.user._id,
            courseId: req.params.courseId
        }).populate('courseId', 'title');

        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: 'Certificate not found'
            });
        }

        res.json({
            success: true,
            certificate
        });
    } catch (error) {
        console.error('Get balance error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/learner/courses/:id/quiz
// @desc    Get 10 random quiz questions for course
// @access  Private (Learner only - must be enrolled)
router.get('/courses/:id/quiz', authenticate, authorize('learner'), async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Check if learner is enrolled
        const user = await User.findById(req.user._id);
        const isEnrolled = user.enrolledCourses.some(ec => ec.courseId.toString() === course._id.toString());

        if (!isEnrolled) {
            return res.status(403).json({ success: false, message: 'You must purchase this course first' });
        }

        if (course.quizQuestions.length < 10) {
            return res.status(400).json({
                success: false,
                message: `This course needs at least 10 quiz questions. Currently has ${course.quizQuestions.length}.`
            });
        }

        // Get 10 random questions (without correct answers)
        const shuffled = [...course.quizQuestions].sort(() => 0.5 - Math.random());
        const selectedQuestions = shuffled.slice(0, 10).map((q, index) => ({
            _id: q._id,
            question: q.question,
            options: q.options,
            index: index
        }));

        res.json({ success: true, questions: selectedQuestions });
    } catch (error) {
        console.error('Get quiz error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/learner/courses/:id/quiz/submit
// @desc    Submit quiz answers and get score
// @access  Private (Learner only)
router.post('/courses/:id/quiz/submit', authenticate, authorize('learner'), async (req, res) => {
    try {
        const { answers } = req.body; // Array of { questionId, selectedAnswer }
        const QuizAttempt = require('../models/QuizAttempt');

        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Calculate score
        let correctCount = 0;
        const detailedAnswers = answers.map(ans => {
            const question = course.quizQuestions.id(ans.questionId);
            const isCorrect = question && question.correctAnswer === ans.selectedAnswer;
            if (isCorrect) correctCount++;

            return {
                questionId: ans.questionId,
                selectedAnswer: ans.selectedAnswer,
                correct: isCorrect
            };
        });

        const passed = correctCount >= 8;

        // Save quiz attempt
        const attempt = new QuizAttempt({
            userId: req.user._id,
            courseId: course._id,
            score: correctCount,
            totalQuestions: 10,
            passed,
            answers: detailedAnswers
        });
        await attempt.save();

        // If passed, mark course as complete and generate certificate
        if (passed) {
            const user = await User.findById(req.user._id);
            const enrollment = user.enrolledCourses.find(ec => ec.courseId.toString() === course._id.toString());

            if (enrollment && !enrollment.completed) {
                enrollment.completed = true;
                enrollment.completedAt = new Date();
                await user.save();

                // Generate certificate
                const existingCert = await Certificate.findOne({
                    userId: req.user._id,
                    courseId: course._id
                });

                if (!existingCert) {
                    const certificate = new Certificate({
                        userId: req.user._id,
                        courseId: course._id,
                        courseTitle: course.title,
                        userName: user.name,
                        completionDate: new Date()
                    });
                    await certificate.save();
                }
            }
        }

        res.json({
            success: true,
            score: correctCount,
            totalQuestions: 10,
            passed,
            message: passed ? 'Congratulations! You passed the quiz and completed the course!' : 'You need at least 8/10 to pass. Try again!'
        });
    } catch (error) {
        console.error('Submit quiz error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/learner/courses/:id/quiz/attempts
// @desc    Get quiz attempt history
// @access  Private (Learner only)
router.get('/courses/:id/quiz/attempts', authenticate, authorize('learner'), async (req, res) => {
    try {
        const QuizAttempt = require('../models/QuizAttempt');
        const attempts = await QuizAttempt.find({
            userId: req.user._id,
            courseId: req.params.id
        }).sort({ createdAt: -1 });

        res.json({ success: true, attempts });
    } catch (error) {
        console.error('Get attempts error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/learner/courses/:id/content
// @desc    Get course content (videos/audio) for enrolled learners
// @access  Private (Learner only - must be enrolled)
router.get('/courses/:id/content', authenticate, authorize('learner'), async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Check if learner is enrolled
        const user = await User.findById(req.user._id);
        const isEnrolled = user.enrolledCourses.some(ec => ec.courseId.toString() === course._id.toString());

        if (!isEnrolled) {
            return res.status(403).json({ success: false, message: 'You must purchase this course to access content' });
        }

        res.json({ success: true, course });
    } catch (error) {
        console.error('Get course content error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/learner/courses/:id/download-pdf
// @desc    Download course textbook PDF
// @access  Private (Learner only - must be enrolled)
router.get('/courses/:id/download-pdf', authenticate, authorize('learner'), async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Check if learner is enrolled
        const user = await User.findById(req.user._id);
        const isEnrolled = user.enrolledCourses.some(ec => ec.courseId.toString() === course._id.toString());

        if (!isEnrolled) {
            return res.status(403).json({ success: false, message: 'You must purchase this course to access the PDF' });
        }

        // Check if PDF exists
        if (!course.textbookPdf || !course.textbookPdf.url) {
            return res.status(404).json({ success: false, message: 'No PDF available for this course' });
        }

        // Fetch the PDF from Cloudinary
        const https = require('https');
        const http = require('http');
        const url = require('url');

        const pdfUrl = course.textbookPdf.url;
        const parsedUrl = url.parse(pdfUrl);
        const protocol = parsedUrl.protocol === 'https:' ? https : http;

        protocol.get(pdfUrl, (pdfResponse) => {
            // Set proper headers for PDF download
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${course.textbookPdf.filename || 'textbook.pdf'}"`);

            // Pipe the PDF data to the response
            pdfResponse.pipe(res);
        }).on('error', (error) => {
            console.error('Error fetching PDF:', error);
            res.status(500).json({ success: false, message: 'Error downloading PDF' });
        });

    } catch (error) {
        console.error('Download PDF error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
