import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import StudyTracker from './components/StudyTracker.jsx';
import Login from './Login.jsx';

const AUTH_URL = 'https://my-study-backend.onrender.com/api/auth';


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  const dropdownRef = useRef(null);
  const userEmail = localStorage.getItem('userEmail');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) setIsLoggedIn(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLoginSuccess = () => setIsLoggedIn(true);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    setIsLoggedIn(false);
    setShowProfileDropdown(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setMessage('Please fill all fields');
      return;
    }

    try {
      const res = await fetch(`${AUTH_URL}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          currentPassword,
          newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');

      setMessage('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => {
        setShowChangePassword(false);
        setMessage('');
      }, 1500);
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch(`${AUTH_URL}/delete-account`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');

      localStorage.removeItem('token');
      localStorage.removeItem('userEmail');
      setIsLoggedIn(false);
    } catch (err) {
      alert(err.message);
    }
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <>
      {/* Profile Button */}
      <div ref={dropdownRef} style={{ position: 'fixed', top: 20, right: 20, zIndex: 100 }}>
        <button
          onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          style={{
            background: 'rgba(26, 32, 53, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '10px 14px',
            color: 'white',
            fontSize: '18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            backdropFilter: 'blur(10px)'
          }}
        >
          👤
        </button>

        {showProfileDropdown && (
          <div
            style={{
              position: 'absolute',
              top: '110%',
              right: 0,
              minWidth: '260px',
              background: 'rgba(26, 32, 53, 0.97)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '14px',
              padding: '16px',
              boxShadow: '0 15px 40px rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(12px)',
              zIndex: 200
            }}
          >
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
              Logged in as
            </div>
            <div style={{ fontSize: '14px', color: '#00ffcc', fontWeight: 600, marginBottom: '16px', wordBreak: 'break-all' }}>
              {userEmail}
            </div>

            <button
              onClick={() => {
                setShowChangePassword(true);
                setShowProfileDropdown(false);
                setMessage('');
              }}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '8px',
                background: 'rgba(108, 99, 255, 0.15)',
                color: '#a5b4fc',
                border: '1px solid #6c63ff',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Change Password
            </button>

            <button
              onClick={() => {
                setShowDeleteConfirm(true);
                setShowProfileDropdown(false);
              }}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '8px',
                background: 'rgba(255, 68, 68, 0.1)',
                color: '#ff6b6b',
                border: '1px solid #ff6b6b',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Delete Account
            </button>

            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#e2e8f0',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="modal-overlay" onClick={() => setShowChangePassword(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '20px' }}>Change Password</h3>

            <input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              style={{ marginBottom: '12px' }}
            />
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              style={{ marginBottom: '16px' }}
            />

            {message && (
              <p style={{ color: message.includes('success') ? '#00ffcc' : '#ff6b6b', marginBottom: '12px', fontSize: '14px' }}>
                {message}
              </p>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="secondary-btn" style={{ flex: 1 }} onClick={() => setShowChangePassword(false)}>
                Cancel
              </button>
              <button className="primary-btn" style={{ flex: 1 }} onClick={handleChangePassword}>
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirm */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#ff6b6b', marginBottom: '12px' }}>Delete Account?</h3>
            <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
              This will permanently delete your account and all study data. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="secondary-btn" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                style={{
                  background: '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <StudyTracker />
    </>
  );
}

export default App;