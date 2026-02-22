import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Detail panel state
    const [activePanel, setActivePanel] = useState(null); // 'instructors' | 'learners' | 'courses'
    const [detailData, setDetailData] = useState([]);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        fetchData();
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

    const handleStatClick = async (panel) => {
        if (activePanel === panel) {
            setActivePanel(null);
            setDetailData([]);
            return;
        }
        setActivePanel(panel);
        setDetailLoading(true);
        try {
            const res = await api.get(`/admin/${panel}`);
            setDetailData(res.data[panel] || res.data.courses || []);
        } catch (err) {
            console.error(err);
        } finally {
            setDetailLoading(false);
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

            {/* LMS Balance */}
            <div className="card glass" style={{ marginBottom: '2rem', textAlign: 'center', padding: '2.5rem' }}>
                <h2 style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>LMS Balance</h2>
                <div style={{ fontSize: '3.5rem', fontWeight: '700', color: 'var(--success)' }}>
                    ৳{balance.toLocaleString()}
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    30% commission from course sales
                </p>
            </div>

            {/* Stat Cards — clickable */}
            {stats && (
                <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
                    {/* Instructors */}
                    <div
                        className="card glass"
                        style={{ textAlign: 'center', padding: '2rem', cursor: 'pointer', border: activePanel === 'instructors' ? '2px solid var(--primary-light)' : '2px solid transparent', transition: 'border 0.2s' }}
                        onClick={() => handleStatClick('instructors')}
                    >
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👨‍🏫</div>
                        <h3 style={{ fontSize: '2rem', color: 'var(--primary-light)' }}>{stats.totalInstructors}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Instructors</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            {activePanel === 'instructors' ? '▲ Hide' : '▼ View Details'}
                        </p>
                    </div>

                    {/* Learners */}
                    <div
                        className="card glass"
                        style={{ textAlign: 'center', padding: '2rem', cursor: 'pointer', border: activePanel === 'learners' ? '2px solid var(--primary-light)' : '2px solid transparent', transition: 'border 0.2s' }}
                        onClick={() => handleStatClick('learners')}
                    >
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👨‍🎓</div>
                        <h3 style={{ fontSize: '2rem', color: 'var(--primary-light)' }}>{stats.totalLearners}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Learners</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            {activePanel === 'learners' ? '▲ Hide' : '▼ View Details'}
                        </p>
                    </div>

                    {/* Courses */}
                    <div
                        className="card glass"
                        style={{ textAlign: 'center', padding: '2rem', cursor: 'pointer', border: activePanel === 'courses' ? '2px solid var(--primary-light)' : '2px solid transparent', transition: 'border 0.2s' }}
                        onClick={() => handleStatClick('courses')}
                    >
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📚</div>
                        <h3 style={{ fontSize: '2rem', color: 'var(--primary-light)' }}>{stats.totalCourses}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Total Courses</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            {activePanel === 'courses' ? '▲ Hide' : '▼ View Details'}
                        </p>
                    </div>
                </div>
            )}

            {/* Detail Panel */}
            {activePanel && (
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', textTransform: 'capitalize' }}>
                        {activePanel === 'instructors' && '👨‍🏫 All Instructors'}
                        {activePanel === 'learners' && '👨‍🎓 All Learners'}
                        {activePanel === 'courses' && '📚 All Courses'}
                    </h2>

                    {detailLoading ? (
                        <div className="loading-container"><div className="spinner"></div></div>
                    ) : detailData.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No data found.</p>
                    ) : (
                        <>
                            {/* Instructors List */}
                            {activePanel === 'instructors' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {detailData.map((inst, i) => (
                                        <div key={inst._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>👨‍🏫</div>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontWeight: '600', margin: 0 }}>{inst.name}</p>
                                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0' }}>{inst.email}</p>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
                                                    Joined: {new Date(inst.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{ background: 'var(--primary)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem' }}>
                                                    {inst.uploadedCourses?.length || 0} course{inst.uploadedCourses?.length !== 1 ? 's' : ''}
                                                </span>
                                                <p style={{ fontSize: '0.75rem', color: inst.bankAccount?.isSetup ? 'var(--success)' : 'var(--error)', marginTop: '0.4rem' }}>
                                                    {inst.bankAccount?.isSetup ? '✅ Bank set up' : '❌ No bank account'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Learners List */}
                            {activePanel === 'learners' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {detailData.map((learner) => (
                                        <div key={learner._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>👨‍🎓</div>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontWeight: '600', margin: 0 }}>{learner.name}</p>
                                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0' }}>{learner.email}</p>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
                                                    Joined: {new Date(learner.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{ background: 'var(--primary-light)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem' }}>
                                                    {learner.enrolledCourses?.length || 0} course{learner.enrolledCourses?.length !== 1 ? 's' : ''}
                                                </span>
                                                <p style={{ fontSize: '0.75rem', color: learner.bankAccount?.isSetup ? 'var(--success)' : 'var(--error)', marginTop: '0.4rem' }}>
                                                    {learner.bankAccount?.isSetup ? '✅ Bank set up' : '❌ No bank account'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Courses Grid */}
                            {activePanel === 'courses' && (
                                <div className="grid grid-2">
                                    {detailData.map((course) => (
                                        <div key={course._id} style={{ borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-tertiary)' }}>
                                            {/* Thumbnail */}
                                            <div style={{
                                                width: '100%',
                                                height: '160px',
                                                background: course.thumbnail
                                                    ? `url(${course.thumbnail}) center/cover no-repeat`
                                                    : 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '3rem'
                                            }}>
                                                {!course.thumbnail && '📚'}
                                            </div>
                                            {/* Info */}
                                            <div style={{ padding: '1rem' }}>
                                                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>{course.title}</h3>
                                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0.25rem 0' }}>
                                                    👨‍🏫 {course.instructorName || course.instructor?.name}
                                                </p>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.25rem 0' }}>
                                                    📂 {course.category} &nbsp;|&nbsp; 👥 {course.enrolledStudents?.length || 0} enrolled
                                                </p>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                                                    <span style={{ fontWeight: '700', color: 'var(--success)' }}>৳{course.price?.toLocaleString()}</span>
                                                    <span style={{
                                                        fontSize: '0.75rem',
                                                        padding: '0.2rem 0.6rem',
                                                        borderRadius: '20px',
                                                        background: course.isActive ? 'var(--success)' : 'var(--error)',
                                                        color: 'white'
                                                    }}>
                                                        {course.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Recent Transactions */}
            <div className="card">
                <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>Recent Transactions</h2>
                {transactions.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>No transactions yet</p>
                ) : (
                    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                        {transactions.map((tx) => (
                            <div
                                key={tx._id}
                                className="card"
                                style={{ marginBottom: '1rem', padding: '1rem', borderLeft: `4px solid ${getTransactionColor(tx.type)}` }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '1.5rem' }}>{getTransactionIcon(tx.type)}</span>
                                            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>
                                                {tx.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </h3>
                                        </div>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0.25rem 0' }}>{tx.description}</p>
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
                                        <div style={{ fontSize: '1.3rem', fontWeight: '700', color: getTransactionColor(tx.type) }}>
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
