import React from 'react';

export default function Contact({ onBack }) {
  return (
    <div className="main-wrapper">
      <section className="page-section" style={{ borderBottom: 'none' }}>
        <div className="section-inner" style={{ maxWidth: '520px', textAlign: 'center' }}>
          <button
            className="secondary-btn"
            onClick={onBack}
            style={{ marginBottom: '32px' }}
          >
            ← Back to Dashboard
          </button>

          <div className="section-heading">Contact Us</div>

          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '12px' }}>
            Get in touch
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '40px', fontSize: '14px', lineHeight: 1.7 }}>
            Have a question, feedback, or found a bug? Reach out anytime.
          </p>

          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '28px 24px',
              marginBottom: '16px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Phone
            </div>
            <a
              href="tel:9351417773"
              style={{ color: 'var(--text-main)', fontSize: '18px', fontWeight: 600, textDecoration: 'none' }}
            >
              9351417773
            </a>
          </div>

          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '28px 24px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Email
            </div>
            <a
              href="mailto:iamgsr1206@gmail.com"
              style={{ color: 'var(--text-main)', fontSize: '16px', fontWeight: 600, textDecoration: 'none', wordBreak: 'break-all' }}
            >
              iamgsr1206@gmail.com
            </a>
          </div>

          <p style={{ color: 'var(--text-muted)', marginTop: '36px', fontSize: '13px' }}>
            Usually reply within 24 hours.
          </p>
        </div>
      </section>
    </div>
  );
}