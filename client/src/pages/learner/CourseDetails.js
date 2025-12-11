import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const CourseDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const [secret, setSecret] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCourse();
    }, [id]);

    const fetchCourse = async () => {
        try {
            const res = await api.get(`/courses/${id}`);
            setCourse(res.data.course);
        } catch (err) {
            setError('Failed to load course');
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (e) => {
        e.preventDefault();
        setPurchasing(true);
        setError('');
        try {
            const res = await api.post(`/learner/purchase/${id}`, { secret });
            setMessage(res.data.message);
            setTimeout(() => navigate('/learner/my-courses'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Purchase failed');
        } finally {
            setPurchasing(false);
        }
    };

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;
    if (!course) return <div className="container"><div className="alert alert-error">Course not found</div></div>;

    return (
        <div className="container" style={{ padding: '2rem 0', minHeight: 'calc(100vh - 80px)' }}>
            <div className="card fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <span className="badge badge-primary">{course.category}</span>
                    <h1 style={{ fontSize: '2rem', margin: '1rem 0' }}>{course.title}</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>{course.description}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem', padding: '1rem 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', margin: '1.5rem 0' }}>
                    <div><strong>Instructor:</strong> {course.instructorName}</div>
                    <div><strong>Duration:</strong> {course.duration}</div>
                    <div><strong>Students:</strong> {course.enrolledStudents?.length || 0}</div>
                    <div><strong>Price:</strong> <span style={{ color: 'var(--success)', fontSize: '1.2rem', fontWeight: '700' }}>৳{course.price}</span></div>
                </div>

                {message && <div className="alert alert-success">{message}</div>}
                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handlePurchase}>
                    <div className="input-group">
                        <label>Enter your bank secret PIN to purchase</label>
                        <input type="password" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Your secret PIN" required />
                    </div>
                    <button type="submit" className="btn btn-primary btn-block" disabled={purchasing}>
                        {purchasing ? 'Processing...' : `Purchase for ৳${course.price}`}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CourseDetails;
