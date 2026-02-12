import { useState } from 'react';
import { login, register } from './api.js';

export default function App() {
  const [mode, setMode] = useState('login');
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  const isLogin = mode === 'login';

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus(null);
    setLoading(true);

    try {
      if (isLogin) {
        const data = await login(identifier, password);
        setUser(data);
        setStatus({ type: 'success', message: `Welcome back, ${data.email}` });
      } else {
        const data = await register(email, username, password);
        setStatus({ type: 'success', message: `Account created for ${data.email}. You can log in now.` });
        setMode('login');
        setIdentifier(email);
        setUsername('');
      }
      setPassword('');
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    setUser(null);
    setStatus({ type: 'info', message: 'Logged out.' });
  }

  if (user) {
    const profileName = user.username || (user.email ? user.email.split('@')[0] : 'Player');
    const profileInitials = profileName.slice(0, 2).toUpperCase();

    return (
      <div className="page page-dashboard">
        <div className="dash-orb dash-orb-green"></div>
        <div className="dash-orb dash-orb-blue"></div>
        <div className="dash-orb dash-orb-red"></div>

        <main className="dashboard-screen">
          <header className="dashboard-topbar">
            <div className="dashboard-branding">
              <p className="eyebrow">Badminton Daddy</p>
              <h1>Performance Dashboard</h1>
              <p className="subcopy">Your court form and momentum at a glance.</p>
            </div>

            <div className="profile-card">
              <div className="profile-avatar">{profileInitials}</div>
              <div>
                <p className="profile-label">User Profile</p>
                <p className="profile-name">{profileName}</p>
              </div>
              <button className="primary profile-logout" onClick={handleLogout}>Log out</button>
            </div>
          </header>

          <section className="dashboard-hero">
            <h2>Ready for your next battle?</h2>
            <p>Keep your streak alive and sharpen your game this week.</p>
          </section>

          <section className="dashboard-stats-grid">
            <article className="dashboard-stat accent-green">
              <p className="tile-label">Matches Played</p>
              <p className="tile-value">24</p>
            </article>
            <article className="dashboard-stat accent-blue">
              <p className="tile-label">Win Rate</p>
              <p className="tile-value">67%</p>
            </article>
            <article className="dashboard-stat accent-red">
              <p className="tile-label">Best Streak</p>
              <p className="tile-value">5 Wins</p>
            </article>
            <article className="dashboard-stat accent-green">
              <p className="tile-label">Rallies Won</p>
              <p className="tile-value">142</p>
            </article>
          </section>

          <section className="dashboard-panels">
            <article className="dashboard-panel">
              <h3>Recent Form</h3>
              <ul className="form-list">
                <li><span>Singles</span><strong>W W L W</strong></li>
                <li><span>Doubles</span><strong>W L W W</strong></li>
                <li><span>Smash Accuracy</span><strong>73%</strong></li>
              </ul>
            </article>

            <article className="dashboard-panel">
              <h3>Training Focus</h3>
              <div className="focus-row">
                <span>Footwork</span>
                <div className="focus-track"><div className="focus-fill fill-green"></div></div>
              </div>
              <div className="focus-row">
                <span>Drop Shots</span>
                <div className="focus-track"><div className="focus-fill fill-blue"></div></div>
              </div>
              <div className="focus-row">
                <span>Net Control</span>
                <div className="focus-track"><div className="focus-fill fill-red"></div></div>
              </div>
            </article>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="glow"></div>
      <main className="shell">
        <section className="brand">
          <p className="eyebrow">Badminton Daddy</p>
          <h1>Sign in to who is your daddy.</h1>
          <p className="subcopy">
            Use your email and password to meet your daddy.
          </p>
          <div className="highlights">
            <div>
              <span>01</span>
              <p>Daddy Ranking</p>
            </div>
            <div>
              <span>02</span>
              <p>Schedule matches</p>
            </div>
            <div>
              <span>03</span>
              <p>Track your progress</p>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="tabs">
            <button
              className={isLogin ? 'active' : ''}
              onClick={() => setMode('login')}
            >
              Login
            </button>
            <button
              className={!isLogin ? 'active' : ''}
              onClick={() => setMode('register')}
            >
              Register
            </button>
          </div>
          <form onSubmit={handleSubmit} className="form">
              {isLogin ? (
                <label>
                  Email or Username
                  <input
                    type="text"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    placeholder="you@club.com or daddy99"
                    required
                  />
                </label>
              ) : (
                <>
                  <label>
                    Email
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@club.com"
                      required
                    />
                  </label>
                  <label>
                    Username
                    <input
                      type="text"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="daddy99"
                      required
                    />
                  </label>
                </>
              )}
              <label>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  required
                />
              </label>
              <button className="primary" type="submit" disabled={loading}>
                {loading ? 'Working...' : isLogin ? 'Login' : 'Create account'}
              </button>
          </form>

          {status && (
            <div className={`status ${status.type}`} role="status">
              {status.message}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
