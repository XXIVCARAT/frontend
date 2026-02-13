import { useEffect, useRef, useState } from 'react';
import {
  createMatchLogRequest,
  fetchDashboardStats,
  fetchMatchLogInbox,
  fetchMatchHistory,
  fetchPlayers,
  fetchSession,
  login,
  logout,
  register,
  respondToMatchLogRequest
} from './api.js';

const DEFAULT_MATCH_FORMAT = 'SINGLES';

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
  const [statsVersion, setStatsVersion] = useState(0);

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const notificationMenuRef = useRef(null);

  const [players, setPlayers] = useState([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [matchLogInbox, setMatchLogInbox] = useState([]);
  const [inboxVersion, setInboxVersion] = useState(0);
  const [decisionBusyId, setDecisionBusyId] = useState(null);
  const [matchHistory, setMatchHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyVersion, setHistoryVersion] = useState(0);

  const [matchLogModalOpen, setMatchLogModalOpen] = useState(false);
  const [matchLogSubmitting, setMatchLogSubmitting] = useState(false);
  const [matchFormat, setMatchFormat] = useState(DEFAULT_MATCH_FORMAT);
  const [winnerSide, setWinnerSide] = useState('TEAM');
  const [matchName, setMatchName] = useState('');
  const [teamPoints, setTeamPoints] = useState('');
  const [opponentPoints, setOpponentPoints] = useState('');
  const [teammateId, setTeammateId] = useState('');
  const [opponentOneId, setOpponentOneId] = useState('');
  const [opponentTwoId, setOpponentTwoId] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const rankingMock = [
    { rank: 1, username: 'xxivcarat', rating: 1865, wins: 27, losses: 9, winRate: 75, tier: 'DIAMOND' },
    { rank: 2, username: 'pop', rating: 1750, wins: 22, losses: 11, winRate: 67, tier: 'PLATINUM' },
    { rank: 3, username: 'suhalshetty99', rating: 1620, wins: 18, losses: 12, winRate: 60, tier: 'GOLD' },
    { rank: 4, username: 'xcx', rating: 1490, wins: 16, losses: 19, winRate: 46, tier: 'SILVER' },
    { rank: 5, username: 'efecc', rating: 1380, wins: 12, losses: 15, winRate: 44, tier: 'BRONZE' },
  ];

  const tierIcons = {
    BRONZE: '⬟',
    SILVER: '⬢',
    GOLD: '⬣',
    PLATINUM: '⬠',
    DIAMOND: '⬡'
  };

  const isLogin = mode === 'login';

  useEffect(() => {
    if (!profileMenuOpen && !notificationMenuOpen) return;

    function handleDocumentClick(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) {
        setNotificationMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false);
        setNotificationMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [profileMenuOpen, notificationMenuOpen]);

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
  }, [user?.id, statsVersion]);

  useEffect(() => {
    if (!user?.id) {
      setPlayers([]);
      return;
    }

    let isCancelled = false;

    fetchPlayers()
      .then((data) => {
        if (!isCancelled) {
          setPlayers(Array.isArray(data) ? data : []);
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          if (error?.status === 401 || error?.status === 403) {
            setUser(null);
            setStatus({ type: 'info', message: 'Session expired. Please log in again.' });
            return;
          }
          setStatus({ type: 'error', message: error.message || 'Unable to load players' });
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setMatchLogInbox([]);
      return;
    }

    let isCancelled = false;
    setInboxLoading(true);

    fetchMatchLogInbox()
      .then((rows) => {
        if (!isCancelled) {
          setMatchLogInbox(Array.isArray(rows) ? rows : []);
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          if (error?.status === 401 || error?.status === 403) {
            setUser(null);
            setStatus({ type: 'info', message: 'Session expired. Please log in again.' });
            return;
          }
          setStatus({ type: 'error', message: error.message || 'Unable to load match requests' });
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setInboxLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [user?.id, inboxVersion]);

  useEffect(() => {
    if (!user?.id) {
      setMatchHistory([]);
      return;
    }

    let isCancelled = false;
    setHistoryLoading(true);

    fetchMatchHistory()
      .then((rows) => {
        if (!isCancelled) {
          setMatchHistory(Array.isArray(rows) ? rows : []);
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          if (error?.status === 401 || error?.status === 403) {
            setUser(null);
            setStatus({ type: 'info', message: 'Session expired. Please log in again.' });
            return;
          }
          setStatus({ type: 'error', message: error.message || 'Unable to load match history' });
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setHistoryLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [user?.id, historyVersion, inboxVersion]);

  useEffect(() => {
    if (!user?.id) return;
    if (matchFormat === 'SINGLES') {
      setTeammateId('');
      setOpponentTwoId('');
    }
  }, [matchFormat, user?.id]);

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

  function resetMatchLogForm() {
    setMatchFormat(DEFAULT_MATCH_FORMAT);
    setWinnerSide('TEAM');
    setMatchName('');
    setTeamPoints('');
    setOpponentPoints('');
    setTeammateId('');
    setOpponentOneId('');
    setOpponentTwoId('');
  }

  function openMatchLogModal() {
    setProfileMenuOpen(false);
    setNotificationMenuOpen(false);
    resetMatchLogForm();
    setMatchLogModalOpen(true);
  }

  function closeMatchLogModal() {
    setMatchLogModalOpen(false);
  }

  function toUserId(value) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return null;
    }
    return parsed;
  }

  async function handleCreateMatchLog(event) {
    event.preventDefault();
    if (!user?.id) return;
    const teammate = toUserId(teammateId);
    const opponentOne = toUserId(opponentOneId);
    const opponentTwo = toUserId(opponentTwoId);

    const teamUserIds = matchFormat === 'DOUBLES' ? [user.id, teammate] : [user.id];
    const opponentUserIds = matchFormat === 'DOUBLES' ? [opponentOne, opponentTwo] : [opponentOne];

    const normalizedTeamPoints = teamPoints.trim();
    const normalizedOpponentPoints = opponentPoints.trim();

    if (!matchName.trim()) {
      setStatus({ type: 'error', message: 'Match name is required' });
      return;
    }

    if (opponentUserIds.some((id) => id === null) || teamUserIds.some((id) => id === null)) {
      setStatus({
        type: 'error',
        message: matchFormat === 'DOUBLES'
          ? 'Select 1 teammate and 2 opponents'
          : 'Select 1 opponent'
      });
      return;
    }

    if (teamUserIds.includes(user.id) && opponentUserIds.includes(user.id)) {
      setStatus({ type: 'error', message: 'You cannot be in opponent team' });
      return;
    }

    const allIds = [...teamUserIds, ...opponentUserIds];
    if (new Set(allIds).size !== allIds.length) {
      setStatus({ type: 'error', message: 'Same player cannot be selected more than once' });
      return;
    }

    if ((normalizedTeamPoints && !normalizedOpponentPoints) || (!normalizedTeamPoints && normalizedOpponentPoints)) {
      setStatus({
        type: 'error',
        message: 'Enter both team and opponent points, or leave both empty'
      });
      return;
    }

    setMatchLogSubmitting(true);

    try {
      await createMatchLogRequest({
        matchName: matchName.trim(),
        matchFormat,
        winnerSide,
        points: normalizedTeamPoints && normalizedOpponentPoints
          ? `${normalizedTeamPoints}-${normalizedOpponentPoints}`
          : null,
        teamUserIds,
        opponentUserIds
      });

      setStatus({ type: 'success', message: 'Match log request sent to all selected players.' });
      closeMatchLogModal();
      setInboxVersion((v) => v + 1);
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Unable to create match request' });
    } finally {
      setMatchLogSubmitting(false);
    }
  }

  async function handleDecision(requestId, decision) {
    setDecisionBusyId(`${requestId}:${decision}`);

    try {
      await respondToMatchLogRequest(requestId, decision);
      setStatus({ type: 'success', message: `Match request ${decision === 'ACCEPT' ? 'accepted' : 'rejected'}.` });
      setInboxVersion((v) => v + 1);
      setStatsVersion((v) => v + 1);
      setHistoryVersion((v) => v + 1);
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Unable to submit decision' });
    } finally {
      setDecisionBusyId(null);
    }
  }

  async function handleLogout() {
    setProfileMenuOpen(false);
    setNotificationMenuOpen(false);

    try {
      await logout();
    } catch {
      // ignore; local UI state is still cleared below
    }

    setDashboardStats(null);
    setMatchLogInbox([]);
    setMatchHistory([]);
    setPlayers([]);
    setMatchLogModalOpen(false);
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
    const playersPerSide = matchFormat === 'DOUBLES' ? 2 : 1;
    const totalRequiredPlayers = playersPerSide * 2;
    const teammateSelectedId = toUserId(teammateId);
    const opponentOneSelectedId = toUserId(opponentOneId);
    const opponentTwoSelectedId = toUserId(opponentTwoId);
    const selectedTotalPlayers = matchFormat === 'DOUBLES'
      ? 1 + (teammateSelectedId ? 1 : 0) + (opponentOneSelectedId ? 1 : 0) + (opponentTwoSelectedId ? 1 : 0)
      : 1 + (opponentOneSelectedId ? 1 : 0);
    const pendingRequests = matchLogInbox.filter((request) => request.status === 'PENDING');

    const teamMateOptions = players.filter((player) => {
      if (player.id === user.id) return false;
      if (opponentOneSelectedId === player.id || opponentTwoSelectedId === player.id) return false;
      return true;
    });
    const opponentOneOptions = players.filter((player) => {
      if (player.id === user.id) return false;
      if (teammateSelectedId === player.id) return false;
      if (opponentTwoSelectedId === player.id) return false;
      return true;
    });
    const opponentTwoOptions = players.filter((player) => {
      if (player.id === user.id) return false;
      if (teammateSelectedId === player.id) return false;
      if (opponentOneSelectedId === player.id) return false;
      return true;
    });

    if (activeTab === 'social') {
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

    if (activeTab === 'rank') {
      return (
        <div className="page page-dashboard">
          <section className="rank-list">
            <h2 className="rank-title">Leaderboard</h2>
            {rankingMock.map((row) => (
              <article key={row.rank} className="rank-card">
                <div className="rank-left">
                  <span className="rank-badge">#{row.rank}</span>
                  <div className="rank-user">
                    <p className="rank-name">{row.username}</p>
                  </div>
                </div>
                <div className="rank-columns">
                  <div className="rank-column">
                    <p className="rank-label rank-record-label">Record</p>
                    <p className="rank-record">
                      <span className="rank-win">{row.wins}W</span>
                      <span className="rank-sep"> • </span>
                      <span className="rank-loss">{row.losses}L</span>
                    </p>
                  </div>
                  <div className="rank-column">
                    <p className="rank-label">Win Rate</p>
                    <p className="rank-rating">{row.winRate}%</p>
                  </div>
                  <div className="rank-column">
                    <p className="rank-label">Rating</p>
                    <p className="rank-rating">{row.rating}</p>
                  </div>
                  <div className="rank-column">
                    <p className="rank-label">Tier</p>
                    <span className={`rank-tier rank-tier-${row.tier.toLowerCase()}`}>
                      <span className="rank-tier-icon">{tierIcons[row.tier] || '★'}</span>
                      {row.tier}
                    </span>
                  </div>
                </div>
              </article>
            ))}
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
            <div className="dash-header-actions">
              <div className="dash-profile-menu" ref={notificationMenuRef}>
                <button
                  className="dash-bell-btn"
                  onClick={() => {
                    setNotificationMenuOpen((open) => !open);
                    setProfileMenuOpen(false);
                  }}
                  title="Notifications"
                  aria-haspopup="menu"
                  aria-expanded={notificationMenuOpen}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="dash-bell-icon">
                    <path d="M12 3a5 5 0 0 0-5 5v2.8c0 .9-.3 1.8-.8 2.6L4.8 15a1 1 0 0 0 .8 1.6h12.8a1 1 0 0 0 .8-1.6l-1.4-1.6a4.8 4.8 0 0 1-.8-2.6V8a5 5 0 0 0-5-5Zm0 18a2.5 2.5 0 0 0 2.4-2h-4.8A2.5 2.5 0 0 0 12 21Z" />
                  </svg>
                  {pendingRequests.length > 0 && (
                    <span className="dash-notif-badge">{pendingRequests.length}</span>
                  )}
                </button>
                {notificationMenuOpen && (
                  <div className="dash-menu dash-notif-menu" role="menu">
                    <p className="dash-notif-title">Pending Requests</p>
                    {pendingRequests.length === 0 ? (
                      <p className="dash-notif-empty">No pending requests.</p>
                    ) : (
                      <div className="dash-notif-list">
                        {pendingRequests.map((request) => {
                          const teamNames = request.participants
                            .filter((participant) => participant.teamSide === 'TEAM')
                            .map((participant) => participant.username)
                            .join(', ');
                          const opponentNames = request.participants
                            .filter((participant) => participant.teamSide === 'OPPONENT')
                            .map((participant) => participant.username)
                            .join(', ');
                          const winnerNames = request.winnerSide === 'TEAM' ? teamNames : opponentNames;
                          const loserNames = request.winnerSide === 'TEAM' ? opponentNames : teamNames;

                          const myParticipant = request.participants.find((participant) => participant.userId === user.id);
                          const userWon = myParticipant ? myParticipant.teamSide === request.winnerSide : null;
                          const userOutcomeText = userWon === null
                            ? 'You are not in this match'
                            : userWon
                              ? 'You won this match'
                              : 'You lost this match';
                          const decisionDisabled = decisionBusyId !== null || !request.canRespond;

                          const scoreParts = (request.points || '')
                            .split('-')
                            .map((part) => part.trim())
                            .filter(Boolean);
                          const scoreText = scoreParts.length === 2
                            ? `Points: Team ${scoreParts[0]} - Opponent ${scoreParts[1]}`
                            : (request.points ? `Points: ${request.points}` : 'Points: Not provided');

                          return (
                            <article key={`notif-${request.id}`} className="dash-notif-item">
                              <p className="dash-notif-item-title">{request.matchName}</p>
                              <p className={`dash-notif-result ${userWon ? 'won' : userWon === false ? 'lost' : ''}`}>
                                {userOutcomeText}
                              </p>
                              <p className="dash-notif-item-meta">{request.matchFormat} | By {request.createdByUsername}</p>
                              <p className="dash-notif-item-meta">
                                Winner: <span className="dash-notif-emph win">{winnerNames || '-'}</span>
                              </p>
                              <p className="dash-notif-item-meta">
                                Loser: <span className="dash-notif-emph loss">{loserNames || '-'}</span>
                              </p>
                              <p className="dash-notif-item-meta">{scoreText}</p>
                              <div className="dash-notif-actions">
                                <button
                                  type="button"
                                  className="dash-menu-item approve-btn"
                                  disabled={decisionDisabled}
                                  onClick={() => handleDecision(request.id, 'ACCEPT')}
                                >
                                  {decisionBusyId === `${request.id}:ACCEPT` ? 'Submitting...' : 'Accept'}
                                </button>
                                <button
                                  type="button"
                                  className="dash-menu-item reject-btn"
                                  disabled={decisionDisabled}
                                  onClick={() => handleDecision(request.id, 'REJECT')}
                                >
                                  {decisionBusyId === `${request.id}:REJECT` ? 'Submitting...' : 'Reject'}
                                </button>
                              </div>
                              {!request.canRespond && (
                                <p className="dash-notif-wait">
                                  {userWon ? 'Pending - winner side cannot approve/reject' : 'Pending - waiting for other losing players'}
                                </p>
                              )}
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="dash-profile-menu" ref={profileMenuRef}>
                <button
                  className="dash-avatar"
                  onClick={() => {
                    setProfileMenuOpen((open) => !open);
                    setNotificationMenuOpen(false);
                  }}
                  title="Profile menu"
                  aria-haspopup="menu"
                  aria-expanded={profileMenuOpen}
                >
                  {profileName.slice(0, 2).toUpperCase()}
                </button>
                {profileMenuOpen && (
                  <div className="dash-menu" role="menu">
                    <button className="dash-menu-item" onClick={openMatchLogModal} role="menuitem">
                      Log match
                    </button>
                    <button className="dash-menu-item" onClick={handleLogout} role="menuitem">
                      Log out
                    </button>
                  </div>
                )}
              </div>
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

          <section className="match-history-section">
            <div className="match-history-header">
              <h2>Match History</h2>
              <button type="button" className="dash-menu-item dash-action-btn" onClick={openMatchLogModal}>
                Log Match
              </button>
            </div>

            {historyLoading ? (
              <p className="match-history-empty">Loading match history...</p>
            ) : matchHistory.length === 0 ? (
              <p className="match-history-empty">No approved matches yet.</p>
            ) : (
              <div className="match-history-list">
                {matchHistory.map((item) => {
                  const myTeamList = item.userTeamSide === 'TEAM' ? item.teamUsernames : item.opponentUsernames;
                  const oppList = item.userTeamSide === 'TEAM' ? item.opponentUsernames : item.teamUsernames;
                  const myNames = Array.isArray(myTeamList) ? myTeamList : [];
                  const oppNames = Array.isArray(oppList) ? oppList : [];
                  const scoreParts = (item.points || '').split('-').map((p) => p.trim()).filter(Boolean);
                  const scoreDisplay = scoreParts.length === 2 ? `${scoreParts[0]} - ${scoreParts[1]}` : '—';
                  const dateText = item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toLowerCase()
                    : '';
                  const winnerSide = item.winnerSide || '';
                  const mySideIsWinner = winnerSide === item.userTeamSide;

                  return (
                    <article key={item.id} className={`match-history-card compact ${item.userWon ? 'win' : 'loss'}`}>
                      <div className="mh-row mh-top">
                        <span className="mh-date">{dateText || '—'}</span>
                        <span className="mh-dot">•</span>
                        <span className="mh-format">{item.matchFormat || 'Match'}</span>
                        <span className={`mh-badge ${item.userWon ? 'mh-badge-win' : 'mh-badge-loss'}`}>
                          {item.userWon ? 'WIN' : 'LOSS'}
                        </span>
                      </div>
                      <div className="mh-row mh-versus">
                        <div className="mh-chip-group">
                          {myNames.map((name, idx) => (
                            <span key={`my-${item.id}-${idx}`} className={`mh-chip ${mySideIsWinner ? 'mh-chip-win' : 'mh-chip-loss'}`}>
                              {name}
                            </span>
                          ))}
                        </div>
                        <span className="mh-vs">vs</span>
                        <div className="mh-chip-group">
                          {oppNames.map((name, idx) => (
                            <span key={`opp-${item.id}-${idx}`} className={`mh-chip ${!mySideIsWinner ? 'mh-chip-win' : 'mh-chip-loss'}`}>
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="mh-row mh-score">
                        <span className="mh-score-value">{scoreDisplay}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </main>

        {matchLogModalOpen && (
          <div className="match-log-modal-backdrop" onClick={closeMatchLogModal}>
            <div className="match-log-modal" onClick={(event) => event.stopPropagation()}>
              <div className="match-log-header">
                <h2>Log Match</h2>
              </div>

              <form className="match-log-form" onSubmit={handleCreateMatchLog}>
                <div className="match-format-toggle">
                  <button
                    type="button"
                    className={matchFormat === 'SINGLES' ? 'active' : ''}
                    onClick={() => setMatchFormat('SINGLES')}
                  >
                    Singles
                  </button>
                  <button
                    type="button"
                    className={matchFormat === 'DOUBLES' ? 'active' : ''}
                    onClick={() => setMatchFormat('DOUBLES')}
                  >
                    Doubles
                  </button>
                </div>
                <p className="slot-hint">
                  {matchFormat === 'DOUBLES' ? 'Doubles: 4 players total (2 vs 2).' : 'Singles: 2 players total (1 vs 1).'}
                  {' '}Selected {selectedTotalPlayers}/{totalRequiredPlayers}.
                </p>

                <label>
                  Match Name
                  <input
                    type="text"
                    value={matchName}
                    onChange={(event) => setMatchName(event.target.value)}
                    placeholder="Weekend Smash"
                    required
                  />
                </label>

                <div className="team-columns">
                  <div className={`team-card ${winnerSide === 'TEAM' ? 'win' : 'loss'}`}>
                    <div className="team-card-top">
                      <h3>My Team ({matchFormat === 'DOUBLES' ? '2' : '1'} players)</h3>
                      <div className="wl-toggle">
                        <button
                          type="button"
                          className={winnerSide === 'TEAM' ? 'active' : ''}
                          onClick={() => setWinnerSide('TEAM')}
                        >
                          W
                        </button>
                        <button
                          type="button"
                          className={winnerSide === 'OPPONENT' ? 'active' : ''}
                          onClick={() => setWinnerSide('OPPONENT')}
                        >
                          L
                        </button>
                      </div>
                    </div>
                    <label className="inline-field">
                      You
                      <input type="text" value={profileName} readOnly />
                    </label>
                    {matchFormat === 'DOUBLES' && (
                      <label className="inline-field">
                        Teammate
                        <select value={teammateId} onChange={(event) => setTeammateId(event.target.value)}>
                          <option value="">Select teammate</option>
                          {teamMateOptions.map((player) => (
                            <option key={player.id} value={player.id}>{player.username || `Player ${player.id}`}</option>
                          ))}
                        </select>
                      </label>
                    )}
                    <label className="inline-field">
                      Team Points (Optional)
                      <input
                        type="number"
                        min={0}
                        value={teamPoints}
                        onChange={(event) => setTeamPoints(event.target.value)}
                        placeholder="21"
                      />
                    </label>
                  </div>

                  <div className={`team-card ${winnerSide === 'OPPONENT' ? 'win' : 'loss'}`}>
                    <div className="team-card-top">
                      <h3>Opponent Team ({matchFormat === 'DOUBLES' ? '2' : '1'} players)</h3>
                      <div className="wl-toggle">
                        <button
                          type="button"
                          className={winnerSide === 'OPPONENT' ? 'active' : ''}
                          onClick={() => setWinnerSide('OPPONENT')}
                        >
                          W
                        </button>
                        <button
                          type="button"
                          className={winnerSide === 'TEAM' ? 'active' : ''}
                          onClick={() => setWinnerSide('TEAM')}
                        >
                          L
                        </button>
                      </div>
                    </div>
                    <label className="inline-field">
                      Opponent 1
                      <select value={opponentOneId} onChange={(event) => setOpponentOneId(event.target.value)}>
                        <option value="">Select player</option>
                        {opponentOneOptions.map((player) => (
                          <option key={player.id} value={player.id}>{player.username || `Player ${player.id}`}</option>
                        ))}
                      </select>
                    </label>
                    {matchFormat === 'DOUBLES' && (
                      <label className="inline-field">
                        Opponent 2
                        <select value={opponentTwoId} onChange={(event) => setOpponentTwoId(event.target.value)}>
                          <option value="">Select player</option>
                          {opponentTwoOptions.map((player) => (
                            <option key={player.id} value={player.id}>{player.username || `Player ${player.id}`}</option>
                          ))}
                        </select>
                      </label>
                    )}
                    <label className="inline-field">
                      Opponent Points (Optional)
                      <input
                        type="number"
                        min={0}
                        value={opponentPoints}
                        onChange={(event) => setOpponentPoints(event.target.value)}
                        placeholder="18"
                      />
                    </label>
                  </div>
                </div>

                <div className="match-log-footer">
                  <div></div>
                  <button className="primary match-log-submit" type="submit" disabled={matchLogSubmitting}>
                    {matchLogSubmitting ? 'Submitting...' : 'Create Request'}
                  </button>
                  <button type="button" className="match-log-cancel" onClick={closeMatchLogModal}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
            onClick={() => {
              setActiveTab('social');
              setStatus({ type: 'info', message: 'Social features are coming soon.' });
            }}
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
