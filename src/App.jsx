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
        const loginIdentifier = identifier.trim();
        const identifierFallback = loginIdentifier && !loginIdentifier.includes('@') ? loginIdentifier : '';
        const resolvedUsername = (data.username && data.username.trim()) ? data.username : identifierFallback;
        const resolvedUser = { ...data, username: resolvedUsername || null };

        setUser(resolvedUser);
        setStatus({ type: 'success', message: `Welcome back, ${resolvedUsername || 'Player'}` });
      } else {
        const data = await register(email, username, password);
        setStatus({ type: 'success', message: `Account created for ${data.username || username}. You can log in now.` });
        setMode('login');
        setIdentifier(data.username || username);
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
    const profileName = user.username || 'Player';

    return (
      <div className="page page-dashboard">
        <div className="dash-orb dash-orb-green"></div>
        <div className="dash-orb dash-orb-blue"></div>
        <div className="dash-orb dash-orb-red"></div>

        <main className="dashboard-frame">
          <header className="dash-header">
            <p className="dash-kicker">BADMINTON DADDY</p>
            <button className="dash-avatar" onClick={handleLogout} title="Log out">
              {profileName.slice(0, 2).toUpperCase()}
            </button>
          </header>

          <section className="dash-intro">
            <h1>
              Welcome back {profileName}
              <span className="dash-badge">DIAMOND</span>
            </h1>
            <p>Your court form and momentum at a glance.</p>
          </section>

          <section className="dash-hero-card">
            <h2>Ready for your next battle?</h2>
            <p>Keep your streak alive and sharpen your game this week.</p>
          </section>

          <section className="dash-grid dash-grid-top">
            <article className="dash-card accent-green">
              <p className="tile-label">Rank</p>
              <p className="tile-value">4</p>
              <p className="tile-sub">#4</p>
            </article>
            <article className="dash-card accent-blue">
              <p className="tile-label">Rating</p>
              <p className="tile-value">1850</p>
              <p className="tile-sub">Primary</p>
            </article>
            <article className="dash-card accent-green">
              <p className="tile-label">Matches Won</p>
              <p className="tile-value">16</p>
              <p className="tile-sub">Total</p>
            </article>
            <article className="dash-card accent-blue">
              <p className="tile-label">Matches Lost</p>
              <p className="tile-value">8</p>
              <p className="tile-sub">Total</p>
            </article>
          </section>

          <section className="dash-grid dash-grid-bottom">
            <article className="dash-card accent-green">
              <p className="tile-label">Matches Played</p>
              <p className="tile-value">24</p>
              <p className="tile-sub">Total</p>
            </article>
            <article className="dash-card accent-blue">
              <p className="tile-label">Matches Won</p>
              <p className="tile-value">16</p>
              <p className="tile-sub">Total</p>
            </article>
            <article className="dash-card accent-red">
              <p className="tile-label">Win Rate</p>
              <p className="tile-value">67%</p>
              <p className="tile-sub">16W - 8L</p>
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
