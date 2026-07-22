import React, { useState, useEffect } from 'react';
import './App.css';                          // ← yeh line important hai
import StudyTracker from './components/StudyTracker.jsx';
import Login from './Login.jsx';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <>
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 100 }}>
        <button className="secondary-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <StudyTracker />
    </>
  );
}

export default App;