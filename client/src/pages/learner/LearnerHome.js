import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import './LearnerHome.css';

const LearnerHome = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        enrolledCourses: 0,
        completedCourses: 0,
        certificates: 0
    });
    const [recentCourses, setRecentCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [coursesRes, certificatesRes] = await Promise.all([
                api.get('/courses/enrolled'),
                api.get('/certificates/my-certificates')
            ]);

            const courses = coursesRes.data.courses || [];
            const certificates = certificatesRes.data.certificates || [];

            setStats({
                enrolledCourses: courses.length,
                completedCourses: courses.filter(c => c.completed).length,
                certificates: certificates.length
            });

            setRecentCourses(courses.slice(0, 3));
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Welcome back, {user?.name}! 👋</h1>

            <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
                <div className="card glass" onClick={() => navigate('/learner/my-courses')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📚</div>
                    <h3 style={{ fontSize: '2rem', color: 'var(--primary-light)' }}>{stats.enrolledCourses}</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Enrolled Courses</p>
                </div>
                <div className="card glass" onClick={() => navigate('/learner/my-courses?filter=completed')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✅</div>
                    <h3 style={{ fontSize: '2rem', color: 'var(--primary-light)' }}>{stats.completedCourses}</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Completed Courses</p>
                </div>
                <div className="card glass" onClick={() => navigate('/learner/certificates')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏆</div>
                    <h3 style={{ fontSize: '2rem', color: 'var(--success)' }}>{stats.certificates}</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Certificates Earned</p>
                </div>
            </div>

            <div className="grid grid-2">
                <div className="card" onClick={() => navigate('/learner/courses')} style={{ cursor: 'pointer', textAlign: 'center', padding: '2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                    <h3>Browse Courses</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Explore available courses</p>
                </div>
                <div className="card" onClick={() => navigate('/learner/bank-setup')} style={{ cursor: 'pointer', textAlign: 'center', padding: '2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💳</div>
                    <h3>Bank Account</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Setup or view your bank details</p>
                </div>
            </div>

            {recentCourses.length > 0 && (
                <div className="recent-courses" style={{ marginTop: '3rem' }}>
                    <h2>Continue Learning</h2>
                    <div className="courses-grid">
                        {recentCourses.map(course => (
                            <Link
                                key={course._id}
                                to={`/learner/course/${course.courseId?._id || course._id}`}
                                className="course-card"
                            >
                                <div className="course-image">
                                    {course.courseId?.thumbnail || course.thumbnail ? (
                                        <img
                                            src={course.courseId?.thumbnail || course.thumbnail}
                                            alt={course.courseId?.title || course.title}
                                        />
                                    ) : (
                                        <div className="placeholder-image">📚</div>
                                    )}
                                </div>
                                <div className="course-info">
                                    <h3>{course.courseId?.title || course.title}</h3>
                                    <p className="course-instructor">By {course.courseId?.instructorName || course.instructor?.name}</p>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${course.completed ? 100 : 0}%` }}
                                        ></div>
                                    </div>
                                    <p className="progress-text">{course.completed ? 100 : 0}% Complete</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LearnerHome;
