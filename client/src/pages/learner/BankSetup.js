import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const BankSetup = () => {
    const [formData, setFormData] = useState({
        accountNumber: '',
        secret: ''
    });
    const [bankAccount, setBankAccount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        checkBankAccount();
    }, []);

    const checkBankAccount = async () => {
        try {
            const res = await api.get('/bank/account');
            if (res.data.success && res.data.account) {
                setBankAccount(res.data.account);
            }
        } catch (err) {
            // No account yet or error
            console.log('No bank account found:', err.response?.status);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        try {
            const res = await api.post('/bank/account', formData);
            setMessage('Bank account created successfully!');
            setBankAccount(res.data.account);
            setTimeout(() => navigate('/learner/home'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create bank account');
        }
    };

    if (loading) {
        return <div className="loading-container"><div className="spinner"></div></div>;
    }

    if (bankAccount) {
        return (
            <div className="container" style={{ padding: '2rem 0' }}>
                <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>💳 Bank Account</h1>

                    <div style={{ padding: '1.5rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Account Holder</label>
                            <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>{bankAccount.accountHolderName}</p>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Account Number</label>
                            <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>{bankAccount.accountNumber}</p>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Current Balance</label>
                            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)' }}>৳{bankAccount.balance?.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
                        ✅ Your bank account is set up! You can now purchase courses.
                    </div>

                    <button
                        onClick={() => navigate('/learner/home')}
                        className="btn btn-primary btn-block"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>💳 Setup Bank Account</h1>

                <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
                    ℹ️ You need to set up a bank account to purchase courses.
                </div>

                {message && <div className="alert alert-success">{message}</div>}
                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Account Number</label>
                        <input
                            type="text"
                            name="accountNumber"
                            value={formData.accountNumber}
                            onChange={handleChange}
                            placeholder="Enter your account number"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Account Secret/PIN</label>
                        <input
                            type="password"
                            name="secret"
                            value={formData.secret}
                            onChange={handleChange}
                            placeholder="Create a secret for transactions"
                            required
                        />
                        <small style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            This will be used to authorize transactions
                        </small>
                    </div>

                    <button type="submit" className="btn btn-primary btn-block">
                        Create Bank Account
                    </button>
                </form>
            </div>
        </div>
    );
};

export default BankSetup;
