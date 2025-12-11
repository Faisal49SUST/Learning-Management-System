import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const UploadCourse = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        category: 'Programming',
        duration: '4 weeks'
    });
    const [thumbnail, setThumbnail] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);

    // Video uploads
    const [videos, setVideos] = useState([]);
    const [currentVideo, setCurrentVideo] = useState({ file: null, title: '', description: '' });

    // Audio uploads
    const [audios, setAudios] = useState([]);
    const [currentAudio, setCurrentAudio] = useState({ file: null, title: '' });

    // Quiz questions
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0
    });

    // Textbook PDF
    const [textbookPdf, setTextbookPdf] = useState(null);
    const [textbookPdfName, setTextbookPdfName] = useState('');

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleThumbnailChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setThumbnail(file);
            setThumbnailPreview(URL.createObjectURL(file));
        }
    };

    // Video handling
    const handleAddVideo = () => {
        if (currentVideo.file) {
            setVideos([...videos, currentVideo]);
            setCurrentVideo({ file: null, title: '', description: '' });
        }
    };

    const handleRemoveVideo = (index) => {
        setVideos(videos.filter((_, i) => i !== index));
    };

    // Audio handling
    const handleAddAudio = () => {
        if (currentAudio.file) {
            setAudios([...audios, currentAudio]);
            setCurrentAudio({ file: null, title: '' });
        }
    };

    const handleRemoveAudio = (index) => {
        setAudios(audios.filter((_, i) => i !== index));
    };

    // Quiz handling
    const handleOptionChange = (index, value) => {
        const newOptions = [...currentQuestion.options];
        newOptions[index] = value;
        setCurrentQuestion({ ...currentQuestion, options: newOptions });
    };

    const handleAddQuestion = () => {
        if (currentQuestion.question && currentQuestion.options.every(opt => opt)) {
            setQuizQuestions([...quizQuestions, currentQuestion]);
            setCurrentQuestion({
                question: '',
                options: ['', '', '', ''],
                correctAnswer: 0
            });
        } else {
            alert('Please fill in the question and all 4 options');
        }
    };

    const handleRemoveQuestion = (index) => {
        setQuizQuestions(quizQuestions.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (quizQuestions.length < 10) {
            alert('Please add at least 10 quiz questions');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Step 1: Create course with thumbnail
            const courseData = new FormData();
            courseData.append('title', formData.title);
            courseData.append('description', formData.description);
            courseData.append('price', parseFloat(formData.price));
            courseData.append('category', formData.category);
            courseData.append('duration', formData.duration);
            if (thumbnail) {
                courseData.append('thumbnail', thumbnail);
            }

            const courseRes = await api.post('/instructor/upload-course', courseData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const courseId = courseRes.data.course._id;
            console.log('Course created with ID:', courseId);

            // Step 2: Upload videos
            if (videos.length > 0) {
                console.log(`Uploading ${videos.length} videos...`);
                for (let i = 0; i < videos.length; i++) {
                    const video = videos[i];
                    console.log(`Uploading video ${i + 1}/${videos.length}:`, video.title);

                    const videoData = new FormData();
                    videoData.append('video', video.file);
                    videoData.append('title', video.title || 'Video Material');
                    if (video.description) {
                        videoData.append('description', video.description);
                    }

                    try {
                        const videoRes = await api.post(`/instructor/courses/${courseId}/upload-video`, videoData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        console.log('Video uploaded successfully:', videoRes.data);
                    } catch (videoErr) {
                        console.error('Video upload error:', videoErr);
                        throw new Error(`Failed to upload video: ${video.title}`);
                    }
                }
            }

            // Step 3: Upload audios
            if (audios.length > 0) {
                console.log(`Uploading ${audios.length} audio files...`);
                for (let i = 0; i < audios.length; i++) {
                    const audio = audios[i];
                    console.log(`Uploading audio ${i + 1}/${audios.length}:`, audio.title);

                    const audioData = new FormData();
                    audioData.append('audio', audio.file);
                    audioData.append('title', audio.title || 'Audio Material');

                    try {
                        const audioRes = await api.post(`/instructor/courses/${courseId}/upload-audio`, audioData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        console.log('Audio uploaded successfully:', audioRes.data);
                    } catch (audioErr) {
                        console.error('Audio upload error:', audioErr);
                        throw new Error(`Failed to upload audio: ${audio.title}`);
                    }
                }
            }

            // Step 4: Add quiz questions
            console.log(`Adding ${quizQuestions.length} quiz questions...`);
            for (const question of quizQuestions) {
                await api.post(`/instructor/courses/${courseId}/quiz`, question);
            }
            console.log('Quiz questions added successfully');

            // Upload textbook PDF if provided (optional, won't fail course upload)
            if (textbookPdf) {
                try {
                    console.log('Uploading textbook PDF...');
                    const textbookFormData = new FormData();
                    textbookFormData.append('pdf', textbookPdf);
                    await api.post(`/instructor/courses/${courseId}/upload-textbook`, textbookFormData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    console.log('Textbook PDF uploaded successfully');
                } catch (pdfError) {
                    console.error('Textbook PDF upload failed (non-critical):', pdfError);
                    // Don't throw - textbook is optional
                }
            } else {
                console.log('No textbook PDF to upload');
            }

            console.log('All uploads complete!');
            setMessage('Course uploaded successfully with all materials!');
            setTimeout(() => navigate('/instructor/my-courses'), 2000);
        } catch (err) {
            console.error('Course upload error:', err);
            console.error('Error details:', err.response?.data);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to upload course';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Upload New Course</h1>

            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
                {/* Basic Course Info */}
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>📚 Course Information</h2>

                    <div className="input-group">
                        <label>Course Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            placeholder="Enter course title"
                        />
                    </div>

                    <div className="input-group">
                        <label>Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows="4"
                            placeholder="Enter course description"
                        />
                    </div>

                    <div className="input-group">
                        <label>Price (৳)</label>
                        <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            required
                            min="0"
                            placeholder="Enter price"
                        />
                    </div>

                    <div className="input-group">
                        <label>Category</label>
                        <select name="category" value={formData.category} onChange={handleChange}>
                            <option value="Programming">Programming</option>
                            <option value="Design">Design</option>
                            <option value="Business">Business</option>
                            <option value="Marketing">Marketing</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label>Duration</label>
                        <input
                            type="text"
                            name="duration"
                            value={formData.duration}
                            onChange={handleChange}
                            placeholder="e.g., 4 weeks"
                        />
                    </div>

                    <div className="input-group">
                        <label>Thumbnail Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleThumbnailChange}
                        />
                        {thumbnailPreview && (
                            <img
                                src={thumbnailPreview}
                                alt="Thumbnail preview"
                                style={{ maxWidth: '200px', marginTop: '1rem', borderRadius: '8px' }}
                            />
                        )}
                    </div>
                </div>

                {/* Video Upload Section */}
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>📹 Add Videos</h2>

                    <div className="input-group">
                        <label>Video Title</label>
                        <input
                            type="text"
                            value={currentVideo.title}
                            onChange={(e) => setCurrentVideo({ ...currentVideo, title: e.target.value })}
                            placeholder="Enter video title"
                        />
                    </div>

                    <div className="input-group">
                        <label>Video Description/Notes (Optional)</label>
                        <textarea
                            value={currentVideo.description}
                            onChange={(e) => setCurrentVideo({ ...currentVideo, description: e.target.value })}
                            placeholder="Add notes or description for this video..."
                            rows="4"
                            style={{ minHeight: '100px' }}
                        />
                        <small style={{ color: 'var(--text-muted)' }}>
                            This text will appear below the video for learners
                        </small>
                    </div>

                    <div className="input-group">
                        <label>Video File (MP4)</label>
                        <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => setCurrentVideo({ ...currentVideo, file: e.target.files[0] })}
                        />
                    </div>

                    <button type="button" onClick={handleAddVideo} className="btn btn-secondary" disabled={!currentVideo.file}>
                        Add Video to Course
                    </button>

                    {videos.length > 0 && (
                        <div style={{ marginTop: '1rem' }}>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Added Videos ({videos.length})</h3>
                            {videos.map((video, index) => (
                                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'var(--bg-tertiary)', borderRadius: '4px', marginBottom: '0.5rem' }}>
                                    <span>📹 {video.title || video.file.name}</span>
                                    <button type="button" onClick={() => handleRemoveVideo(index)} className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem' }}>Remove</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Audio Upload Section */}
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>🎵 Add Audio</h2>

                    <div className="input-group">
                        <label>Audio Title</label>
                        <input
                            type="text"
                            value={currentAudio.title}
                            onChange={(e) => setCurrentAudio({ ...currentAudio, title: e.target.value })}
                            placeholder="Enter audio title"
                        />
                    </div>

                    <div className="input-group">
                        <label>Audio File (MP3)</label>
                        <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) => setCurrentAudio({ ...currentAudio, file: e.target.files[0] })}
                        />
                    </div>

                    <button type="button" onClick={handleAddAudio} className="btn btn-secondary" disabled={!currentAudio.file}>
                        Add Audio to Course
                    </button>

                    {audios.length > 0 && (
                        <div style={{ marginTop: '1rem' }}>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Added Audio ({audios.length})</h3>
                            {audios.map((audio, index) => (
                                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'var(--bg-tertiary)', borderRadius: '4px', marginBottom: '0.5rem' }}>
                                    <span>🎵 {audio.title || audio.file.name}</span>
                                    <button type="button" onClick={() => handleRemoveAudio(index)} className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem' }}>Remove</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quiz Section */}
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>📝 Create Quiz Questions</h2>
                    <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
                        ℹ️ Add at least 10 quiz questions. Learners must score 8/10 to complete the course.
                    </div>

                    <div className="input-group">
                        <label>Question</label>
                        <input
                            type="text"
                            value={currentQuestion.question}
                            onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                            placeholder="Enter your question"
                        />
                    </div>

                    {currentQuestion.options.map((option, index) => (
                        <div key={index} className="input-group">
                            <label>Option {index + 1}</label>
                            <input
                                type="text"
                                value={option}
                                onChange={(e) => handleOptionChange(index, e.target.value)}
                                placeholder={`Enter option ${index + 1}`}
                            />
                        </div>
                    ))}

                    <div className="input-group">
                        <label>Correct Answer</label>
                        <select
                            value={currentQuestion.correctAnswer}
                            onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswer: parseInt(e.target.value) })}
                        >
                            <option value={0}>Option 1</option>
                            <option value={1}>Option 2</option>
                            <option value={2}>Option 3</option>
                            <option value={3}>Option 4</option>
                        </select>
                    </div>

                    <button type="button" onClick={handleAddQuestion} className="btn btn-secondary">
                        Add Question
                    </button>

                    {quizQuestions.length > 0 && (
                        <div style={{ marginTop: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Quiz Questions ({quizQuestions.length})</h3>
                            {quizQuestions.map((q, index) => (
                                <div key={index} style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '8px', marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                                                {index + 1}. {q.question}
                                            </p>
                                            {q.options.map((opt, i) => (
                                                <p key={i} style={{
                                                    marginLeft: '1rem',
                                                    fontSize: '0.9rem',
                                                    color: i === q.correctAnswer ? 'var(--success)' : 'inherit',
                                                    fontWeight: i === q.correctAnswer ? '600' : 'normal'
                                                }}>
                                                    {String.fromCharCode(65 + i)}. {opt} {i === q.correctAnswer && '✓'}
                                                </p>
                                            ))}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveQuestion(index)}
                                            className="btn btn-secondary"
                                            style={{ padding: '0.25rem 0.75rem', marginLeft: '1rem' }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Textbook Section */}
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>📖 Textbook PDF (Optional)</h2>

                    <div className="input-group">
                        <label>Textbook PDF</label>
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    setTextbookPdf(file);
                                    setTextbookPdfName(file.name);
                                }
                            }}
                        />
                        {textbookPdfName && (
                            <small style={{ color: 'var(--success)', marginTop: '0.5rem', display: 'block' }}>
                                📄 Selected: {textbookPdfName}
                            </small>
                        )}
                        <small style={{ color: 'var(--text-muted)' }}>
                            Upload a PDF textbook for learners to download (optional)
                        </small>
                    </div>
                </div>

                <button type="submit" disabled={loading || quizQuestions.length < 10} className="btn btn-primary btn-block">
                    {loading ? 'Uploading Course...' : `Upload Course ${quizQuestions.length < 10 ? `(Need ${10 - quizQuestions.length} more quiz questions)` : ''}`}
                </button>
            </form>
        </div>
    );
};

export default UploadCourse;
