import React from 'react';

export default function SocialPage({ activeTab, setActiveTab }) {
  return (
    <div className="page page-dashboard">
      <div className="coming-soon-overlay">
        <div className="coming-soon-card">
          <p className="coming-soon-kicker">Social</p>
          <h1>Coming soon</h1>
          <p className="coming-soon-sub">We’re building clubs, chat, and challenges. Stay tuned.</p>
          <button className="primary" type="button" onClick={() => setActiveTab('home')}>
            Back to dashboard
          </button>
        </div>
      </div>
      <nav className="bottom-tabs" aria-label="Primary">
        <button
          className={`tab-btn ${activeTab === 'rank' ? 'active' : ''}`}
          type="button"
          aria-label="Rank"
          onClick={() => setActiveTab('rank')}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="tab-icon">
            <path d="M4 19a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4Zm6 0a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-2Zm6 0a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-2Z" />
          </svg>
          {activeTab === 'rank' && <span className="tab-label">Rank</span>}
        </button>
        <button
          className={`tab-btn ${activeTab === 'social' ? 'active' : ''}`}
          type="button"
          aria-label="Social"
          onClick={() => setActiveTab('social')}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="tab-icon">
            <path d="M9 11a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Zm6 0a3 3 0 1 1 0-6 3 3 0 0 1 0 6ZM4 18.5C4 15.5 6.5 13 9.5 13h1A4.5 4.5 0 0 1 15 17.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-.5Zm9.2-4.9A5 5 0 0 1 19 18v1a1 1 0 0 1-1 1h-3.1a2.5 2.5 0 0 0 .9-1.9v-.6a6.5 6.5 0 0 0-2.6-5Z" />
          </svg>
          {activeTab === 'social' && <span className="tab-label">Social</span>}
        </button>
        <button
          className={`tab-btn ${activeTab === 'home' ? 'active' : ''}`}
          type="button"
          aria-label="Home"
          onClick={() => setActiveTab('home')}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="tab-icon">
            <path d="M12 5.3 5 10.7V20h4v-4.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V20h4v-9.3L12 5.3Zm0-2.5 9 7V21a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1v-4h-2v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11l9-7Z" />
          </svg>
          {activeTab === 'home' && <span className="tab-label">Home</span>}
        </button>
      </nav>
    </div>
  );
}
