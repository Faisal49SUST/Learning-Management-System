import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getHomeRoute = () => {
        if (!user) return '/';
        if (user.role === 'learner') return '/learner/home';
        if (user.role === 'instructor') return '/instructor/dashboard';
        if (user.role === 'admin') return '/admin/dashboard';
        return '/';
    };

    const handleLogoClick = (e) => {
        const homeRoute = getHomeRoute();

        // If already on the home page, scroll to top
        if (location.pathname === homeRoute) {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
        // Otherwise, navigate normally (Link will handle it)
    };

    return (
        <nav className="navbar">
            <div className={`navbar-container ${!user ? 'navbar-centered' : ''}`}>
                <Link to={getHomeRoute()} className="navbar-logo" onClick={handleLogoClick}>
                    <img src="/lms-logo.png" alt="LMS Platform" />
                </Link>

                {user && (
                    <div className="navbar-menu">
                        <div className="user-info">
                            <span className="user-name">{user.name}</span>
                            <span className="user-role">({user.role})</span>
                        </div>
                        <button onClick={handleLogout} className="btn-logout">Logout</button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
