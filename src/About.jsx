import React from 'react';

export default function About({ onBack }) {
  const features = [
    {
      title: 'Live Study Timer',
      desc: 'Start a focused session for any course. Pause, reset, and save time with one click when your session ends.'
    },
    {
      title: 'Manual Time Entry',
      desc: 'Forgot to start the timer? Add study minutes for any date and course manually so your log stays complete.'
    },
    {
      title: 'Daily Task List',
      desc: 'Plan what you need to finish today. Mark tasks complete or remove them as you go through your list.'
    },
    {
      title: 'Medal Rewards',
      desc: 'Earn Bronze, Silver, Gold, or Diamond based on how many hours you study in a single day. Stay motivated.'
    },
    {
      title: 'Study Streaks',
      desc: 'Track your current streak and longest streak. Build consistency by studying at least 30 minutes every day.'
    },
    {
      title: 'Yearly Heatmap',
      desc: 'See your entire year at a glance in a GitHub-style calendar. Color intensity shows how much you studied each day.'
    },
    {
      title: 'Analytics Charts',
      desc: 'View daily study hours on a line chart and overall course distribution on a pie chart to understand your patterns.'
    },
    {
      title: 'Full History & Export',
      desc: 'Browse all past records with month and year filters. Export everything to CSV for Excel or Google Sheets.'
    },
    {
      title: 'Dark & Light Theme',
      desc: 'Switch between dark and light mode anytime. Your preference is saved so the app opens the way you like it.'
    },
    {
      title: 'Secure Login',
      desc: 'Sign up with email and password. Your study data is linked only to your account and stays private.'
    }
  ];

  const medals = [
    { name: 'Bronze', range: '4 – 6 hours', emoji: '🥉' },
    { name: 'Silver', range: '6 – 8 hours', emoji: '🥈' },
    { name: 'Gold', range: '8 – 10 hours', emoji: '🥇' },
    { name: 'Diamond', range: '10+ hours', emoji: '💎' }
  ];

  return (
    <div className="main-wrapper">
      <section className="page-section" style={{ borderBottom: 'none', paddingTop: '40px' }}>
        <div className="section-inner wide">

          <button className="secondary-btn" onClick={onBack} style={{ marginBottom: '36px' }}>
            ← Back to Dashboard
          </button>

          {/* Hero */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div className="section-heading" style={{ marginBottom: '16px' }}>About</div>
            <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '16px', letterSpacing: '-0.5px' }}>
              Study Tracker
            </h1>
            <p style={{
              color: 'var(--text-muted)',
              lineHeight: 1.75,
              fontSize: '15px',
              maxWidth: '560px',
              margin: '0 auto'
            }}>
              A personal productivity tool built to help you track daily study hours,
              stay consistent, and measure real progress — all in one clean dashboard.
            </p>
          </div>

          {/* What is this */}
          <div style={{
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '28px 28px',
            marginBottom: '40px',
            background: 'var(--hover-bg)'
          }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>
              What is this site?
            </h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '14px', margin: 0 }}>
              Study Tracker is a full-stack web app for students and self-learners.
              Log study sessions by course, manage daily tasks, earn medals based on hours studied,
              maintain streaks, and review your full history with heatmaps and charts.
              Every record is saved securely under your account so you never lose your progress.
            </p>
          </div>

          {/* Features grid */}
          <h2 style={{
            fontSize: '15px',
            fontWeight: 600,
            marginBottom: '20px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Key Features
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            marginBottom: '48px'
          }}>
            {features.map((f, i) => (
              <div
                key={i}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '22px 20px',
                  background: 'var(--bg-secondary)'
                }}
              >
                <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                  {f.title}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.7, margin: 0 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Medals */}
          <h2 style={{
            fontSize: '15px',
            fontWeight: 600,
            marginBottom: '20px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            How Medals Work
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
            marginBottom: '48px'
          }}>
            {medals.map((m, i) => (
              <div
                key={i}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '20px 12px',
                  textAlign: 'center',
                  background: 'var(--bg-secondary)'
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{m.emoji}</div>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>{m.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.range}</div>
              </div>
            ))}
          </div>

          <p style={{
            color: 'var(--text-muted)',
            lineHeight: 1.8,
            fontSize: '14px',
            textAlign: 'center',
            marginTop: '8px'
          }}>
            Built to keep you consistent. One day at a time.
          </p>

        </div>
      </section>
    </div>
  );
}