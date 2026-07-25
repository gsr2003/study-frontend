import React, { useState, useEffect, useRef } from 'react';

/**
 * options: string[]  OR  { value, label }[]
 * onChange: (value) => void
 */
export default function CustomSelect({
  value,
  options = [],
  onChange,
  placeholder = 'Select',
  style = {},
  className = ''
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const normalized = options.map((opt) =>
    typeof opt === 'object' && opt !== null
      ? { value: opt.value, label: opt.label }
      : { value: opt, label: String(opt) }
  );

  const selected = normalized.find(
    (o) => String(o.value) === String(value)
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={ref}
      className={`custom-select ${className}`}
      style={{ position: 'relative', width: '100%', ...style }}
    >
      <button
        type="button"
        className="custom-select-trigger"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="custom-select-value">
          {selected ? selected.label : placeholder}
        </span>
        <span className="custom-select-arrow">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="custom-select-dropdown">
          {normalized.length === 0 ? (
            <div className="custom-select-option disabled">No options</div>
          ) : (
            normalized.map((opt) => (
              <div
                key={String(opt.value)}
                className={`custom-select-option${
                  String(opt.value) === String(value) ? ' active' : ''
                }`}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}