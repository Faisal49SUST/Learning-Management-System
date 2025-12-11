import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
        // Refresh every 10 seconds
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [balanceRes, transactionsRes, statsRes] = await Promise.all([
                api.get('/admin/balance'),
                api.get('/admin/transactions?limit=20'),
                api.get('/admin/stats')
            ]);

            setBalance(balanceRes.data.balance);
            setTransactions(transactionsRes.data.transactions);
            setStats(statsRes.data.stats);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getTransactionIcon = (type) => {
        switch (type) {
            case 'course_purchase': return '🛒';
            case 'instructor_payment': return '💸';
            case 'course_upload_payment': return '📤';
            case 'lms_commission': return '💰';
            default: return '📝';
        }
    };

    const getTransactionColor = (type) => {
        switch (type) {
            case 'course_purchase': return 'var(--success)';
            case 'instructor_payment': return 'var(--warning)';
            case 'course_upload_payment': return 'var(--info)';
            case 'lms_commission': return 'var(--primary)';
            default: return 'var(--text-secondary)';
        }
    };

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>🏛️ Admin Dashboard</h1>

            {/* LMS Balance Card - Full Width First Row */}
            <div className="card glass" style={{ marginBottom: '2rem', textAlign: 'center', padding: '2.5rem' }}>
                <h2 style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    LMS Balance
                </h2>
                <div style={{ fontSize: '3.5rem', fontWeight: '700', color: 'var(--success)' }}>
                    ৳{balance.toLocaleString()}
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    30% commission from course sales
                </p>
            </div>

            {/* Platform Statistics - 2 Cards Per Row */}
            {stats && (
                <div className="grid grid-2" style={{ marginBottom: '2rem' }}>
                    <div className="card glass" style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👨‍🏫</div>
                        <h3 style={{ fontSize: '2rem', color: 'var(--primary-light)' }}>{stats.totalInstructors}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Instructors</p>
                    </div>
                    <div className="card glass" style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👨‍🎓</div>
                        <h3 style={{ fontSize: '2rem', color: 'var(--primary-light)' }}>{stats.totalLearners}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Learners</p>
                    </div>
                    <div className="card glass" style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📚</div>
                        <h3 style={{ fontSize: '2rem', color: 'var(--primary-light)' }}>{stats.totalCourses}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Total Courses</p>
                    </div>
                </div>
            )}

            {/* Recent Transactions */}
            <div className="card">
                <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>Recent Transactions</h2>

                {transactions.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                        No transactions yet
                    </p>
                ) : (
                    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                        {transactions.map((tx) => (
                            <div
                                key={tx._id}
                                className="card"
                                style={{
                                    marginBottom: '1rem',
                                    padding: '1rem',
                                    borderLeft: `4px solid ${getTransactionColor(tx.type)}`
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '1.5rem' }}>{getTransactionIcon(tx.type)}</span>
                                            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>
                                                {tx.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </h3>
                                        </div>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0.25rem 0' }}>
                                            {tx.description}
                                        </p>
                                        {tx.userId && (
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0' }}>
                                                User: {tx.userId.name} ({tx.userId.role})
                                            </p>
                                        )}
                                        {tx.courseId && (
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0' }}>
                                                Course: {tx.courseId.title}
                                            </p>
                                        )}
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                            {new Date(tx.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{
                                            fontSize: '1.3rem',
                                            fontWeight: '700',
                                            color: getTransactionColor(tx.type)
                                        }}>
                                            ৳{tx.amount.toLocaleString()}
                                        </div>
                                        <div style={{
                                            fontSize: '0.75rem',
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '4px',
                                            background: tx.status === 'completed' ? 'var(--success)' : 'var(--warning)',
                                            color: 'white',
                                            marginTop: '0.5rem'
                                        }}>
                                            {tx.status}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
