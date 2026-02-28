import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const InstructorCourses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await api.get('/instructor/my-courses');
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
            <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>My Courses</h1>
            {courses.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <h3>No courses uploaded yet</h3>
                </div>
            ) : (
                <div className="grid grid-2">
                    {courses.map((course) => (
                        <div key={course._id} className="card" style={{ overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column' }}>
                            {/* Thumbnail */}
                            <div style={{
                                width: '100%',
                                height: '200px',
                                background: course.thumbnail
                                    ? `url(${course.thumbnail})`
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
                                {!course.thumbnail && '📚'}
                            </div>

                            {/* Course Info */}
                            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <span className="badge badge-primary">{course.category}</span>
                                    <span className={`badge ${course.isActive ? 'badge-success' : 'badge-warning'}`}>
                                        {course.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>{course.title}</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                    {course.description}
                                </p>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                    <div>Price: ৳{course.price}</div>
                                    <div>Students: {course.enrolledStudents?.length || 0}</div>
                                    <div>Materials: {course.materials?.length || 0}</div>
                                    <div>Quiz Questions: {course.quizQuestions?.length || 0}</div>
                                </div>
                                <button
                                    onClick={() => navigate(`/instructor/edit-course/${course._id}`)}
                                    className="btn btn-primary"
                                    style={{ width: '100%', marginTop: 'auto' }}
                                >
                                    ✏️ Edit Course
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default InstructorCourses;
