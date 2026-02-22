import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import Quiz from './Quiz';

const MyCourses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showQuiz, setShowQuiz] = useState(false);
    const [selectedCourseId, setSelectedCourseId] = useState(null);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const filter = searchParams.get('filter'); // 'completed' or null

    useEffect(() => {
        fetchMyCourses();
    }, []);

    const fetchMyCourses = async () => {
        try {
            const res = await api.get('/learner/my-courses');
            setCourses(res.data.courses);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = (courseId) => {
        setSelectedCourseId(courseId);
        setShowQuiz(true);
    };

    const handleQuizPass = () => {
        setShowQuiz(false);
        setSelectedCourseId(null);
        fetchMyCourses();
    };

    const handleQuizClose = () => {
        setShowQuiz(false);
        setSelectedCourseId(null);
    };

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

    // Filter courses based on URL parameter
    const filteredCourses = filter === 'completed'
        ? courses.filter(c => c.completed)
        : courses;

    const pageTitle = filter === 'completed' ? 'Completed Courses' : 'My Enrolled Courses';

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <h1 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '2rem' }}>{pageTitle}</h1>
            {filteredCourses.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <h3>{filter === 'completed' ? 'No completed courses yet' : 'No courses enrolled yet'}</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        {filter === 'completed' ? 'Complete a course to see it here' : 'Browse courses and start learning'}
                    </p>
                    {filter === 'completed' ? (
                        <button className="btn btn-primary" onClick={() => navigate('/learner/my-courses')}>
                            Go to My Enrolled Courses
                        </button>
                    ) : (
                        <button className="btn btn-primary" onClick={() => navigate('/learner/courses')}>
                            Browse Courses
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-2">
                    {filteredCourses.map((ec) => (
                        <div key={ec._id} className="card" style={{ overflow: 'hidden', padding: 0 }}>
                            {/* Thumbnail Image */}
                            <div style={{
                                width: '100%',
                                height: '200px',
                                background: ec.courseId?.thumbnail
                                    ? `url(${ec.courseId.thumbnail})`
                                    : 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '3rem',
                                fontWeight: 'bold'
                            }}>
                                {!ec.courseId?.thumbnail && '📚'}
                            </div>

                            {/* Course Info */}
                            <div style={{ padding: '1.5rem' }}>
                                <h3 style={{ marginBottom: '0.5rem' }}>{ec.courseId?.title || 'Course'}</h3>
                                <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0', fontSize: '0.9rem' }}>
                                    Enrolled: {new Date(ec.enrolledAt).toLocaleDateString()}
                                </p>

                                {ec.completed ? (
                                    <div>
                                        <span className="badge badge-success">Completed</span>
                                        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                            Completed on {new Date(ec.completedAt).toLocaleDateString()}
                                        </p>
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => navigate(`/learner/course-content/${ec.courseId._id}`)}
                                                style={{ flex: 1 }}
                                            >
                                                Course Contents
                                            </button>
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => navigate('/learner/certificates')}
                                                style={{ flex: 1 }}
                                            >
                                                View Certificate
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <span className="badge badge-warning">In Progress</span>
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => navigate(`/learner/course-content/${ec.courseId._id}`)}
                                                style={{ flex: 1 }}
                                            >
                                                Course Contents
                                            </button>
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => handleComplete(ec.courseId._id)}
                                                style={{ flex: 1 }}
                                            >
                                                Mark as Completed
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showQuiz && selectedCourseId && (
                <Quiz
                    courseId={selectedCourseId}
                    onClose={handleQuizClose}
                    onPass={handleQuizPass}
                />
            )}
        </div>
    );
};

export default MyCourses;
