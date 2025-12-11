const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage for course thumbnails (images)
const thumbnailStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'lms/thumbnails',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 800, height: 450, crop: 'limit' }]
    }
});

// Storage for course videos
const videoStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'lms/videos',
        resource_type: 'video',
        allowed_formats: ['mp4', 'mov', 'avi', 'mkv']
    }
});

// Storage for course audio
const audioStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'lms/audio',
        resource_type: 'video', // Cloudinary uses 'video' for audio files
        allowed_formats: ['mp3', 'wav', 'm4a', 'aac']
    }
});

// Storage for textbook PDFs
const pdfStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'lms/textbooks',
        resource_type: 'raw', // 'raw' for PDFs and other documents
        allowed_formats: ['pdf']
    }
});

module.exports = {
    cloudinary,
    thumbnailStorage,
    videoStorage,
    audioStorage,
    pdfStorage
};
