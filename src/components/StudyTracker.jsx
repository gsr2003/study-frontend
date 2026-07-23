import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const PIE_COLORS = ['#6366f1', '#22c55e', '#eab308', '#f97316', '#a855f7', '#ec4899', '#14b8a6'];

const getTodayDate = () => new Date().toLocaleDateString('en-GB');

const BACKEND_URL = 'https://my-study-backend.onrender.com/api/study-data';
// Local: 'http://localhost:500/api/study-data'
//api link: 'https://my-study-backend.onrender.com/api/study-data'

export default function StudyTracker() {
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

  const saveTimeToCloud = async (courseName, minutesToAdd) => {
    if (!userEmail) return;
    const dateToUse = selectedDate;
    let updatedTodayData = {};

    setDailyData(prev => {
      const todayData = { ...(prev[dateToUse] || {}) };
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

  const handleDeleteAllData = async () => {
    if (!userEmail) return;
    try {
      const res = await fetch(`${BACKEND_URL}/all?email=${userEmail}`, { method: 'DELETE' });
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

  if (!userEmail) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--danger)', fontSize: '18px' }}>
        Please login again
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text-muted)', fontSize: '18px' }}>
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

  // Pie in HOURS (decimals OK)
  const pieChartData = Object.keys(overallTotals)
    .map(c => ({
      name: c,
      value: Number((overallTotals[c] / 60).toFixed(2))
    }))
    .filter(d => d.value > 0);

  const getDayColorStyle = (dateStr) => {
    const dayRecord = dailyData[dateStr];
    if (!dayRecord) {
      return { background: 'var(--border)', border: '1px solid var(--border)' };
    }
    const hrs = Object.values(dayRecord).reduce((a, b) => a + b, 0) / 60;
    if (hrs < 4) return { background: '#ef4444' };
    if (hrs < 6) return { background: '#cd7f32' };
    if (hrs < 8) return { background: '#a1a1aa' };
    if (hrs < 10) return { background: '#eab308' };
    return { background: '#38bdf8' };
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

  const calculateStreaks = () => {
    const studiedDates = Object.keys(dailyData)
      .filter(date => {
        const totalMins = Object.values(dailyData[date] || {}).reduce((a, b) => a + b, 0);
        return totalMins >= 30;
      })
      .map(date => {
        const [d, m, y] = date.split('/');
        return new Date(`${y}-${m}-${d}`);
      })
      .sort((a, b) => a - b);

    if (studiedDates.length === 0) return { currentStreak: 0, longestStreak: 0 };

    let longestStreak = 1;
    let tempStreak = 1;
    for (let i = 1; i < studiedDates.length; i++) {
      const diff = (studiedDates[i] - studiedDates[i - 1]) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    let currentStreak = 0;
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const lastStudied = studiedDates[studiedDates.length - 1];
    lastStudied.setHours(0, 0, 0, 0);
    const diffFromToday = (todayDate - lastStudied) / (1000 * 60 * 60 * 24);

    if (diffFromToday === 0 || diffFromToday === 1) {
      currentStreak = 1;
      for (let i = studiedDates.length - 2; i >= 0; i--) {
        const diff = (studiedDates[i + 1] - studiedDates[i]) / (1000 * 60 * 60 * 24);
        if (diff === 1) currentStreak++;
        else break;
      }
    }

    return { currentStreak, longestStreak };
  };

  const { currentStreak, longestStreak } = calculateStreaks();
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

  const exportToCSV = () => {
    if (filteredHistoryDates.length === 0) {
      alert('No data to export');
      return;
    }
    let csv = 'Date,Total Time,Course Breakdown,Tasks\n';
    filteredHistoryDates.forEach(date => {
      const total = Object.values(dailyData[date] || {}).reduce((a, b) => a + b, 0);
      const totalFormatted = formatMinutesToHrMin(total);
      const courses = Object.keys(dailyData[date] || {})
        .filter(c => dailyData[date][c] > 0)
        .map(c => `${c}: ${formatMinutesToHrMin(dailyData[date][c])}`)
        .join(' | ');
      const tasks = (completedTasksData[date] || []).join(' | ') || '—';
      const escape = (str) => `"${String(str).replace(/"/g, '""')}"`;
      csv += `${escape(date)},${escape(totalFormatted)},${escape(courses)},${escape(tasks)}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `study-history-${historyYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ==================== HISTORY VIEW ====================
  if (showHistory) {
    return (
      <div className="main-wrapper">
        <div className="page-section" style={{ borderBottom: 'none' }}>
          <div className="section-inner wide">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>All Time Study History</h2>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button className="secondary-btn" onClick={() => setShowHistory(false)}>← Back</button>
                <button className="secondary-btn" onClick={exportToCSV} title="Export data in CSV format">⬇ Export</button>
                <button
                  onClick={() => setShowDeleteAllConfirm(true)}
                  style={{
                    background: 'transparent',
                    color: 'var(--danger)',
                    border: '1px solid var(--danger)',
                    borderRadius: '10px',
                    padding: '10px 16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'Sora, sans-serif'
                  }}
                >
                  🗑 Delete All
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <select value={historyYear} onChange={e => setHistoryYear(Number(e.target.value))} style={{ width: '120px' }}>
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
                    <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
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
                              <div key={c} style={{ padding: '3px 0', fontSize: '13px' }}>
                                {c}: {formatMinutesToHrMin(dailyData[date][c])}
                              </div>
                            ) : null
                          )}
                        </td>
                        <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          {(completedTasksData[date] || []).join(', ') || '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showDeleteAllConfirm && (
          <div className="modal-overlay" onClick={() => setShowDeleteAllConfirm(false)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <h3 style={{ color: 'var(--danger)', marginBottom: '12px' }}>Delete All Data?</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>This cannot be undone.</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button className="secondary-btn" onClick={() => setShowDeleteAllConfirm(false)}>Cancel</button>
                <button
                  onClick={handleDeleteAllData}
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
      </div>
    );
  }

  // ==================== MAIN DASHBOARD ====================
  return (
    <div className="main-wrapper">

      {/* ========== TIMER ========== */}
      <section id="section-timer" className="page-section">
        <div className="section-inner" style={{ textAlign: 'center' }}>
          <div className="section-heading">Study Dashboard</div>

          <select
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            style={{ maxWidth: '280px', margin: '0 auto 12px', display: 'block' }}
          >
            {coursesList.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <div className="timer-display">{formatTime(time)}</div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '28px' }}>
            <button className="primary-btn" onClick={() => setIsRunning(!isRunning)}>
              {isRunning ? 'Pause' : 'Start'}
            </button>
            <button className="secondary-btn" onClick={() => { setIsRunning(false); setTime(0); }}>
              Reset
            </button>
          </div>

          <button className="save-btn" style={{ maxWidth: '320px', margin: '0 auto' }} onClick={endSession}>
            SESSION OVER (SAVE TIME)
          </button>
          <button className="history-btn" style={{ maxWidth: '320px', margin: '12px auto 0' }} onClick={() => setShowHistory(true)}>
            View All Data History
          </button>
        </div>
      </section>

      {/* ========== TODAY'S PROGRESS (CENTERED) ========== */}
      <section id="section-progress" className="page-section">
        <div className="section-inner progress-centered">
          <div className="section-heading">Today's Progress</div>

          <div className="date-wrap">
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textAlign: 'center' }}>
              Select Date
            </label>
            <input
              type="date"
              className="date-input"
              value={toInputDate(selectedDate)}
              onChange={e => setSelectedDate(fromInputDate(e.target.value))}
            />
          </div>

<table className="stats-table centered">
  <thead>
    <tr>
      <th>Course</th>
      <th>Time Studied</th>
    </tr>
  </thead>
  <tbody>
    {coursesList.map((course) => (
      <tr key={course}>
        <td>{course}</td>
        <td>{formatMinutesToHrMin(todayData[course] || 0)}</td>
      </tr>
    ))}
    <tr className="total-row">
      <td>Total</td>
      <td>{formatMinutesToHrMin(totalTodayMinutes)}</td>
    </tr>
  </tbody>
</table>

          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border)', width: '100%', maxWidth: '480px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 600, letterSpacing: '0.5px', textAlign: 'center' }}>
              + MANUAL ENTRY
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <select value={manualCourse} onChange={e => setManualCourse(e.target.value)} style={{ flex: 1, minWidth: '140px' }}>
                {coursesList.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Mins"
                value={manualMinutes}
                onChange={e => setManualMinutes(e.target.value)}
                style={{ width: '90px' }}
              />
              <button className="primary-btn" onClick={handleManualSubmit} style={{ margin: 0 }}>
                Add
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========== MEDAL + TASKS ========== */}
      <section id="section-tasks" className="page-section">
        <div className="section-inner">
          {/* Medal - more breathing space */}
          <div className="medal-block" onClick={() => setShowMedalModal(true)} style={{ cursor: 'pointer' }}>
            <div className="section-heading">Today's Medal</div>
            <div className="medal-emoji">{medalEmoji}</div>
            <div className="medal-title">{medal}</div>

            <div className="medal-streak-row">
              <div>
                <div style={{ fontSize: '22px', fontWeight: 700 }}>🔥 {currentStreak}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Current</div>
              </div>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 700 }}>🏆 {longestStreak}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Longest</div>
              </div>
            </div>
            <p style={{ marginTop: '18px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
              Streak
            </p>
          </div>

          {/* Tasks */}
          <div className="section-heading">Tasks for the Day</div>
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
              <li style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0', fontSize: '14px' }}>
                No pending tasks 🎉
              </li>
            )}
          </ul>

          {completedTasksData[today]?.length > 0 && (
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: '10px', fontSize: '12px', fontWeight: 600 }}>
                ✓ Completed
              </div>
              {completedTasksData[today].map((ct, i) => (
                <div key={i} style={{
                  padding: '8px 0',
                  color: 'var(--text-muted)',
                  textDecoration: 'line-through',
                  fontSize: '13px',
                  borderBottom: '1px solid var(--border)'
                }}>
                  {ct}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ========== HEATMAP ========== */}
      <section id="section-heatmap" className="page-section">
        <div className="section-inner wide">
          <div className="section-heading">Heatmap</div>

          <div className="heatmap-controls">
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
                <div className="dropdown-panel" style={{ minWidth: '210px' }}>
                  <div className="dropdown-title">Color Legend</div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: 'var(--border)', border: '1px solid var(--text-muted)' }}></div>
                    Empty
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#ef4444' }}></div>
                    &lt; 4 Hours
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#cd7f32' }}></div>
                    Bronze (4–6 hrs)
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#a1a1aa' }}></div>
                    Silver (6–8 hrs)
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#eab308' }}></div>
                    Gold (8–10 hrs)
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#38bdf8' }}></div>
                    Diamond (10+ hrs)
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="heatmap-card">
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
                <div style={{ overflowX: 'auto', paddingBottom: '8px', display: 'flex', justifyContent: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', marginLeft: '28px', marginBottom: '6px', position: 'relative', height: '18px' }}>
                      {monthLabels.map((label, i) => (
                        <div
                          key={i}
                          style={{
                            position: 'absolute',
                            left: `${label.weekIndex * 14}px`,
                            fontSize: '11px',
                            color: 'var(--text-muted)',
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
                        color: 'var(--text-muted)',
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
                              if (day.getFullYear() !== year) {
                                return <div key={dIndex} style={{ width: '11px', height: '11px' }} />;
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
                                    width: '11px',
                                    height: '11px',
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
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* ========== ANALYTICS ========== */}
      <section id="section-analytics" className="page-section" style={{ borderBottom: 'none' }}>
        <div className="section-inner wide">
          <div className="section-heading">Analytics</div>
          <div className="graphs-section">
            <div className="graph-card">
              <h3>Daily Total Study Hours</h3>
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <LineChart data={lineChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-main)'
                      }}
                    />
                    <Line type="monotone" dataKey="hours" stroke="var(--text-main)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="graph-card">
              <h3>Overall Time Distribution</h3>
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieChartData} cx="50%" cy="50%" outerRadius={95} dataKey="value">
                      {pieChartData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value} hrs`, 'Time']}
                      contentStyle={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-main)'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Medal Modal */}
      {showMedalModal && (
        <div className="modal-overlay" onClick={() => setShowMedalModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>{medalEmoji}</div>
            {hasMedal ? (
              <>
                <h2 style={{ marginBottom: '12px' }}>Congratulations!</h2>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  You won the <strong style={{ color: 'var(--text-main)' }}>{medal}</strong> medal today.
                  <br />Keep it up!
                </p>
              </>
            ) : (
              <>
                <h2 style={{ marginBottom: '12px' }}>Keep Going! 💪</h2>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  You haven't earned a medal yet today.
                  <br />Study at least <strong>4 hours</strong> to unlock Bronze!
                </p>
              </>
            )}
            <button className="primary-btn" style={{ marginTop: '24px' }} onClick={() => setShowMedalModal(false)}>
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}