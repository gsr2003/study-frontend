import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff66b2', '#66ff66'];

const getTodayDate = () => new Date().toLocaleDateString('en-GB');

const BACKEND_URL = 'https://my-study-backend.onrender.com/api/study-data';

export default function StudyTracker() {
  // 🔥 Get logged-in user email
  const userEmail = localStorage.getItem('userEmail');

  const [coursesList, setCoursesList] = useState(() => {
    const saved = localStorage.getItem('studyTrackerCourses');
    return saved ? JSON.parse(saved) : ['Communication', 'CS Fundamentals', 'DEV', 'DSA', 'Extras', 'AI'];
  });

  const [selectedCourse, setSelectedCourse] = useState(coursesList[0] || '');
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [dailyData, setDailyData] = useState({});
  const [completedTasksData, setCompletedTasksData] = useState({});
  const [currentTasks, setCurrentTasks] = useState(() => {
    const saved = localStorage.getItem('studyTasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [newTaskInputStr, setNewTaskInputStr] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [showMedalsDropdown, setShowMedalsDropdown] = useState(false);
  const [showInfoDropdown, setShowInfoDropdown] = useState(false);
  const [showMedalModal, setShowMedalModal] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [historyYear, setHistoryYear] = useState(new Date().getFullYear());
  const [historyMonth, setHistoryMonth] = useState('all');

  const [manualCourse, setManualCourse] = useState(coursesList[0] || '');
  const [manualMinutes, setManualMinutes] = useState('');

  const availableYears = [2026, 2025, 2024, 2023, 2022];

  // 🔥 Fetch only this user's data
  useEffect(() => {
    if (!userEmail) {
      setIsLoading(false);
      return;
    }

    fetch(`${BACKEND_URL}?email=${userEmail}`)
      .then(res => res.json())
      .then(dbData => {
        const formattedData = {};
        const formattedTasks = {};
        dbData.forEach(item => {
          formattedData[item.date] = item.coursesData || {};
          formattedTasks[item.date] = item.completedTasks || [];
        });
        setDailyData(formattedData);
        setCompletedTasksData(formattedTasks);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [userEmail]);

  useEffect(() => {
    let timer;
    if (isRunning) timer = setInterval(() => setTime(p => p + 1), 1000);
    return () => clearInterval(timer);
  }, [isRunning]);

  useEffect(() => {
    localStorage.setItem('studyTrackerCourses', JSON.stringify(coursesList));
  }, [coursesList]);

  useEffect(() => {
    localStorage.setItem('studyTasks', JSON.stringify(currentTasks));
  }, [currentTasks]);

  // 🔥 Save with email
  const saveTimeToCloud = async (courseName, minutesToAdd) => {
    if (!userEmail) return;

    const dateToUse = selectedDate;
    let updatedTodayData = {};

    setDailyData(prev => {
      const todayData = prev[dateToUse] || {};
      coursesList.forEach(c => {
        if (todayData[c] === undefined) todayData[c] = 0;
      });
      updatedTodayData = {
        ...todayData,
        [courseName]: (todayData[courseName] || 0) + minutesToAdd
      };
      return { ...prev, [dateToUse]: updatedTodayData };
    });

    try {
      await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          date: dateToUse,
          coursesData: updatedTodayData
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const endSession = async () => {
    setIsRunning(false);
    const mins = Math.ceil(time / 60);
    if (mins > 0 && selectedCourse) {
      await saveTimeToCloud(selectedCourse, mins);
    }
    setTime(0);
  };

  const handleManualSubmit = () => {
    const mins = parseInt(manualMinutes, 10);
    if (isNaN(mins) || mins <= 0) {
      alert('Enter valid minutes!');
      return;
    }
    saveTimeToCloud(manualCourse, mins);
    setManualMinutes('');
  };

  const handleAddNewTask = () => {
    if (newTaskInputStr.trim()) {
      setCurrentTasks([...currentTasks, newTaskInputStr.trim()]);
      setNewTaskInputStr('');
    }
  };

  // 🔥 Complete task with email
  const handleCompleteTask = (taskText) => {
    if (!userEmail) return;

    const dateToUse = selectedDate;
    setCurrentTasks(prev => prev.filter(t => t !== taskText));

    setCompletedTasksData(prev => {
      const list = [...(prev[dateToUse] || []), taskText];
      fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          date: dateToUse,
          completedTasks: list
        })
      });
      return { ...prev, [dateToUse]: list };
    });
  };

  // 🔥 Delete only this user's data
  const handleDeleteAllData = async () => {
    if (!userEmail) return;

    try {
      const res = await fetch(`${BACKEND_URL}/all?email=${userEmail}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Delete failed');
      setDailyData({});
      setCompletedTasksData({});
      setShowDeleteAllConfirm(false);
      alert('All study data deleted successfully!');
    } catch (e) {
      alert('Failed to delete all data. Check backend.');
    }
  };

  const formatTime = (s) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  const formatMinutesToHrMin = (total) => {
    if (!total) return '0 Min';
    const h = Math.floor(total / 60);
    const m = total % 60;
    return h ? `${h} Hr ${m} Min` : `${m} Min`;
  };

  const toInputDate = (gb) => {
    if (!gb) return '';
    const [d, m, y] = gb.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  };

  const fromInputDate = (iso) => {
    if (!iso) return getTodayDate();
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  // Safety check
  if (!userEmail) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: '#ff6b6b',
        fontSize: '20px'
      }}>
        Please login again
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: '#00ffcc',
        fontSize: '22px'
      }}>
        Loading Dashboard...
      </div>
    );
  }

  const today = selectedDate;
  const todayData = dailyData[today] || {};
  const totalTodayMinutes = Object.values(todayData).reduce((a, b) => a + b, 0);
  const totalHours = totalTodayMinutes / 60;

  let medal = 'Keep Going!';
  let medalEmoji = '💪';
  let hasMedal = false;

  if (totalHours >= 10) {
    medal = 'Diamond';
    medalEmoji = '💎';
    hasMedal = true;
  } else if (totalHours >= 8) {
    medal = 'Gold';
    medalEmoji = '🥇';
    hasMedal = true;
  } else if (totalHours >= 6) {
    medal = 'Silver';
    medalEmoji = '🥈';
    hasMedal = true;
  } else if (totalHours >= 4) {
    medal = 'Bronze';
    medalEmoji = '🥉';
    hasMedal = true;
  }

  const lineChartData = Object.keys(dailyData).map(date => {
    const mins = Object.values(dailyData[date]).reduce((a, b) => a + b, 0);
    return { date, hours: Number((mins / 60).toFixed(2)) };
  });

  const overallTotals = {};
  coursesList.forEach(c => (overallTotals[c] = 0));
  Object.values(dailyData).forEach(day => {
    Object.keys(day).forEach(c => {
      overallTotals[c] = (overallTotals[c] || 0) + day[c];
    });
  });

  const pieChartData = Object.keys(overallTotals)
    .map(c => ({ name: c, value: overallTotals[c] }))
    .filter(d => d.value > 0);

  const getDayColorStyle = (dateStr) => {
    const dayRecord = dailyData[dateStr];
    if (!dayRecord) {
      return { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' };
    }
    const hrs = Object.values(dayRecord).reduce((a, b) => a + b, 0) / 60;
    if (hrs < 4) return { background: '#ff5555', boxShadow: '0 0 6px rgba(255,85,85,0.4)' };
    if (hrs < 6) return { background: '#cd7f32', boxShadow: '0 0 6px rgba(205,127,50,0.4)' };
    if (hrs < 8) return { background: '#c0c0c0', boxShadow: '0 0 6px rgba(192,192,192,0.4)' };
    if (hrs < 10) return { background: '#ffd700', boxShadow: '0 0 8px rgba(255,215,0,0.5)' };
    return { background: '#b9f2ff', boxShadow: '0 0 10px rgba(185,242,255,0.6)' };
  };

  const getYearlyTotalMins = () => {
    let total = 0;
    Object.keys(dailyData).forEach(d => {
      if (parseInt(d.split('/')[2]) === selectedYear) {
        total += Object.values(dailyData[d]).reduce((a, b) => a + b, 0);
      }
    });
    return total;
  };

  const medalCounts = Object.keys(dailyData).reduce(
    (acc, d) => {
      if (parseInt(d.split('/')[2]) !== selectedYear) return acc;
      const hrs = Object.values(dailyData[d]).reduce((a, b) => a + b, 0) / 60;
      if (hrs >= 10) acc.diamond++;
      else if (hrs >= 8) acc.gold++;
      else if (hrs >= 6) acc.silver++;
      else if (hrs >= 4) acc.bronze++;
      return acc;
    },
    { diamond: 0, gold: 0, silver: 0, bronze: 0 }
  );

  const yearlyHours = Number((getYearlyTotalMins() / 60).toFixed(1));

  const filteredHistoryDates = Object.keys(dailyData)
    .filter(date => {
      const [, m, y] = date.split('/');
      if (parseInt(y) !== historyYear) return false;
      if (historyMonth !== 'all' && parseInt(m) !== parseInt(historyMonth)) return false;
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.split('/').reverse().join('-')) -
        new Date(a.split('/').reverse().join('-'))
    );

  // ==================== HISTORY VIEW ====================
  if (showHistory) {
    return (
      <div className="main-wrapper">
        <div className="stats-container" style={{ width: '100%', maxWidth: '1050px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ margin: 0 }}>All Time Study History</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="secondary-btn" onClick={() => setShowHistory(false)}>← Back</button>
              <button
                onClick={() => setShowDeleteAllConfirm(true)}
                style={{
                  background: 'rgba(255,68,68,0.15)',
                  color: '#ff6b6b',
                  border: '1px solid #ff6b6b',
                  borderRadius: '12px',
                  padding: '10px 18px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                🗑 Delete All
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <select value={historyYear} onChange={e => setHistoryYear(Number(e.target.value))} style={{ width: '130px' }}>
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={historyMonth} onChange={e => setHistoryMonth(e.target.value)} style={{ width: '150px' }}>
              <option value="all">All Months</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2025, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <table className="stats-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Total Time</th>
                <th>Course Breakdown</th>
                <th>Tasks</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistoryDates.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No data for selected filters
                  </td>
                </tr>
              ) : (
                filteredHistoryDates.map(date => {
                  const total = Object.values(dailyData[date] || {}).reduce((a, b) => a + b, 0);
                  return (
                    <tr key={date}>
                      <td>{date}</td>
                      <td className="total-row">{formatMinutesToHrMin(total)}</td>
                      <td>
                        {Object.keys(dailyData[date] || {}).map(c =>
                          dailyData[date][c] > 0 ? (
                            <div key={c} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px' }}>
                              <span>{c}: {formatMinutesToHrMin(dailyData[date][c])}</span>
                            </div>
                          ) : null
                        )}
                      </td>
                      <td style={{ fontSize: '13px', color: '#00ffcc' }}>
                        {(completedTasksData[date] || []).join(', ') || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {showDeleteAllConfirm && (
          <div className="modal-overlay" onClick={() => setShowDeleteAllConfirm(false)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <h3 style={{ color: '#ff6b6b', marginBottom: '12px' }}>Delete All Data?</h3>
              <p style={{ color: '#94a3b8', marginBottom: '24px' }}>This cannot be undone.</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button className="secondary-btn" onClick={() => setShowDeleteAllConfirm(false)}>Cancel</button>
                <button
                  onClick={handleDeleteAllData}
                  style={{
                    background: '#ff4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 24px',
                    fontWeight: 600
                  }}
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==================== MAIN DASHBOARD ====================
  return (
    <div className="main-wrapper">
      <div className="top-section">
        {/* Timer Card */}
        <div className="tracker-container">
          <h2>Study Dashboard</h2>
          <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
            {coursesList.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="timer-display">{formatTime(time)}</div>
          <div className="buttons">
            <button className="primary-btn" onClick={() => setIsRunning(!isRunning)}>
              {isRunning ? 'Pause' : 'Start'}
            </button>
            <button className="secondary-btn" onClick={() => { setIsRunning(false); setTime(0); }}>
              Reset
            </button>
          </div>
          <button className="save-btn" onClick={endSession}>SESSION OVER (SAVE TIME)</button>
          <button className="history-btn" onClick={() => setShowHistory(true)}>View All Data History</button>
        </div>

        {/* Today's Progress */}
        <div className="stats-container">
          <h2>Today's Progress</h2>

          <div style={{ marginBottom: '18px' }}>
            <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              Select Date
            </label>
            <input
              type="date"
              className="date-input"
              value={toInputDate(selectedDate)}
              onChange={e => setSelectedDate(fromInputDate(e.target.value))}
            />
          </div>

          <table className="stats-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Time Studied</th>
              </tr>
            </thead>
            <tbody>
              {coursesList.map(course => (
                <tr key={course}>
                  <td>{course}</td>
                  <td>{formatMinutesToHrMin(todayData[course] || 0)}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td>Total Hrs</td>
                <td>{formatMinutesToHrMin(totalTodayMinutes)}</td>
              </tr>
            </tbody>
          </table>

          <div style={{
            marginTop: '22px',
            padding: '16px',
            background: 'rgba(0,0,0,0.25)',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <h4 style={{ marginBottom: '12px', color: '#00ffcc', fontSize: '13px', letterSpacing: '0.5px' }}>
              + MANUAL ENTRY
            </h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select value={manualCourse} onChange={e => setManualCourse(e.target.value)} style={{ flex: 1 }}>
                {coursesList.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Mins"
                value={manualMinutes}
                onChange={e => setManualMinutes(e.target.value)}
                style={{ width: '80px' }}
              />
              <button className="primary-btn" onClick={handleManualSubmit} style={{ margin: 0, padding: '10px 16px' }}>
                Add
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '22px',
          width: '100%',
          maxWidth: '480px'
        }}>
          {/* Today's Medal */}
          <div
            className="stats-container medal-card"
            onClick={() => setShowMedalModal(true)}
            style={{ cursor: 'pointer', textAlign: 'center', padding: '32px 24px' }}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#94a3b8', fontWeight: 500, letterSpacing: '0.5px' }}>
              Today's Medal
            </h3>
            <div style={{ fontSize: '68px', margin: '8px 0 14px', lineHeight: 1 }}>
              {medalEmoji}
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: 700,
              marginBottom: '6px',
              color: hasMedal
                ? (medal === 'Diamond' ? '#b9f2ff' : medal === 'Gold' ? '#ffd700' : medal === 'Silver' ? '#e0e0e0' : '#cd7f32')
                : '#94a3b8'
            }}>
              {medal}
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Click for message</p>
          </div>

          {/* Tasks */}
          <div className="stats-container" style={{ flex: 1 }}>
            <h2>Tasks for the Day</h2>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <input
                type="text"
                value={newTaskInputStr}
                onChange={e => setNewTaskInputStr(e.target.value)}
                placeholder="What needs to be done?"
                onKeyDown={e => e.key === 'Enter' && handleAddNewTask()}
              />
              <button className="primary-btn" style={{ margin: 0, whiteSpace: 'nowrap' }} onClick={handleAddNewTask}>
                Add
              </button>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {currentTasks.map((t, idx) => (
                <li key={idx} className="task-item">
                  <span>{t}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="task-btn success" onClick={() => handleCompleteTask(t)}>✓</button>
                    <button className="task-btn danger" onClick={() => setCurrentTasks(prev => prev.filter(x => x !== t))}>✕</button>
                  </div>
                </li>
              ))}
              {currentTasks.length === 0 && (
                <li style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0', fontSize: '14px' }}>
                  No pending tasks 🎉
                </li>
              )}
            </ul>

            {completedTasksData[today]?.length > 0 && (
              <div style={{ marginTop: '22px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <h4 style={{ color: '#00ffcc', marginBottom: '10px', fontSize: '13px' }}>✓ Completed</h4>
                {completedTasksData[today].map((ct, i) => (
                  <div key={i} style={{
                    padding: '8px 12px',
                    background: 'rgba(0,255,204,0.06)',
                    borderRadius: '8px',
                    marginBottom: '6px',
                    color: '#94a3b8',
                    textDecoration: 'line-through',
                    fontSize: '13px'
                  }}>
                    {ct}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================== HEATMAP ==================== */}
      <div className="graph-card heatmap-card">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '22px',
          flexWrap: 'wrap'
        }}>
          <select
            className="year-select"
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
          >
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <button className="secondary-btn heatmap-btn">
            Total Hrs : {yearlyHours}
          </button>

          <div style={{ position: 'relative' }}>
            <button
              className="primary-btn heatmap-btn"
              onClick={() => {
                setShowMedalsDropdown(!showMedalsDropdown);
                setShowInfoDropdown(false);
              }}
            >
              Medals ▾
            </button>
            {showMedalsDropdown && (
              <div className="dropdown-panel">
                <div className="dropdown-title">Medals Won in {selectedYear}</div>
                <div className="medal-row"><span>💎 Diamond</span><strong>{medalCounts.diamond}</strong></div>
                <div className="medal-row"><span>🥇 Gold</span><strong>{medalCounts.gold}</strong></div>
                <div className="medal-row"><span>🥈 Silver</span><strong>{medalCounts.silver}</strong></div>
                <div className="medal-row"><span>🥉 Bronze</span><strong>{medalCounts.bronze}</strong></div>
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <button
              className="info-btn"
              onClick={() => {
                setShowInfoDropdown(!showInfoDropdown);
                setShowMedalsDropdown(false);
              }}
              title="Color Legend"
            >
              ℹ️
            </button>
            {showInfoDropdown && (
              <div className="dropdown-panel" style={{ minWidth: '220px' }}>
                <div className="dropdown-title">Color Legend</div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.15)' }}></div>
                  Empty (no study)
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: '#ff5555' }}></div>
                  &lt; 4 Hours
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: '#cd7f32' }}></div>
                  Bronze (4–6 hrs)
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: '#c0c0c0' }}></div>
                  Silver (6–8 hrs)
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: '#ffd700' }}></div>
                  Gold (8–10 hrs)
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: '#b9f2ff' }}></div>
                  Diamond (10+ hrs)
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Continuous GitHub-style heatmap */}
        {(() => {
          const year = selectedYear;
          const firstDay = new Date(year, 0, 1);
          const lastDay = new Date(year, 11, 31);

          const start = new Date(firstDay);
          start.setDate(start.getDate() - start.getDay());

          const weeks = [];
          let current = new Date(start);

          while (current <= lastDay || current.getDay() !== 0) {
            const week = [];
            for (let i = 0; i < 7; i++) {
              week.push(new Date(current));
              current.setDate(current.getDate() + 1);
            }
            weeks.push(week);
            if (current > lastDay && current.getDay() === 0) break;
          }

          const monthLabels = [];
          let lastMonth = -1;
          weeks.forEach((week, weekIndex) => {
            week.forEach(day => {
              if (day.getFullYear() === year) {
                const m = day.getMonth();
                if (m !== lastMonth) {
                  monthLabels.push({
                    month: day.toLocaleString('en-US', { month: 'short' }),
                    weekIndex
                  });
                  lastMonth = m;
                }
              }
            });
          });

          return (
            <div style={{ overflowX: 'auto', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', marginLeft: '32px', marginBottom: '6px', position: 'relative', height: '18px' }}>
                {monthLabels.map((label, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: `${label.weekIndex * 15}px`,
                      fontSize: '11px',
                      color: '#94a3b8',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {label.month}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '3px' }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                  marginRight: '6px',
                  fontSize: '10px',
                  color: '#94a3b8',
                  paddingTop: '2px'
                }}>
                  <div style={{ height: '12px' }}></div>
                  <div style={{ height: '12px', lineHeight: '12px' }}>Mon</div>
                  <div style={{ height: '12px' }}></div>
                  <div style={{ height: '12px', lineHeight: '12px' }}>Wed</div>
                  <div style={{ height: '12px' }}></div>
                  <div style={{ height: '12px', lineHeight: '12px' }}>Fri</div>
                  <div style={{ height: '12px' }}></div>
                </div>

                <div style={{ display: 'flex', gap: '3px' }}>
                  {weeks.map((week, wIndex) => (
                    <div key={wIndex} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {week.map((day, dIndex) => {
                        const isCurrentYear = day.getFullYear() === year;
                        if (!isCurrentYear) {
                          return <div key={dIndex} style={{ width: '12px', height: '12px' }}></div>;
                        }

                        const dateStr = day.toLocaleDateString('en-GB');
                        const style = getDayColorStyle(dateStr);
                        const mins = dailyData[dateStr]
                          ? Object.values(dailyData[dateStr]).reduce((a, b) => a + b, 0)
                          : 0;

                        return (
                          <div
                            key={dIndex}
                            title={`${dateStr}: ${formatMinutesToHrMin(mins)}`}
                            style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '2px',
                              cursor: 'pointer',
                              transition: 'transform 0.15s',
                              ...style
                            }}
                            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.35)')}
                            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                            onClick={() => setSelectedDate(dateStr)}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Charts */}
      <div className="graphs-section">
        <div className="graph-card">
          <h3>Daily Total Study Hours</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip contentStyle={{ background: '#1e1e2f', border: '1px solid #444' }} />
                <Line type="monotone" dataKey="hours" stroke="#00ffcc" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="graph-card">
          <h3>Overall Time Distribution</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieChartData} cx="50%" cy="50%" outerRadius={100} dataKey="value">
                  {pieChartData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e1e2f', border: '1px solid #444' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Medal Modal */}
      {showMedalModal && (
        <div className="modal-overlay" onClick={() => setShowMedalModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '72px', marginBottom: '20px' }}>{medalEmoji}</div>
            {hasMedal ? (
              <>
                <h2 style={{ marginBottom: '12px' }}>Congratulations!</h2>
                <p style={{ color: '#94a3b8', lineHeight: 1.7 }}>
                  You won the <strong style={{ color: '#00ffcc' }}>{medal}</strong> medal today.
                  <br />Keep it up!
                </p>
              </>
            ) : (
              <>
                <h2 style={{ marginBottom: '12px' }}>Keep Going! 💪</h2>
                <p style={{ color: '#94a3b8', lineHeight: 1.7 }}>
                  You haven't earned a medal yet today.
                  <br />Study at least <strong>4 hours</strong> to unlock Bronze!
                </p>
              </>
            )}
            <button className="primary-btn" style={{ marginTop: '28px' }} onClick={() => setShowMedalModal(false)}>
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}