// frontend/src/pages/Login.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./Auth.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // ✅ Basic validation
    if (!email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      // ✅ Call backend directly
      const res = await axios.post(
        "http://127.0.0.1:5000/api/auth/login",
        {
          email,
          password,
        }
      );

      // ✅ Save token
      localStorage.setItem("token", res.data.access_token);

      console.log("LOGIN SUCCESS:", res.data);

      // ✅ Redirect to dashboard
      window.location.href = "/dashboard";

    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.error || "Login failed");
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Sign In</h1>
        <p>Welcome back! Please sign in to your account</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{" "}
          <Link to="/register">Create one here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;