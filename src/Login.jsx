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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

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
        background: 'var(--bg-main)',
        padding: '24px',
        fontFamily: "'Sora', sans-serif",
      }}
    >
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <h1
          style={{
            textAlign: 'center',
            fontSize: '24px',
            fontWeight: 700,
            marginBottom: '6px',
            color: 'var(--text-main)',
            letterSpacing: '-0.3px',
          }}
        >
          Study Tracker
        </h1>
        <p
          style={{
            textAlign: 'center',
            color: 'var(--text-muted)',
            marginBottom: '32px',
            fontSize: '14px',
          }}
        >
          {isRegister ? 'Create a new account' : 'Login to your account'}
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ marginBottom: '12px' }}
          />

          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ marginBottom: '20px' }}
          />

          <button
            type="submit"
            className="primary-btn"
            style={{ width: '100%', marginBottom: '18px', padding: '13px' }}
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

        <p
          style={{
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '13px',
          }}
        >
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <span
            onClick={() => {
              setIsRegister(!isRegister);
              setMessage('');
            }}
            style={{
              color: 'var(--text-main)',
              cursor: 'pointer',
              fontWeight: 600,
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
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
              color: message.toLowerCase().includes('success')
                ? 'var(--text-main)'
                : 'var(--danger)',
              fontSize: '13px',
            }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}