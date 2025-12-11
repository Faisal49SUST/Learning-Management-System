import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const Earnings = () => {
    const [earnings, setEarnings] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const earningsRes = await api.get('/instructor/earnings');
            setEarnings(earningsRes.data.earnings);
            setTransactions(earningsRes.data.transactions || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Earnings Dashboard</h1>

            <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
                <div className="card glass" style={{ textAlign: 'center' }}>
                    <h4 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Upload Payments</h4>
                    <h2 style={{ fontSize: '2rem', color: 'var(--primary-light)' }}>৳{earnings?.uploadPayments?.toLocaleString() || 0}</h2>
                </div>
                <div className="card glass" style={{ textAlign: 'center' }}>
                    <h4 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Course Sales</h4>
                    <h2 style={{ fontSize: '2rem', color: 'var(--success)' }}>৳{earnings?.coursePayments?.toLocaleString() || 0}</h2>
                </div>
                <div className="card glass" style={{ textAlign: 'center' }}>
                    <h4 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total Earned</h4>
                    <h2 style={{ fontSize: '2rem', color: 'var(--accent)' }}>৳{earnings?.totalEarned?.toLocaleString() || 0}</h2>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Current Balance: ৳{earnings?.currentBalance?.toLocaleString() || 0}</h3>
            </div>

            <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Payment History</h2>
            {transactions.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                    <p>No transactions yet</p>
                </div>
            ) : (
                <div className="card">
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Type</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Course</th>
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>Amount</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((txn) => (
                                    <tr key={txn._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            {new Date(txn.createdAt).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {txn.type === 'course_upload_payment' ? (
                                                <span style={{ color: 'var(--primary-light)' }}>Course Upload</span>
                                            ) : (
                                                <span style={{ color: 'var(--success)' }}>Course Sale (70%)</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {txn.courseId?.title || 'N/A'}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '700', color: 'var(--success)' }}>
                                            ৳{txn.amount.toLocaleString()}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '12px',
                                                fontSize: '0.85rem',
                                                background: txn.status === 'completed' ? 'var(--success)' : 'var(--warning)',
                                                color: 'white'
                                            }}>
                                                {txn.status === 'completed' ? 'Received' : 'Pending'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Earnings;
