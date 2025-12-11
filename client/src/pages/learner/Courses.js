import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const Courses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await api.get('/courses');
            setCourses(res.data.courses);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <h1 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '2rem' }}>📚 Available Courses</h1>
            {courses.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <h3>No courses available</h3>
                </div>
            ) : (
                <div className="grid grid-3">
                    {courses.map((course) => (
                        <div key={course._id} className="card" onClick={() => navigate(`/learner/course/${course._id}`)} style={{ cursor: 'pointer', padding: 0, overflow: 'hidden' }}>
                            {/* Thumbnail */}
                            {course.thumbnail ? (
                                <img
                                    src={course.thumbnail}
                                    alt={course.title}
                                    style={{
                                        width: '100%',
                                        height: '180px',
                                        objectFit: 'cover'
                                    }}
                                />
                            ) : (
                                <div style={{
                                    width: '100%',
                                    height: '180px',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '4rem'
                                }}>
                                    📚
                                </div>
                            )}

                            {/* Course Info */}
                            <div style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <span className="badge badge-primary">{course.category}</span>
                                </div>
                                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>{course.title}</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>{course.description}</p>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                    <div>👨‍🏫 {course.instructorName}</div>
                                    <div>⏱️ {course.duration}</div>
                                    <div>👥 {course.enrolledStudents?.length || 0} students</div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)' }}>৳{course.price}</span>
                                    <button className="btn btn-primary" style={{ padding: '0.6rem 1.2rem' }}>View</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Courses;
