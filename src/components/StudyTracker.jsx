import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff66b2', '#66ff66'];

const getTodayDate = () => {
  return new Date().toLocaleDateString('en-GB');
};

// 🔴 YAHAN APNA RENDER WALA API URL PASTE KARO
const BACKEND_URL = 'http://localhost:5000/api/study-data'; 

export default function StudyTracker() {
  const [coursesList, setCoursesList] = useState(() => {
    const savedCourses = localStorage.getItem('studyTrackerCourses');
    return savedCourses ? JSON.parse(savedCourses) : ['Communication', 'CS Fundamentals', 'DEV', 'DSA', 'Extras'];
  });

  const [selectedCourse, setSelectedCourse] = useState(coursesList[0] || '');
  const [newCourseInput, setNewCourseInput] = useState('');
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const [dailyData, setDailyData] = useState({});
  const [manualCourse, setManualCourse] = useState(coursesList[0] || '');
  const [manualMinutes, setManualMinutes] = useState('');

  const [completedTasksData, setCompletedTasksData] = useState({});
  const [currentTasks, setCurrentTasks] = useState(() => {
    const saved = localStorage.getItem('studyTasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [newTaskInputStr, setNewTaskInputStr] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // 🔴 NAYA STATE: Year Selector ke liye
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const availableYears = [2026, 2025, 2024, 2023, 2022];

  useEffect(() => {
    fetch(BACKEND_URL)
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
      .catch(err => {
        console.log('Error fetching from DB:', err);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    let timer;
    if (isRunning) {
      timer = setInterval(() => setTime((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning]);

  useEffect(() => {
    localStorage.setItem('studyTrackerCourses', JSON.stringify(coursesList));
    if (!coursesList.includes(selectedCourse) && coursesList.length > 0) setSelectedCourse(coursesList[0]);
    if (!coursesList.includes(manualCourse) && coursesList.length > 0) setManualCourse(coursesList[0]);
  }, [coursesList, selectedCourse, manualCourse]);

  useEffect(() => {
    localStorage.setItem('studyTasks', JSON.stringify(currentTasks));
  }, [currentTasks]);

  const handleAddCourse = () => {
    if (newCourseInput.trim() !== '' && !coursesList.includes(newCourseInput.trim())) {
      setCoursesList([...coursesList, newCourseInput.trim()]);
      setNewCourseInput('');
    }
  };

  const handleDeleteCourse = (courseToDelete) => {
    if (window.confirm(`Delete '${courseToDelete}'?`)) {
      setCoursesList(coursesList.filter(c => c !== courseToDelete));
    }
  };

  const handleRenameCourse = (oldName) => {
    const newName = window.prompt(`Enter new name for '${oldName}':`, oldName);
    if (newName && newName.trim() !== '' && newName !== oldName && !coursesList.includes(newName)) {
      const updatedList = coursesList.map(c => c === oldName ? newName.trim() : c);
      setCoursesList(updatedList);
      setDailyData(prevData => {
        const newData = { ...prevData };
        for (let date in newData) {
          if (newData[date][oldName] !== undefined) {
            newData[date][newName.trim()] = newData[date][oldName];
            delete newData[date][oldName];
          }
        }
        return newData;
      });
      if (selectedCourse === oldName) setSelectedCourse(newName.trim());
    }
  };

  const endSession = async () => {
    setIsRunning(false);
    const minutesStudied = Math.ceil(time / 60);
    if (minutesStudied > 0 && selectedCourse) saveTimeToCloud(selectedCourse, minutesStudied);
    setTime(0);
  };

  const handleManualSubmit = () => {
    const mins = parseInt(manualMinutes, 10);
    if (isNaN(mins) || mins <= 0) return alert("Enter valid minutes!");
    if (!manualCourse) return alert("Select a course!");
    
    saveTimeToCloud(manualCourse, mins);
    setManualMinutes('');
  };

  const saveTimeToCloud = async (courseName, minutesToAdd) => {
    const today = getTodayDate();
    let updatedTodayData = {};

    setDailyData((prevData) => {
      const todayData = prevData[today] || {};
      coursesList.forEach(c => { if(todayData[c] === undefined) todayData[c] = 0; });
      updatedTodayData = { ...todayData, [courseName]: (todayData[courseName] || 0) + minutesToAdd };
      return { ...prevData, [today]: updatedTodayData };
    });

    try {
      await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today, coursesData: updatedTodayData })
      });
      alert(`Success! ${minutesToAdd} minutes added to ${courseName}.`);
    } catch (error) { console.error("Save error:", error); }
  };

  const handleEditHistory = async (date, course, currentMins) => {
    const newMins = window.prompt(`Edit total minutes for '${course}' on ${date}:`, currentMins);
    if (newMins !== null && newMins.trim() !== '' && !isNaN(newMins) && Number(newMins) >= 0) {
      const updatedData = { ...dailyData };
      updatedData[date] = { ...updatedData[date], [course]: Number(newMins) };
      setDailyData(updatedData);

      try {
        await fetch(BACKEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: date, coursesData: updatedData[date] })
        });
      } catch (error) { console.error("Error updating record:", error); }
    }
  };

  const handleDeleteHistory = async (date, course) => {
    if (window.confirm(`Remove '${course}' record from ${date}?`)) {
      const updatedData = { ...dailyData };
      const updatedDateData = { ...updatedData[date] };
      delete updatedDateData[course];
      
      updatedData[date] = updatedDateData;
      setDailyData(updatedData);

      try {
        await fetch(BACKEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: date, coursesData: updatedDateData })
        });
      } catch (error) { console.error("Error updating record:", error); }
    }
  };

  const handleAddNewTask = () => {
    if (newTaskInputStr.trim()) {
      setCurrentTasks([...currentTasks, newTaskInputStr.trim()]);
      setNewTaskInputStr('');
    }
  };

  const handleCompleteTask = async (taskText) => {
    const today = getTodayDate();
    setCurrentTasks(currentTasks.filter(t => t !== taskText));
    
    setCompletedTasksData(prev => {
      const todayTasks = prev[today] || [];
      const newTasksList = [...todayTasks, taskText];
      
      fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today, completedTasks: newTasksList })
      }).catch(err => console.error(err));

      return { ...prev, [today]: newTasksList };
    });
  };

  const handleRemoveTask = (taskText) => {
    setCurrentTasks(currentTasks.filter(t => t !== taskText));
  };

  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return hrs + ":" + mins + ":" + secs;
  };

  const formatMinutesToHrMin = (totalMinutes) => {
    if (!totalMinutes || totalMinutes === 0) return "0 Min";
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h === 0) return m + " Min";
    return h + " Hr " + m + " Min";
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#00ffcc', fontSize: '24px', fontFamily: 'monospace' }}>
        Loading your Study Dashboard... 🚀
      </div>
    );
  }

  const today = getTodayDate();
  const todayData = dailyData[today] || {};
  const totalTodayMinutes = Object.values(todayData).reduce((sum, mins) => sum + mins, 0);
  const totalHours = totalTodayMinutes / 60;

  let medal = "Keep Going!";
  if (totalHours >= 10) medal = "Diamond";
  else if (totalHours >= 8) medal = "Gold";
  else if (totalHours >= 6) medal = "Silver";
  else if (totalHours >= 4) medal = "Bronze";

  const lineChartData = Object.keys(dailyData).map((date) => {
    const dayTotalMins = Object.values(dailyData[date]).reduce((sum, val) => sum + val, 0);
    return { date: date, hours: Number((dayTotalMins / 60).toFixed(2)) };
  });

  const overallTotals = {};
  coursesList.forEach(c => overallTotals[c] = 0);
  Object.values(dailyData).forEach((dayRecord) => {
    Object.keys(dayRecord).forEach((course) => {
      overallTotals[course] = (overallTotals[course] || 0) + dayRecord[course];
    });
  });

  const pieChartData = Object.keys(overallTotals)
    .map((course) => ({ name: course, value: overallTotals[course] }))
    .filter((data) => data.value > 0);

  // 🔴 NAYA ALGORITHM: 12 Months grouped with gaps
  const getMonthsData = (year) => {
    const months = [];
    for (let m = 0; m < 12; m++) {
      const date = new Date(year, m, 1);
      const monthName = date.toLocaleString('en-US', { month: 'short' });
      const weeks = [];
      let currentWeek = new Array(7).fill(null);

      while (date.getMonth() === m) {
        const dayOfWeek = date.getDay(); // 0 = Sun, 1 = Mon, etc.
        currentWeek[dayOfWeek] = new Date(date);
        
        if (dayOfWeek === 6) { // End of week
          weeks.push(currentWeek);
          currentWeek = new Array(7).fill(null);
        }
        date.setDate(date.getDate() + 1);
      }
      // Push remaining days of the last week of the month
      if (currentWeek.some(d => d !== null)) {
        weeks.push(currentWeek);
      }
      months.push({ monthName, weeks });
    }
    return months;
  };

  const getDayColorStyle = (dateStr) => {
    const dayRecord = dailyData[dateStr];
    if (!dayRecord) return { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }; // Inactive (Empty box)

    const totalMins = Object.values(dayRecord).reduce((a, b) => a + b, 0);
    const hrs = totalMins / 60;

    if (hrs < 4) {
      return { background: '#ff4444', boxShadow: '0 0 5px rgba(255, 68, 68, 0.4)', border: '1px solid #ff6666' }; // Red
    } else if (hrs >= 4 && hrs < 6) {
      return { background: '#cd7f32', boxShadow: '0 0 5px rgba(205, 127, 50, 0.4)', border: '1px solid #e09f5b' }; // Bronze
    } else if (hrs >= 6 && hrs < 8) {
      return { background: '#c0c0c0', boxShadow: '0 0 5px rgba(192, 192, 192, 0.4)', border: '1px solid #dcdcdc' }; // Silver
    } else {
      return { background: '#ffd700', boxShadow: '0 0 8px rgba(255, 215, 0, 0.6)', border: '1px solid #ffea75' }; // Gold
    }
  };

  // Calculate total hours for the selected year
  const getYearlyTotalMins = () => {
    let totalMins = 0;
    Object.keys(dailyData).forEach(dateStr => {
      const [d, m, y] = dateStr.split('/');
      if (parseInt(y) === selectedYear) {
        totalMins += Object.values(dailyData[dateStr]).reduce((a, b) => a + b, 0);
      }
    });
    return totalMins;
  };

  if (showHistory) {
    return (
      <div className="main-wrapper">
        <div className="stats-container" style={{ width: '100%', maxWidth: '900px' }}>
          <h2>All Time Study History</h2>
          <button className="secondary-btn" onClick={() => setShowHistory(false)} style={{ marginBottom: '20px' }}>
            Back to Dashboard
          </button>
          <table className="stats-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Total Time</th>
                <th>Course Breakdown</th>
                <th>Tasks Completed</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(dailyData).sort((a,b) => new Date(b.split('/').reverse().join('-')) - new Date(a.split('/').reverse().join('-'))).map(date => {
                const dayTotal = Object.values(dailyData[date]).reduce((a,b) => a+b, 0);
                return (
                  <tr key={date}>
                    <td>{date}</td>
                    <td className="total-row">{formatMinutesToHrMin(dayTotal)}</td>
                    <td>
                      {Object.keys(dailyData[date]).map(c => 
                        dailyData[date][c] > 0 ? (
                          <div key={c} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px', marginBottom: '5px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                            <span style={{ fontSize: '14px', color: '#ccc' }}>{c}: {formatMinutesToHrMin(dailyData[date][c])}</span>
                            <div>
                              <button onClick={() => handleEditHistory(date, c, dailyData[date][c])} style={{ padding: '2px 6px', fontSize: '11px', background: 'transparent', color: '#00ffcc', border: '1px solid #00ffcc', marginRight: '5px' }}>Edit</button>
                              <button onClick={() => handleDeleteHistory(date, c)} style={{ padding: '2px 6px', fontSize: '11px', background: 'transparent', color: '#ff4444', border: '1px solid #ff4444' }}>Del</button>
                            </div>
                          </div>
                        ) : null
                      )}
                    </td>
                    <td>
                      {completedTasksData[date] && completedTasksData[date].length > 0 ? (
                        <ul style={{ paddingLeft: '15px', margin: 0, color: '#00ffcc', fontSize: '13px' }}>
                          {completedTasksData[date].map((t, i) => <li key={i}>{t}</li>)}
                        </ul>
                      ) : <span style={{ color: '#555' }}>No tasks</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="main-wrapper">
      <div className="top-section">
        
        <div className="tracker-container">
          <h2>Study Dashboard</h2>
          <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
            {coursesList.map((c) => (
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
          <button className="save-btn" onClick={endSession}>
            Session Over (Save Time)
          </button>
          <button className="history-btn" onClick={() => setShowHistory(true)}>
            View All Data History
          </button>
        </div>

        <div className="stats-container">
          <h2>Today's Progress ({today})</h2>
          <table className="stats-table">
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
                <td>Total Hrs</td>
                <td>{formatMinutesToHrMin(totalTodayMinutes)}</td>
              </tr>
            </tbody>
          </table>
          <div className="medal-section">
            <h3>Today's Medal: {medal}</h3>
          </div>

          <div style={{ marginTop: '25px', padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h4 style={{ marginBottom: '12px', color: '#00ffcc', fontWeight: '500', fontSize: '14px', letterSpacing: '0.5px' }}>+ MANUAL ENTRY (MINS)</h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select value={manualCourse} onChange={(e) => setManualCourse(e.target.value)} style={{ flex: 1, padding: '10px', fontSize: '13px' }}>
                {coursesList.map((c) => <option key={`manual-${c}`} value={c}>{c}</option>)}
              </select>
              <input type="number" placeholder="Mins" value={manualMinutes} onChange={(e) => setManualMinutes(e.target.value)} style={{ width: '80px', padding: '10px', fontSize: '13px' }} />
              <button className="primary-btn" onClick={handleManualSubmit} style={{ margin: 0, padding: '10px 16px', fontSize: '13px', minWidth: 'auto' }}>Submit</button>
            </div>
          </div>
        </div>

        <div className="stats-container" style={{ alignSelf: 'flex-start' }}>
          <h2>Tasks for the Day</h2>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <input 
              type="text" 
              value={newTaskInputStr} 
              onChange={(e) => setNewTaskInputStr(e.target.value)} 
              placeholder="What needs to be done?"
            />
            <button className="primary-btn" style={{ margin: 0 }} onClick={handleAddNewTask}>Add</button>
          </div>
          
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {currentTasks.map((t, idx) => (
              <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.05)', padding: '10px', marginBottom: '5px', borderRadius: '6px' }}>
                <span style={{ fontSize: '15px' }}>{t}</span>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button onClick={() => handleCompleteTask(t)} style={{ background: 'transparent', color: '#00ffcc', border: '2px solid #00ffcc', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>✓</button>
                  <button onClick={() => handleRemoveTask(t)} style={{ background: 'transparent', color: '#ff4444', border: '2px solid #ff4444', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>✕</button>
                </div>
              </li>
            ))}
            {currentTasks.length === 0 && (
              <li style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px', marginTop: '10px' }}>No pending tasks! 🎉</li>
            )}
          </ul>

          {completedTasksData[today] && completedTasksData[today].length > 0 && (
            <div style={{ marginTop: '25px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <h4 style={{ color: '#00ffcc', marginBottom: '10px', fontSize: '14px' }}>✓ Completed Today:</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {completedTasksData[today].map((ct, idx) => (
                  <li key={idx} style={{ padding: '8px', background: 'rgba(0, 255, 204, 0.05)', color: '#94a3b8', marginBottom: '5px', borderRadius: '6px', textDecoration: 'line-through', fontSize: '14px' }}>
                    {ct}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* 🔴 PERFECT GITHUB STYLE 12-MONTH HEATMAP WITH YEAR SELECTOR */}
      <div className="graph-card" style={{ width: '100%', maxWidth: '1250px', overflowX: 'auto', display: 'flex', gap: '30px' }}>
        
        {/* Heatmap Section */}
        <div style={{ flexGrow: 1 }}>
          <div style={{ marginBottom: '15px', color: '#f1f5f9', fontSize: '16px' }}>
            {Number((getYearlyTotalMins() / 60).toFixed(1))} hours studied in {selectedYear}
          </div>
          
          <div style={{ display: 'flex', gap: '6px', minWidth: 'max-content' }}>
            
            {/* Day Labels (Mon, Wed, Fri) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '20px', paddingRight: '8px', fontSize: '10px', color: '#94a3b8' }}>
              <div style={{ height: '12px' }}></div>
              <div style={{ height: '12px', lineHeight: '12px' }}>Mon</div>
              <div style={{ height: '12px' }}></div>
              <div style={{ height: '12px', lineHeight: '12px' }}>Wed</div>
              <div style={{ height: '12px' }}></div>
              <div style={{ height: '12px', lineHeight: '12px' }}>Fri</div>
              <div style={{ height: '12px' }}></div>
            </div>

            {/* Months Rendering */}
            <div style={{ display: 'flex', gap: '15px' }}>
              {getMonthsData(selectedYear).map((month, mIndex) => (
                <div key={mIndex} style={{ display: 'flex', flexDirection: 'column' }}>
                  
                  {/* Month Label */}
                  <div style={{ height: '20px', fontSize: '11px', color: '#94a3b8' }}>
                    {month.monthName}
                  </div>
                  
                  {/* Weeks in Month */}
                  <div style={{ display: 'flex', gap: '3px' }}>
                    {month.weeks.map((week, wIndex) => (
                      <div key={wIndex} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {week.map((day, dIndex) => {
                          if (!day) {
                            return <div key={dIndex} style={{ width: '12px', height: '12px', background: 'transparent' }}></div>;
                          }
                          
                          const dateStr = day.toLocaleDateString('en-GB');
                          const style = getDayColorStyle(dateStr);
                          const record = dailyData[dateStr];
                          const totalMins = record ? Object.values(record).reduce((a, b) => a + b, 0) : 0;
                          const hrsText = formatMinutesToHrMin(totalMins);

                          return (
                            <div 
                              key={dIndex}
                              title={`${dateStr}: ${hrsText}`}
                              style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                transition: 'transform 0.2s ease',
                                ...style
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            ></div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Color Legend */}
          <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '15px', marginTop: '20px', marginLeft: '30px', fontSize: '11px', color: '#94a3b8' }}>
            <span style={{ marginRight: '5px' }}>Less</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '12px', height: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', border: '1px solid rgba(255,255,255,0.08)' }}></div> Empty</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '12px', height: '12px', background: '#ff4444', borderRadius: '3px' }}></div> &lt; 4 Hours</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '12px', height: '12px', background: '#cd7f32', borderRadius: '3px' }}></div> Bronze</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '12px', height: '12px', background: '#c0c0c0', borderRadius: '3px' }}></div> Silver</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '12px', height: '12px', background: '#ffd700', borderRadius: '3px' }}></div> Gold</div>
            <span style={{ marginLeft: '5px' }}>More</span>
          </div>
        </div>

        {/* 🔴 NAYA: Year Selector Sidebar */}
        <div style={{ width: '100px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: '20px' }}>
          {availableYears.map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              style={{
                background: selectedYear === year ? '#2f81f7' : 'transparent',
                color: selectedYear === year ? '#fff' : '#94a3b8',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                textAlign: 'left',
                cursor: 'pointer',
                fontWeight: selectedYear === year ? '600' : '400',
                transition: '0.2s ease',
              }}
              onMouseEnter={(e) => { if(selectedYear !== year) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={(e) => { if(selectedYear !== year) e.currentTarget.style.background = 'transparent' }}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      <div className="graphs-section">
        <div className="graph-card">
          <h3>Daily Total Study Hours</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="date" stroke="#ccc" />
                <YAxis stroke="#ccc" />
                <Tooltip contentStyle={{ backgroundColor: '#1e1e2f', borderColor: '#444' }} />
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
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e1e2f', borderColor: '#444' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}