import React, { useState, useEffect, useRef } from 'react';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// GB: DD/MM/YYYY  ↔  Date object
const parseGB = (gb) => {
  if (!gb) return new Date();
  const [d, m, y] = gb.split('/').map(Number);
  return new Date(y, m - 1, d);
};

const toGB = (date) => {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};

const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export default function CustomDatePicker({
  value,          // 'DD/MM/YYYY'
  onChange,       // (gbString) => void
  style = {},
  className = ''
}) {
  const selected = parseGB(value);
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());
  const ref = useRef(null);

  useEffect(() => {
    if (open) {
      const d = parseGB(value);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [open, value]);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else setViewMonth(m => m + 1);
  };

  // Monday-first calendar grid
  const buildGrid = () => {
    const first = new Date(viewYear, viewMonth, 1);
    let startDow = first.getDay(); // 0=Sun
    startDow = startDow === 0 ? 6 : startDow - 1; // Monday=0

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrev = new Date(viewYear, viewMonth, 0).getDate();

    const cells = [];

    for (let i = startDow - 1; i >= 0; i--) {
      cells.push({
        date: new Date(viewYear, viewMonth - 1, daysInPrev - i),
        outside: true
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        date: new Date(viewYear, viewMonth, d),
        outside: false
      });
    }

    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      cells.push({
        date: new Date(viewYear, viewMonth + 1, d),
        outside: true
      });
    }

    return cells;
  };

  const cells = buildGrid();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div
      ref={ref}
      className={`custom-datepicker ${className}`}
      style={{ position: 'relative', width: '100%', ...style }}
    >
      <button
        type="button"
        className="custom-datepicker-trigger"
        onClick={() => setOpen(o => !o)}
      >
        <span>{value || 'Select date'}</span>
        <span className="custom-datepicker-icon">📅</span>
      </button>

      {open && (
        <div className="custom-datepicker-panel">
          {/* Header */}
          <div className="cdp-header">
            <button type="button" className="cdp-nav" onClick={prevMonth}>‹</button>
            <div className="cdp-title">
              {MONTHS[viewMonth]} {viewYear}
            </div>
            <button type="button" className="cdp-nav" onClick={nextMonth}>›</button>
          </div>

          {/* Weekdays */}
          <div className="cdp-weekdays">
            {WEEKDAYS.map(d => (
              <div key={d} className="cdp-weekday">{d}</div>
            ))}
          </div>

          {/* Days */}
          <div className="cdp-grid">
            {cells.map((cell, i) => {
              const isSelected = sameDay(cell.date, selected);
              const isToday = sameDay(cell.date, today);
              return (
                <button
                  key={i}
                  type="button"
                  className={[
                    'cdp-day',
                    cell.outside ? 'outside' : '',
                    isSelected ? 'selected' : '',
                    isToday && !isSelected ? 'today' : ''
                  ].filter(Boolean).join(' ')}
                  onClick={() => {
                    onChange(toGB(cell.date));
                    setOpen(false);
                  }}
                >
                  {cell.date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="cdp-footer">
            <button
              type="button"
              className="cdp-footer-btn"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
            >
              Clear
            </button>
            <button
              type="button"
              className="cdp-footer-btn primary"
              onClick={() => {
                onChange(toGB(new Date()));
                setOpen(false);
              }}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}