import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const InstructorStudents = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const res = await api.get('/instructor/students');
            setStudents(res.data.students || []);
        } catch (err) {
            console.error('Error fetching students:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>My Students</h1>

            {students.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <h3>No students enrolled yet</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Students will appear here when they enroll in your courses</p>
                </div>
            ) : (
                <div className="card">
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Student Name</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Course</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Enrolled Date</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <strong>{student.studentName}</strong>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                            {student.studentEmail}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {student.courseTitle}
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                            {new Date(student.enrolledAt).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '12px',
                                                fontSize: '0.85rem',
                                                background: student.completed ? 'var(--success)' : 'var(--warning)',
                                                color: 'white'
                                            }}>
                                                {student.completed ? 'Completed' : 'In Progress'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                            Total Students: <strong>{students.length}</strong>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InstructorStudents;
