import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';

const EditCourse = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Core info
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        category: 'Programming',
        duration: '4 weeks'
    });

    // Thumbnail
    const [newThumbnail, setNewThumbnail] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [currentThumbnail, setCurrentThumbnail] = useState('');

    // Existing materials from DB
    const [existingVideos, setExistingVideos] = useState([]);
    const [existingAudios, setExistingAudios] = useState([]);
    const [existingQuizQuestions, setExistingQuizQuestions] = useState([]);
    const [existingPdf, setExistingPdf] = useState(null);

    // New materials to add
    const [newVideos, setNewVideos] = useState([]);
    const [currentVideo, setCurrentVideo] = useState({ file: null, title: '', description: '' });
    const [videoInputKey, setVideoInputKey] = useState(0);

    const [newAudios, setNewAudios] = useState([]);
    const [currentAudio, setCurrentAudio] = useState({ file: null, title: '' });
    const [audioInputKey, setAudioInputKey] = useState(0);

    const [newQuizQuestions, setNewQuizQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0
    });

    const [newTextbookPdf, setNewTextbookPdf] = useState(null);
    const [newTextbookPdfName, setNewTextbookPdfName] = useState('');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // ─── Load existing course ───────────────────────────────────────────────────
    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const res = await api.get('/instructor/my-courses');
                const course = res.data.courses.find(c => c._id === id);
                if (!course) {
                    setError('Course not found');
                    setLoading(false);
                    return;
                }
                setFormData({
                    title: course.title,
                    description: course.description,
                    price: course.price,
                    category: course.category || 'Programming',
                    duration: course.duration || '4 weeks'
                });
                setCurrentThumbnail(course.thumbnail || '');
                setExistingVideos(course.materials?.filter(m => m.type === 'video') || []);
                setExistingAudios(course.materials?.filter(m => m.type === 'audio') || []);
                setExistingQuizQuestions(course.quizQuestions || []);
                setExistingPdf(course.textbookPdf?.url ? course.textbookPdf : null);
            } catch (err) {
                setError('Failed to load course');
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
    }, [id]);

    // ─── Helpers ────────────────────────────────────────────────────────────────
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleThumbnailChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewThumbnail(file);
            setThumbnailPreview(URL.createObjectURL(file));
        }
    };

    // ─── Remove existing material immediately via API ────────────────────────────
    const handleRemoveExistingVideo = async (material) => {
        if (!window.confirm(`Remove video "${material.title}"?`)) return;
        try {
            await api.delete(`/instructor/courses/${id}/materials/${material._id}`);
            setExistingVideos(prev => prev.filter(v => v._id !== material._id));
        } catch (err) {
            alert('Failed to remove video. Please try again.');
        }
    };

    const handleRemoveExistingAudio = async (material) => {
        if (!window.confirm(`Remove audio "${material.title}"?`)) return;
        try {
            await api.delete(`/instructor/courses/${id}/materials/${material._id}`);
            setExistingAudios(prev => prev.filter(a => a._id !== material._id));
        } catch (err) {
            alert('Failed to remove audio. Please try again.');
        }
    };

    const handleRemoveExistingQuestion = async (question) => {
        if (!window.confirm('Remove this quiz question?')) return;
        try {
            await api.delete(`/instructor/courses/${id}/quiz/${question._id}`);
            setExistingQuizQuestions(prev => prev.filter(q => q._id !== question._id));
        } catch (err) {
            alert('Failed to remove quiz question. Please try again.');
        }
    };

    // ─── File content hash (detects same file even if renamed) ─────────────────
    const computeFileHash = async (file) => {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    };

    // ─── New video handling ─────────────────────────────────────────────────────
    const handleAddVideo = async () => {
        if (!currentVideo.file) {
            alert('⚠️ Please select a video file first.');
            return;
        }
        const hash = await computeFileHash(currentVideo.file);
        // Check same file content already queued (catches renames)
        const isDupNew = newVideos.some(v => v.hash === hash);
        if (isDupNew) {
            alert('❌ This video file has already been added (same content detected, even with a different name).');
            return;
        }
        // Check against existing videos by title (DB materials have no stored file hash)
        const isDupExisting = existingVideos.some(
            v => v.title.trim().toLowerCase() === (currentVideo.title || currentVideo.file.name).trim().toLowerCase()
        );
        if (isDupExisting) {
            alert(`❌ A video titled "${currentVideo.title || currentVideo.file.name}" already exists in this course.`);
            return;
        }
        setNewVideos([...newVideos, { ...currentVideo, hash }]);
        setCurrentVideo({ file: null, title: '', description: '' });
        setVideoInputKey(prev => prev + 1);
    };

    const handleRemoveNewVideo = (index) => setNewVideos(newVideos.filter((_, i) => i !== index));

    // ─── New audio handling ─────────────────────────────────────────────────────
    const handleAddAudio = async () => {
        if (!currentAudio.file) {
            alert('⚠️ Please select an audio file first.');
            return;
        }
        const hash = await computeFileHash(currentAudio.file);
        // Check same file content already queued (catches renames)
        const isDupNew = newAudios.some(a => a.hash === hash);
        if (isDupNew) {
            alert('❌ This audio file has already been added (same content detected, even with a different name).');
            return;
        }
        // Check against existing audio by title (DB materials have no stored file hash)
        const isDupExisting = existingAudios.some(
            a => a.title.trim().toLowerCase() === (currentAudio.title || currentAudio.file.name).trim().toLowerCase()
        );
        if (isDupExisting) {
            alert(`❌ An audio titled "${currentAudio.title || currentAudio.file.name}" already exists in this course.`);
            return;
        }
        setNewAudios([...newAudios, { ...currentAudio, hash }]);
        setCurrentAudio({ file: null, title: '' });
        setAudioInputKey(prev => prev + 1);
    };

    const handleRemoveNewAudio = (index) => setNewAudios(newAudios.filter((_, i) => i !== index));

    // ─── New quiz handling ──────────────────────────────────────────────────────
    const handleOptionChange = (index, value) => {
        const newOptions = [...currentQuestion.options];
        newOptions[index] = value;
        setCurrentQuestion({ ...currentQuestion, options: newOptions });
    };

    const handleAddQuestion = () => {
        if (!currentQuestion.question || !currentQuestion.options.every(opt => opt)) {
            alert('Please fill in the question and all 4 options');
            return;
        }
        const allQuestions = [...existingQuizQuestions, ...newQuizQuestions];

        // Duplicate question text check across existing + new
        const isDuplicateText = allQuestions.some(
            q => q.question.trim().toLowerCase() === currentQuestion.question.trim().toLowerCase()
        );
        if (isDuplicateText) {
            alert('A question with this text already exists. Please use a different question.');
            return;
        }

        // Duplicate options set check
        const isDuplicateOptions = allQuestions.some(q =>
            q.options.every((opt, i) =>
                opt.trim().toLowerCase() === currentQuestion.options[i].trim().toLowerCase()
            )
        );
        if (isDuplicateOptions) {
            alert('A question with the exact same options already exists.');
            return;
        }

        setNewQuizQuestions([...newQuizQuestions, currentQuestion]);
        setCurrentQuestion({ question: '', options: ['', '', '', ''], correctAnswer: 0 });
    };

    const handleRemoveNewQuestion = (index) => setNewQuizQuestions(newQuizQuestions.filter((_, i) => i !== index));

    // ─── Total quiz count ───────────────────────────────────────────────────────
    const totalQuizCount = existingQuizQuestions.length + newQuizQuestions.length;

    // ─── Submit ─────────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (totalQuizCount < 10) {
            alert(`Please ensure there are at least 10 quiz questions total. Currently: ${totalQuizCount}`);
            return;
        }

        setSaving(true);
        setError('');

        try {
            // Step 1: Update core metadata + optional thumbnail
            const courseData = new FormData();
            courseData.append('title', formData.title);
            courseData.append('description', formData.description);
            courseData.append('price', parseFloat(formData.price));
            courseData.append('category', formData.category);
            courseData.append('duration', formData.duration);
            if (newThumbnail) courseData.append('thumbnail', newThumbnail);

            await api.put(`/instructor/courses/${id}`, courseData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Step 2: Upload new videos
            for (const video of newVideos) {
                const videoData = new FormData();
                videoData.append('video', video.file);
                videoData.append('title', video.title || 'Video Material');
                if (video.description) videoData.append('description', video.description);
                await api.post(`/instructor/courses/${id}/upload-video`, videoData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            // Step 3: Upload new audio
            for (const audio of newAudios) {
                const audioData = new FormData();
                audioData.append('audio', audio.file);
                audioData.append('title', audio.title || 'Audio Material');
                await api.post(`/instructor/courses/${id}/upload-audio`, audioData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            // Step 4: Add new quiz questions
            for (const question of newQuizQuestions) {
                await api.post(`/instructor/courses/${id}/quiz`, question);
            }

            // Step 5: Upload new textbook PDF (optional, non-fatal)
            if (newTextbookPdf) {
                try {
                    const pdfData = new FormData();
                    pdfData.append('pdf', newTextbookPdf);
                    await api.post(`/instructor/courses/${id}/upload-textbook`, pdfData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                } catch (pdfErr) {
                    console.error('Textbook PDF upload failed (non-critical):', pdfErr);
                }
            }

            setMessage('Course updated successfully!');
            setTimeout(() => navigate('/instructor/my-courses'), 1800);
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Failed to update course';
            alert(`❌ Error: ${msg}`);
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    // ─── Render ─────────────────────────────────────────────────────────────────
    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

    const cardStyle = { marginBottom: '2rem' };
    const tagStyle = {
        display: 'inline-block', padding: '0.25rem 0.75rem',
        borderRadius: '4px', fontSize: '0.85rem',
        background: 'var(--bg-tertiary)', marginRight: '0.5rem', marginBottom: '0.5rem'
    };
    const rowStyle = {
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', padding: '0.6rem 0.8rem',
        background: 'var(--bg-tertiary)', borderRadius: '6px', marginBottom: '0.5rem'
    };

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✏️ Edit Course</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Changes to existing videos, audio, and quiz questions take effect immediately when you click ✕.
                New materials and metadata changes are saved when you click <strong>Save Changes</strong>.
            </p>

            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>

                {/* ── Course Info ── */}
                <div className="card" style={cardStyle}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>📚 Course Information</h2>

                    <div className="input-group">
                        <label>Course Title</label>
                        <input type="text" name="title" value={formData.title}
                            onChange={handleChange} required placeholder="Enter course title" />
                    </div>

                    <div className="input-group">
                        <label>Description</label>
                        <textarea name="description" value={formData.description}
                            onChange={handleChange} required rows="4" placeholder="Enter course description" />
                    </div>

                    <div className="input-group">
                        <label>Price (৳)</label>
                        <input type="number" name="price" value={formData.price}
                            onChange={handleChange} required min="0" placeholder="Enter price" />
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
                        <input type="text" name="duration" value={formData.duration}
                            onChange={handleChange} placeholder="e.g., 4 weeks" />
                    </div>
                </div>

                {/* ── Thumbnail ── */}
                <div className="card" style={cardStyle}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>🖼️ Thumbnail</h2>

                    {currentThumbnail && !thumbnailPreview && (
                        <div style={{ marginBottom: '1rem' }}>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                Current thumbnail:
                            </p>
                            <img src={currentThumbnail} alt="Current thumbnail"
                                style={{ maxWidth: '240px', borderRadius: '8px' }} />
                        </div>
                    )}

                    <div className="input-group">
                        <label>Upload New Thumbnail (optional)</label>
                        <input type="file" accept="image/*" onChange={handleThumbnailChange} />
                        {thumbnailPreview && (
                            <img src={thumbnailPreview} alt="New thumbnail preview"
                                style={{ maxWidth: '240px', marginTop: '1rem', borderRadius: '8px' }} />
                        )}
                    </div>
                </div>

                {/* ── Videos ── */}
                <div className="card" style={cardStyle}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>📹 Videos</h2>

                    {existingVideos.length > 0 && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                                Existing Videos ({existingVideos.length})
                            </h3>
                            {existingVideos.map(v => (
                                <div key={v._id} style={rowStyle}>
                                    <span>📹 {v.title}</span>
                                    <button type="button" onClick={() => handleRemoveExistingVideo(v)}
                                        className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', color: 'var(--danger, #e74c3c)' }}>
                                        ✕ Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Add New Video</h3>

                    <div className="input-group">
                        <label>Video Title</label>
                        <input type="text" value={currentVideo.title}
                            onChange={e => setCurrentVideo({ ...currentVideo, title: e.target.value })}
                            placeholder="Enter video title" />
                    </div>

                    <div className="input-group">
                        <label>Video Description / Notes (Optional)</label>
                        <textarea value={currentVideo.description}
                            onChange={e => setCurrentVideo({ ...currentVideo, description: e.target.value })}
                            placeholder="Add notes or description for this video..."
                            rows="3" style={{ minHeight: '80px' }} />
                        <small style={{ color: 'var(--text-muted)' }}>This text will appear below the video for learners</small>
                    </div>

                    <div className="input-group">
                        <label>Video File (MP4)</label>
                        <input key={videoInputKey} type="file" accept="video/*"
                            onChange={e => {
                                const file = e.target.files[0];
                                if (!file) return;
                                if (newVideos.some(v => v.file.name === file.name)) {
                                    alert(`❌ "${file.name}" has already been added to the upload queue.`);
                                    e.target.value = '';
                                    return;
                                }
                                if (existingVideos.some(v => v.title.trim().toLowerCase() === file.name.replace(/\.[^.]+$/, '').trim().toLowerCase())) {
                                    alert(`❌ A video matching "${file.name}" already exists in this course.`);
                                    e.target.value = '';
                                    return;
                                }
                                setCurrentVideo({ ...currentVideo, file });
                            }} />
                    </div>

                    <button type="button" onClick={handleAddVideo}
                        className="btn btn-secondary" disabled={!currentVideo.file}>
                        Add Video to Course
                    </button>

                    {newVideos.length > 0 && (
                        <div style={{ marginTop: '1rem' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
                                Queued to Upload ({newVideos.length})
                            </h3>
                            {newVideos.map((v, i) => (
                                <div key={i} style={rowStyle}>
                                    <span>📹 {v.title || v.file.name}</span>
                                    <button type="button" onClick={() => handleRemoveNewVideo(i)}
                                        className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem' }}>
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Audio ── */}
                <div className="card" style={cardStyle}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>🎵 Audio</h2>

                    {existingAudios.length > 0 && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                                Existing Audio ({existingAudios.length})
                            </h3>
                            {existingAudios.map(a => (
                                <div key={a._id} style={rowStyle}>
                                    <span>🎵 {a.title}</span>
                                    <button type="button" onClick={() => handleRemoveExistingAudio(a)}
                                        className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', color: 'var(--danger, #e74c3c)' }}>
                                        ✕ Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Add New Audio</h3>

                    <div className="input-group">
                        <label>Audio Title</label>
                        <input type="text" value={currentAudio.title}
                            onChange={e => setCurrentAudio({ ...currentAudio, title: e.target.value })}
                            placeholder="Enter audio title" />
                    </div>

                    <div className="input-group">
                        <label>Audio File (MP3)</label>
                        <input key={audioInputKey} type="file" accept="audio/*"
                            onChange={e => {
                                const file = e.target.files[0];
                                if (!file) return;
                                if (newAudios.some(a => a.file.name === file.name)) {
                                    alert(`❌ "${file.name}" has already been added to the upload queue.`);
                                    e.target.value = '';
                                    return;
                                }
                                if (existingAudios.some(a => a.title.trim().toLowerCase() === file.name.replace(/\.[^.]+$/, '').trim().toLowerCase())) {
                                    alert(`❌ An audio matching "${file.name}" already exists in this course.`);
                                    e.target.value = '';
                                    return;
                                }
                                setCurrentAudio({ ...currentAudio, file });
                            }} />
                    </div>

                    <button type="button" onClick={handleAddAudio}
                        className="btn btn-secondary" disabled={!currentAudio.file}>
                        Add Audio to Course
                    </button>

                    {newAudios.length > 0 && (
                        <div style={{ marginTop: '1rem' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
                                Queued to Upload ({newAudios.length})
                            </h3>
                            {newAudios.map((a, i) => (
                                <div key={i} style={rowStyle}>
                                    <span>🎵 {a.title || a.file.name}</span>
                                    <button type="button" onClick={() => handleRemoveNewAudio(i)}
                                        className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem' }}>
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Quiz ── */}
                <div className="card" style={cardStyle}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>📝 Quiz Questions</h2>

                    <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
                        ℹ️ Total quiz questions: <strong>{totalQuizCount}</strong>
                        {totalQuizCount < 10 && <span style={{ color: 'var(--danger, #e74c3c)' }}> (minimum 10 required)</span>}
                    </div>

                    {existingQuizQuestions.length > 0 && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                                Existing Questions ({existingQuizQuestions.length})
                            </h3>
                            {existingQuizQuestions.map((q, i) => (
                                <div key={q._id} style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '8px', marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontWeight: '600', marginBottom: '0.4rem' }}>
                                                {i + 1}. {q.question}
                                            </p>
                                            {q.options.map((opt, oi) => (
                                                <p key={oi} style={{
                                                    marginLeft: '1rem', fontSize: '0.88rem',
                                                    color: oi === q.correctAnswer ? 'var(--success)' : 'inherit',
                                                    fontWeight: oi === q.correctAnswer ? '600' : 'normal'
                                                }}>
                                                    {String.fromCharCode(65 + oi)}. {opt} {oi === q.correctAnswer && '✓'}
                                                </p>
                                            ))}
                                        </div>
                                        <button type="button" onClick={() => handleRemoveExistingQuestion(q)}
                                            className="btn btn-secondary"
                                            style={{ padding: '0.25rem 0.75rem', marginLeft: '1rem', color: 'var(--danger, #e74c3c)' }}>
                                            ✕ Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Add New Question</h3>

                    <div className="input-group">
                        <label>Question</label>
                        <input type="text" value={currentQuestion.question}
                            onChange={e => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                            placeholder="Enter your question" />
                    </div>

                    {currentQuestion.options.map((option, index) => (
                        <div key={index} className="input-group">
                            <label>Option {index + 1}</label>
                            <input type="text" value={option}
                                onChange={e => handleOptionChange(index, e.target.value)}
                                placeholder={`Enter option ${index + 1}`} />
                        </div>
                    ))}

                    <div className="input-group">
                        <label>Correct Answer</label>
                        <select value={currentQuestion.correctAnswer}
                            onChange={e => setCurrentQuestion({ ...currentQuestion, correctAnswer: parseInt(e.target.value) })}>
                            <option value={0}>Option 1</option>
                            <option value={1}>Option 2</option>
                            <option value={2}>Option 3</option>
                            <option value={3}>Option 4</option>
                        </select>
                    </div>

                    <button type="button" onClick={handleAddQuestion} className="btn btn-secondary">
                        Add Question
                    </button>

                    {newQuizQuestions.length > 0 && (
                        <div style={{ marginTop: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
                                New Questions to Add ({newQuizQuestions.length})
                            </h3>
                            {newQuizQuestions.map((q, i) => (
                                <div key={i} style={{ padding: '0.8rem', background: 'var(--bg-tertiary)', borderRadius: '8px', marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontWeight: '600', marginBottom: '0.3rem' }}>
                                                {existingQuizQuestions.length + i + 1}. {q.question}
                                            </p>
                                            {q.options.map((opt, oi) => (
                                                <p key={oi} style={{
                                                    marginLeft: '1rem', fontSize: '0.88rem',
                                                    color: oi === q.correctAnswer ? 'var(--success)' : 'inherit',
                                                    fontWeight: oi === q.correctAnswer ? '600' : 'normal'
                                                }}>
                                                    {String.fromCharCode(65 + oi)}. {opt} {oi === q.correctAnswer && '✓'}
                                                </p>
                                            ))}
                                        </div>
                                        <button type="button" onClick={() => handleRemoveNewQuestion(i)}
                                            className="btn btn-secondary"
                                            style={{ padding: '0.25rem 0.75rem', marginLeft: '1rem' }}>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Textbook PDF ── */}
                <div className="card" style={cardStyle}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>📖 Textbook PDF</h2>

                    {existingPdf && !newTextbookPdf && (
                        <div style={{ marginBottom: '1rem' }}>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                                Current PDF:
                            </p>
                            <span style={tagStyle}>📄 {existingPdf.filename || 'Uploaded PDF'}</span>
                        </div>
                    )}

                    <div className="input-group">
                        <label>Upload New / Replacement PDF (optional)</label>
                        <input type="file" accept=".pdf"
                            onChange={e => {
                                const file = e.target.files[0];
                                if (file) {
                                    setNewTextbookPdf(file);
                                    setNewTextbookPdfName(file.name);
                                }
                            }} />
                        {newTextbookPdfName && (
                            <small style={{ color: 'var(--success)', marginTop: '0.4rem', display: 'block' }}>
                                📄 Selected: {newTextbookPdfName}
                            </small>
                        )}
                    </div>
                </div>

                {/* ── Submit ── */}
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button type="button" onClick={() => navigate('/instructor/my-courses')}
                        className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                        Cancel
                    </button>
                    <button type="submit"
                        disabled={saving || totalQuizCount < 10}
                        className="btn btn-primary" style={{ flex: 1 }}>
                        {saving
                            ? 'Saving Changes...'
                            : totalQuizCount < 10
                                ? `Save Changes (Need ${10 - totalQuizCount} more quiz questions)`
                                : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditCourse;
