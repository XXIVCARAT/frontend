import React from 'react';

export default function RankPage({ leaderboard, loading, error, activeTab, setActiveTab, tierIcons }) {
  return (
    <div className="page page-dashboard">
      <section className="rank-list">
        <h2 className="rank-title">Leaderboard</h2>
        {loading ? (
          <div className="rank-loading">
            <div className="rank-loading-bars">
              <span className="rank-bar bar1"></span>
              <span className="rank-bar bar2"></span>
              <span className="rank-bar bar3"></span>
              <span className="rank-bar bar4"></span>
              <span className="rank-bar bar5"></span>
            </div>
            <p className="rank-label">Loading leaderboard...</p>
          </div>
        ) : error ? (
          <p className="rank-label">Error: {error}</p>
        ) : leaderboard.length === 0 ? (
          <p className="rank-label">No players yet.</p>
        ) : (
          leaderboard.map((row) => (
            <article key={row.rank} className="rank-card">
              <div className="rank-header">
                <span className="rank-badge">#{row.rank}</span>
                <p className="rank-name">{row.username}</p>
              </div>
              <div className="rank-stats">
                <div className="rank-stat">
                  <p className="rank-label rank-record-label">Record</p>
                  <p className="rank-record">
                    <span className="rank-win">{row.wins}W</span>
                    <span className="rank-sep"> • </span>
                    <span className="rank-loss">{row.losses}L</span>
                  </p>
                </div>
                <div className="rank-stat">
                  <p className="rank-label">Win Rate</p>
                  <p className="rank-rating">{row.winRate}%</p>
                </div>
                <div className="rank-stat">
                  <p className="rank-label">Rating</p>
                  <p className="rank-rating">{row.rating}</p>
                </div>
                <div className="rank-stat">
                  <p className="rank-label">Tier</p>
                  <span className={`rank-tier rank-tier-${row.tier.toLowerCase()}`}>
                    <span className="rank-tier-icon">{tierIcons[row.tier] || '★'}</span>
                    {row.tier}
                  </span>
                </div>
              </div>
            </article>
          ))
        )}
      </section>

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
