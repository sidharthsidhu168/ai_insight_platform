// frontend/src/components/Navbar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <h2>📊 DataInsights</h2>
        </div>

        <div className="navbar-links">
          <button
            className="nav-btn"
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </button>
          <button
            className="nav-btn"
            onClick={() => navigate('/insights')}
          >
            Insights
          </button>
        </div>

        <div className="navbar-user">
          <span className="user-name">👤 {user?.name}</span>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;