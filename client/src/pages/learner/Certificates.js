import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const Certificates = () => {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCertificates();
    }, []);

    const fetchCertificates = async () => {
        try {
            const res = await api.get('/learner/certificates');
            setCertificates(res.data.certificates);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <h1 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '2rem' }}>🏆 My Certificates</h1>
            {certificates.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <h3>No certificates yet</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Complete courses to earn certificates</p>
                </div>
            ) : (
                <div className="grid grid-2">
                    {certificates.map((cert) => (
                        <div key={cert._id} className="card" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(236,72,153,0.1) 100%)', border: '2px solid var(--primary)' }}>
                            <div style={{ textAlign: 'center', padding: '1.5rem' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Certificate of Completion</h2>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>This certifies that</p>
                                <h3 style={{ fontSize: '1.3rem', color: 'var(--primary-light)', marginBottom: '1rem' }}>{cert.userName}</h3>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>has successfully completed</p>
                                <h4 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>{cert.courseTitle}</h4>
                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', marginTop: '1rem' }}>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Certificate ID: {cert.certificateId}</p>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Issued: {new Date(cert.issuedDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Certificates;
