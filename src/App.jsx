import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import StudyTracker from './components/StudyTracker.jsx';
import Login from './Login.jsx';
import About from './About.jsx';
import Contact from './Contact.jsx';

const AUTH_URL = 'https://my-study-backend.onrender.com/api/auth'
// Production: 'https://my-study-backend.onrender.com/api/auth'
// Local : 'http://localhost:500/api/auth';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard'); // dashboard | about | contact

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showHamburger, setShowHamburger] = useState(false);
  const [showRateUs, setShowRateUs] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  const dropdownRef = useRef(null);
  const hamburgerRef = useRef(null);
  const userEmail = localStorage.getItem('userEmail');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) setIsLoggedIn(true);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
      if (hamburgerRef.current && !hamburgerRef.current.contains(event.target)) {
        setShowHamburger(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLoginSuccess = () => setIsLoggedIn(true);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    setIsLoggedIn(false);
    setShowProfileDropdown(false);
    setCurrentPage('dashboard');
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
        body: JSON.stringify({ email: userEmail, currentPassword, newPassword })
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
      setCurrentPage('dashboard');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRateSubmit = () => {
    if (rating === 0) return;
    alert(`Thanks for rating us ${rating} star${rating > 1 ? 's' : ''}!`);
    setShowRateUs(false);
    setRating(0);
  };

  const scrollToSection = (id) => {
    if (currentPage !== 'dashboard') {
      setCurrentPage('dashboard');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return;
    }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-layout">
      {/* ==================== HEADER ==================== */}
      <header className="app-header">
        <div className="header-left">
          <div ref={hamburgerRef} style={{ position: 'relative' }}>
            <button className="hamburger-btn" onClick={() => setShowHamburger(!showHamburger)}>
              <span></span>
              <span></span>
              <span></span>
            </button>

            {showHamburger && (
              <div className="hamburger-dropdown">
                <button onClick={() => { setCurrentPage('about'); setShowHamburger(false); }}>
                  About
                </button>
                <button onClick={() => { setCurrentPage('contact'); setShowHamburger(false); }}>
                  Contact Us
                </button>
                <button onClick={() => { setShowRateUs(true); setShowHamburger(false); }}>
                  Rate Us
                </button>
              </div>
            )}
          </div>

          <div
            className="logo"
            onClick={() => setCurrentPage('dashboard')}
            style={{ cursor: 'pointer' }}
          >
            Study Tracker
          </div>
        </div>

        <nav className="header-nav">
          <button onClick={() => scrollToSection('section-timer')}>Timer</button>
          <button onClick={() => scrollToSection('section-progress')}>Today</button>
          <button onClick={() => scrollToSection('section-tasks')}>Tasks</button>
          <button onClick={() => scrollToSection('section-heatmap')}>Heatmap</button>
          <button onClick={() => scrollToSection('section-analytics')}>Analytics</button>
        </nav>

        <div className="header-right" ref={dropdownRef}>
          <button className="theme-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <button className="profile-btn" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
            👤
          </button>

          {showProfileDropdown && (
            <div className="profile-dropdown">
              <div className="profile-email-label">Logged in as</div>
              <div className="profile-email">{userEmail}</div>

              <button
                className="dropdown-item"
                onClick={() => {
                  setShowChangePassword(true);
                  setShowProfileDropdown(false);
                  setMessage('');
                }}
              >
                Change Password
              </button>

              <button
                className="dropdown-item danger"
                onClick={() => {
                  setShowDeleteConfirm(true);
                  setShowProfileDropdown(false);
                }}
              >
                Delete Account
              </button>

              <button className="dropdown-item" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ==================== MAIN ==================== */}
      <main className="app-main">
        {currentPage === 'about' && (
          <About onBack={() => setCurrentPage('dashboard')} />
        )}
        {currentPage === 'contact' && (
          <Contact onBack={() => setCurrentPage('dashboard')} />
        )}
        {currentPage === 'dashboard' && <StudyTracker />}
      </main>

      {/* ==================== FOOTER ==================== */}
      <footer className="app-footer">
        © 2026 Study Tracker. All rights reserved.
      </footer>

      {/* ==================== MODALS ==================== */}

      {showChangePassword && (
        <div className="modal-overlay" onClick={() => setShowChangePassword(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
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
              <p style={{
                color: message.includes('success') ? 'var(--text-main)' : 'var(--danger)',
                marginBottom: '12px',
                fontSize: '13px'
              }}>
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

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 style={{ color: 'var(--danger)', marginBottom: '12px' }}>Delete Account?</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
              This will permanently delete your account and all study data. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="secondary-btn" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                style={{
                  background: 'var(--danger)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 24px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'Sora, sans-serif'
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showRateUs && (
        <div className="modal-overlay" onClick={() => setShowRateUs(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '8px' }}>Rate Us</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
              How would you rate your experience?
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '28px' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '34px',
                    cursor: 'pointer',
                    color: (hoverRating || rating) >= star ? '#fbbf24' : 'var(--text-muted)',
                    transition: 'all 0.15s',
                    transform: (hoverRating || rating) >= star ? 'scale(1.15)' : 'scale(1)',
                    padding: '4px'
                  }}
                >
                  ★
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="secondary-btn" style={{ flex: 1 }} onClick={() => setShowRateUs(false)}>
                Cancel
              </button>
              <button className="primary-btn" style={{ flex: 1 }} onClick={handleRateSubmit} disabled={rating === 0}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;