import { useEffect, useRef, useState } from 'react';
import { fetchDashboardStats, fetchSession, login, logout, register } from './api.js';

export default function App() {
  const [mode, setMode] = useState('login');
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const isLogin = mode === 'login';

  useEffect(() => {
    if (!profileMenuOpen) return;

    function handleDocumentClick(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [profileMenuOpen]);

  useEffect(() => {
    let isCancelled = false;

    fetchSession()
      .then((sessionUser) => {
        if (!isCancelled && sessionUser?.id) {
          setUser(sessionUser);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setUser(null);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setSessionLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setDashboardStats(null);
      return;
    }

    let isCancelled = false;

    fetchDashboardStats(user.id)
      .then((stats) => {
        if (!isCancelled) {
          setDashboardStats(stats);
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          if (error?.status === 401 || error?.status === 403) {
            setUser(null);
            setStatus({ type: 'info', message: 'Session expired. Please log in again.' });
            return;
          }
          setDashboardStats(null);
          setStatus({ type: 'error', message: error.message || 'Unable to load dashboard stats' });
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [user?.id]);

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

  async function handleLogout() {
    setProfileMenuOpen(false);

    try {
      await logout();
    } catch {
      // ignore; local UI state is still cleared below
    }

    setDashboardStats(null);
    setUser(null);
    setStatus({ type: 'info', message: 'Logged out.' });
  }

  if (sessionLoading) {
    return (
      <div className="page">
        <div className="glow"></div>
      </div>
    );
  }

  if (user) {
    const profileName = user.username || 'Player';
    const tier = dashboardStats?.tier || 'DIAMOND';
    const rank = dashboardStats?.rank ?? 0;
    const rating = dashboardStats?.rating ?? 0;
    const matchesPlayed = dashboardStats?.matchesPlayed ?? 0;
    const matchesWon = dashboardStats?.matchesWon ?? 0;
    const matchesLost = dashboardStats?.matchesLost ?? 0;
    const winRate = `${dashboardStats?.winRate ?? 0}%`;
    const winSummary = `${dashboardStats?.matchesWon ?? 0}W - ${dashboardStats?.matchesLost ?? 0}L`;

    return (
      <div className="page page-dashboard">
        <div className="dash-orb dash-orb-green"></div>
        <div className="dash-orb dash-orb-blue"></div>
        <div className="dash-orb dash-orb-red"></div>

        <main className="dashboard-frame">
          <header className="dash-header">
            <div className="dash-user-info">
              <p className="dash-kicker">BADMINTON DADDY</p>
              <p className="dash-user-title">
                <span className="dash-name-box">{profileName}</span>
                <span className="dash-badge">{tier}</span>
              </p>
            </div>
            <div className="dash-profile-menu" ref={profileMenuRef}>
              <button
                className="dash-avatar"
                onClick={() => setProfileMenuOpen((open) => !open)}
                title="Profile menu"
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
              >
                {profileName.slice(0, 2).toUpperCase()}
              </button>
              {profileMenuOpen && (
                <div className="dash-menu" role="menu">
                  <button className="dash-menu-item" onClick={handleLogout} role="menuitem">
                    Log out
                  </button>
                </div>
              )}
            </div>
          </header>

          <section className="dash-grid dash-grid-single">
            <article className="dash-card accent-blue">
              <p className="tile-label">Rank</p>
              <p className="tile-value">{rank}</p>
              
            </article>
            <article className="dash-card accent-blue">
              <p className="tile-label">Rating</p>
              <p className="tile-value">{rating}</p>
            </article>
            <article className="dash-card accent-green">
              <p className="tile-label">Matches Played</p>
              <p className="tile-value">{matchesPlayed}</p>
            </article>
            <article className="dash-card accent-green-strong is-win">
              <p className="tile-label">Matches Won</p>
              <p className="tile-value">{matchesWon}</p>
            </article>
            <article className="dash-card accent-red is-loss">
              <p className="tile-label">Matches Lost</p>
              <p className="tile-value">{matchesLost}</p>
            </article>
            <article className="dash-card accent-red">
              <p className="tile-label">Win Rate</p>
              <p className="tile-value">{winRate}</p>
              <p className="tile-sub">{winSummary}</p>
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
