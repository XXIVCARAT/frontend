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

          {user ? (
            <div className="welcome">
              <h2>Welcome</h2>
              <p>{user.email}</p>
              <button className="primary" onClick={handleLogout}>Log out</button>
            </div>
          ) : (
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
          )}

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
