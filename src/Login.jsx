import React, { useState } from 'react';

const BACKEND_URL = 'https://my-study-backend.onrender.com/api/auth';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1 = email, 2 = otp
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const sendCode = async () => {
    if (!email) return setMessage('Please enter your email');
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(`${BACKEND_URL}/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send code');

      setMessage('OTP sent to your email!');
      setStep(2);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!otp) return setMessage('Please enter OTP');
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(`${BACKEND_URL}/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');

      // Save token
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0B0F19'
    }}>
      <div className="stats-container" style={{ maxWidth: '420px', width: '100%' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>Study Tracker</h2>
        <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '28px' }}>
          Login with Email OTP
        </p>

        {step === 1 ? (
          <>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ marginBottom: '16px' }}
            />
            <button
              className="primary-btn"
              style={{ width: '100%' }}
              onClick={sendCode}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Login Code'}
            </button>
          </>
        ) : (
          <>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '12px' }}>
              Code sent to <strong>{email}</strong>
            </p>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              maxLength={6}
              style={{ marginBottom: '16px', letterSpacing: '4px', fontSize: '18px' }}
            />
            <button
              className="primary-btn"
              style={{ width: '100%', marginBottom: '12px' }}
              onClick={verifyCode}
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            <button
              className="secondary-btn"
              style={{ width: '100%' }}
              onClick={() => { setStep(1); setOtp(''); setMessage(''); }}
            >
              Change Email
            </button>
          </>
        )}

        {message && (
          <p style={{
            marginTop: '18px',
            textAlign: 'center',
            color: message.includes('sent') || message.includes('success') ? '#00ffcc' : '#ff6b6b',
            fontSize: '14px'
          }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}