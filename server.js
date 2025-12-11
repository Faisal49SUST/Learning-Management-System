const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const bankRoutes = require('./routes/bank');
const courseRoutes = require('./routes/courses');
const learnerRoutes = require('./routes/learner');
const instructorRoutes = require('./routes/instructor');
const adminRoutes = require('./routes/admin');
const certificatesRoutes = require('./routes/certificates');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bank', bankRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/learner', learnerRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/certificates', certificatesRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'LMS API Server is running',
    endpoints: {
      auth: '/api/auth',
      bank: '/api/bank',
      courses: '/api/courses',
      learner: '/api/learner',
      instructor: '/api/instructor'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: err.message
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📚 LMS API available at http://localhost:${PORT}`);
});
