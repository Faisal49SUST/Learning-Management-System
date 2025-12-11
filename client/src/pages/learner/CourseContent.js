import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import AudioPlayer from '../../components/AudioPlayer';
import './CourseContent.css';

const CourseContent = () => {
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('videos');
    const navigate = useNavigate();

    useEffect(() => {
        fetchCourseContent();
    }, [courseId]);

    const fetchCourseContent = async () => {
        try {
            const res = await api.get(`/learner/courses/${courseId}/content`);
            console.log('Course data:', res.data.course);
            console.log('Videos:', res.data.course.materials?.filter(m => m.type === 'video'));
            console.log('Audios:', res.data.course.materials?.filter(m => m.type === 'audio'));
            console.log('Textbook PDF:', res.data.course.textbookPdf);
            console.log('PDF URL exists?', !!res.data.course.textbookPdf?.url);
            console.log('PDF URL value:', res.data.course.textbookPdf?.url);
            setCourse(res.data.course);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to load course content');
            navigate('/learner/my-courses');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPdf = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/learner/courses/${courseId}/download-pdf`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                alert(error.message || 'Failed to download PDF');
                return;
            }

            // Create blob from response
            const blob = await response.blob();

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = course.textbookPdf?.filename || 'textbook.pdf';
            document.body.appendChild(a);
            a.click();

            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Download error:', err);
            alert('Failed to download PDF');
        }
    };

    if (loading) {
        return <div className="loading-container"><div className="spinner"></div></div>;
    }

    if (!course) {
        return <div className="container" style={{ padding: '2rem 0' }}>Course not found</div>;
    }

    const videos = course.materials?.filter(m => m.type === 'video') || [];
    const audios = course.materials?.filter(m => m.type === 'audio') || [];

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <button onClick={() => navigate('/learner/my-courses')} className="btn btn-secondary" style={{ marginBottom: '1rem' }}>
                ← Back to My Courses
            </button>

            <div className="card" style={{ marginBottom: '2rem' }}>
                {course.thumbnail && (
                    <img
                        src={course.thumbnail}
                        alt={course.title}
                        style={{
                            width: '100%',
                            maxHeight: '400px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            marginBottom: '1.5rem'
                        }}
                    />
                )}
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{course.title}</h1>
                <p style={{ color: 'var(--text-secondary)' }}>{course.description}</p>
            </div>

            <div className="course-content-tabs">
                <button
                    className={`tab-btn ${activeTab === 'videos' ? 'active' : ''}`}
                    onClick={() => setActiveTab('videos')}
                >
                    📹 Videos ({videos.length})
                </button>
                <button
                    className={`tab-btn ${activeTab === 'audios' ? 'active' : ''}`}
                    onClick={() => setActiveTab('audios')}
                >
                    🎵 Audios ({audios.length})
                </button>
                {course.textbookPdf?.url && (
                    <button
                        className={`tab-btn ${activeTab === 'textbook' ? 'active' : ''}`}
                        onClick={() => setActiveTab('textbook')}
                    >
                        📖 Textbook PDF
                    </button>
                )}
            </div>

            <div className="card">
                {activeTab === 'videos' && (
                    <div>
                        {videos.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>📹</p>
                                <p>No videos available for this course</p>
                            </div>
                        ) : (
                            <div className="media-list">
                                {videos.map((video, index) => (
                                    <div key={video._id || index} className="media-item">
                                        <div className="media-header">
                                            <span className="media-icon">📹</span>
                                            <h3>{video.title}</h3>
                                        </div>
                                        <video
                                            controls
                                            style={{
                                                width: '100%',
                                                maxHeight: '500px',
                                                borderRadius: '8px',
                                                marginTop: '1rem'
                                            }}
                                        >
                                            <source src={video.content} type="video/mp4" />
                                            Your browser does not support the video tag.
                                        </video>
                                        {video.description && (
                                            <div style={{
                                                marginTop: '1rem',
                                                padding: '1rem',
                                                background: 'var(--bg-tertiary)',
                                                borderRadius: '8px',
                                                borderLeft: '3px solid var(--primary)',
                                                whiteSpace: 'pre-wrap',
                                                lineHeight: '1.6'
                                            }}>
                                                <strong style={{ color: 'var(--primary-light)', fontSize: '0.9rem' }}>📝 Notes:</strong>
                                                <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-primary)' }}>
                                                    {video.description}
                                                </p>
                                            </div>
                                        )}
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                            Uploaded: {new Date(video.uploadedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'audios' && (
                    <div>
                        {audios.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎵</p>
                                <p>No audio files available for this course</p>
                            </div>
                        ) : (
                            <div className="media-list">
                                {audios.map((audio, index) => (
                                    <div key={audio._id || index} className="media-item">
                                        <div className="media-header">
                                            <span className="media-icon">🎵</span>
                                            <h3>{audio.title}</h3>
                                        </div>
                                        <AudioPlayer
                                            src={audio.content}
                                            title={audio.title}
                                            uploadedAt={audio.uploadedAt}
                                        />
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                            Uploaded: {new Date(audio.uploadedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'textbook' && (
                    <div>
                        {!course.textbookPdf?.url ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>📖</p>
                                <p>No textbook PDF available for this course</p>
                            </div>
                        ) : (
                            <div style={{ padding: '2rem' }}>
                                <div style={{
                                    marginTop: '2rem',
                                    padding: '2rem',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: '12px',
                                    textAlign: 'center',
                                    border: '2px dashed var(--border-color)'
                                }}>
                                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📄</div>
                                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Textbook PDF</h3>
                                    <p style={{ fontSize: '1rem', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                                        Download the course textbook in PDF format
                                    </p>
                                    <button
                                        onClick={() => handleDownloadPdf()}
                                        className="btn btn-primary"
                                        style={{ display: 'inline-block', fontSize: '1.1rem', padding: '0.75rem 2rem' }}
                                    >
                                        📥 For PDF download click here
                                    </button>
                                    <p style={{ fontSize: '0.9rem', marginTop: '1rem', color: 'var(--text-muted)' }}>
                                        {course.textbookPdf.filename || 'textbook.pdf'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseContent;
