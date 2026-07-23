import React, { useState } from 'react';

const BACKEND_URL = 'https://my-study-backend.onrender.com/api/auth';

export default function Login({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setMessage('Please fill all fields');
      return;
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setMessage('');

    const endpoint = isRegister ? '/register' : '/login';

    try {
      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Save token + email
      localStorage.setItem('token', data.token);
      localStorage.setItem('userEmail', data.email);

      onLoginSuccess();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0B0F19',
        padding: '20px',
      }}
    >
      <div className="stats-container" style={{ maxWidth: '420px', width: '100%' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '6px' }}>Study Tracker</h2>
        <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '28px' }}>
          {isRegister ? 'Create a new account' : 'Login to your account'}
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ marginBottom: '14px' }}
          />

          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ marginBottom: '18px' }}
          />

          <button
            type="submit"
            className="primary-btn"
            style={{ width: '100%', marginBottom: '16px' }}
            disabled={loading}
          >
            {loading
              ? isRegister
                ? 'Creating Account...'
                : 'Logging in...'
              : isRegister
              ? 'Register'
              : 'Login'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <span
            onClick={() => {
              setIsRegister(!isRegister);
              setMessage('');
            }}
            style={{
              color: '#00ffcc',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {isRegister ? 'Login' : 'Register'}
          </span>
        </p>

        {message && (
          <p
            style={{
              marginTop: '18px',
              textAlign: 'center',
              color: message.includes('success') ? '#00ffcc' : '#ff6b6b',
              fontSize: '14px',
            }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}