import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const InstructorDashboard = () => {
    const [stats, setStats] = useState({ courses: 0, students: 0, earnings: 0 });
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [coursesRes, earningsRes] = await Promise.all([
                api.get('/instructor/my-courses'),
                api.get('/instructor/earnings')
            ]);
            setCourses(coursesRes.data.courses);
            const totalStudents = coursesRes.data.courses.reduce((sum, c) => sum + (c.enrolledStudents?.length || 0), 0);
            setStats({
                courses: coursesRes.data.count,
                students: totalStudents,
                earnings: earningsRes.data.earnings.totalEarned
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Instructor Dashboard</h1>

            <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
                <div className="card glass" onClick={() => navigate('/instructor/my-courses')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📚</div>
                    <h3 style={{ fontSize: '2rem', color: 'var(--primary-light)' }}>{stats.courses}</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Courses</p>
                </div>
                <div className="card glass" onClick={() => navigate('/instructor/students')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👥</div>
                    <h3 style={{ fontSize: '2rem', color: 'var(--primary-light)' }}>{stats.students}</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Students</p>
                </div>
                <div className="card glass" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💰</div>
                    <h3 style={{ fontSize: '2rem', color: 'var(--success)' }}>৳{stats.earnings.toLocaleString()}</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Total Earnings</p>
                </div>
            </div>

            <div className="grid grid-3">
                <div className="card" onClick={() => navigate('/instructor/upload')} style={{ cursor: 'pointer', textAlign: 'center', padding: '2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>➕</div>
                    <h3>Upload New Course</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Create and publish a new course</p>
                </div>
                <div className="card" onClick={() => navigate('/instructor/earnings')} style={{ cursor: 'pointer', textAlign: 'center', padding: '2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💵</div>
                    <h3>View Earnings</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Check your earnings and payments</p>
                </div>
                <div className="card" onClick={() => navigate('/instructor/bank-setup')} style={{ cursor: 'pointer', textAlign: 'center', padding: '2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💳</div>
                    <h3>Bank Account</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Setup or view your bank details</p>
                </div>
            </div>

            <h2 style={{ fontSize: '1.8rem', margin: '2rem 0 1rem' }}>Recent Courses</h2>
            {courses.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                    <p>No courses yet. Upload your first course!</p>
                </div>
            ) : (
                <div className="grid grid-2">
                    {courses.slice(0, 4).map((course) => (
                        <div key={course._id} className="card" style={{ overflow: 'hidden' }}>
                            {/* Course Thumbnail */}
                            <div style={{ width: '100%', height: '180px', overflow: 'hidden' }}>
                                {course.thumbnail ? (
                                    <img
                                        src={course.thumbnail}
                                        alt={course.title}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '100%',
                                        height: '100%',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '4rem'
                                    }}>
                                        📚
                                    </div>
                                )}
                            </div>

                            {/* Course Info */}
                            <div style={{ padding: '1.5rem' }}>
                                <h3>{course.title}</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{course.description}</p>
                                <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    <div>Price: ৳{course.price}</div>
                                    <div>Students: {course.enrolledStudents?.length || 0}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default InstructorDashboard;
