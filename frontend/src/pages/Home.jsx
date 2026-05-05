// frontend/src/pages/Home.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="home-container">
      <div className="home-content">
        <h1>Welcome to DataInsights</h1>
        <p>Upload your data and discover powerful AI-driven insights</p>

        <div className="features">
          <div className="feature">
            <span className="icon">📊</span>
            <h3>Data Analysis</h3>
            <p>Analyze your datasets with advanced statistics</p>
          </div>
          <div className="feature">
            <span className="icon">📈</span>
            <h3>Trend Analysis</h3>
            <p>Visualize trends and patterns in your data</p>
          </div>
          <div className="feature">
            <span className="icon">🤖</span>
            <h3>ML Insights</h3>
            <p>Get clustering, anomalies, and predictions</p>
          </div>
        </div>

        <div className="home-actions">
          <button
            className="btn btn-primary"
            onClick={() => navigate('/login')}
          >
            Sign In
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/register')}
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;