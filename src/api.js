const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

function normalizeApiBaseUrl(rawUrl) {
  if (!rawUrl || !rawUrl.trim()) return '';
  const trimmed = rawUrl.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, '');
}

const configuredApiBase = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);
const API_BASE = configuredApiBase
  || (isLocalHost ? 'http://localhost:8080' : 'https://badminton-backend-z96t.onrender.com');

function normalizeErrorMessage(message, status, operation) {
  const text = (message || '').toLowerCase();
  const loginFailureMessage = 'Account doesnot exist Or Password incorrect error';

  if (status === 409) {
    if (text.includes('email')) return 'Email id already in use';
    if (text.includes('username')) return 'Username taken';
  }

  if ((status === 401 || status === 404) && operation === 'login') {
    return loginFailureMessage;
  }

  if (status === 400) {
    if (text.includes('password')) return 'Password invalid';
    if (text.includes('email')) return 'Email invalid';
    if (text.includes('username')) return 'Username invalid';
  }

  return message || 'Request failed';
}

async function handleResponse(response, operation) {
  if (response.ok) {
    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) {
      return null;
    }

    return response.json();
  }

  let message = '';
  try {
    const text = await response.text();
    if (text) {
      try {
        const data = JSON.parse(text);
        if (data?.message) {
          message = data.message;
        } else if (data?.detail) {
          message = data.detail;
        } else if (data?.error) {
          message = data.error;
        } else if (data?.title) {
          message = data.title;
        }
      } catch {
        message = text;
      }
    }
  } catch {
    // ignore
  }

  if (!message) {
    message = response.statusText || 'Request failed';
  }

  const error = new Error(normalizeErrorMessage(message, response.status, operation));
  error.status = response.status;
  throw error;
}

export async function login(identifier, password) {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ identifier, password })
  });

  return handleResponse(response, 'login');
}

export async function register(email, username, password) {
  const response = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ email, username, password })
  });

  return handleResponse(response, 'register');
}

export async function fetchDashboardStats(userId) {
  const response = await fetch(`${API_BASE}/api/users/${userId}/stats`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Accept': 'application/json' }
  });

  return handleResponse(response, 'stats');
}

export async function fetchSession() {
  const response = await fetch(`${API_BASE}/api/auth/me`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Accept': 'application/json' }
  });

  return handleResponse(response, 'session');
}

export async function logout() {
  const response = await fetch(`${API_BASE}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Accept': 'application/json' }
  });

  return handleResponse(response, 'logout');
}

export async function fetchPlayers() {
  const response = await fetch(`${API_BASE}/api/players`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Accept': 'application/json' }
  });

  return handleResponse(response, 'players');
}

export async function createMatchLogRequest(payload) {
  const response = await fetch(`${API_BASE}/api/match-log/requests`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(payload)
  });

  return handleResponse(response, 'create-match-log');
}

export async function fetchMatchLogInbox() {
  const response = await fetch(`${API_BASE}/api/match-log/requests/inbox`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Accept': 'application/json' }
  });

  return handleResponse(response, 'match-log-inbox');
}

export async function respondToMatchLogRequest(requestId, decision) {
  const response = await fetch(`${API_BASE}/api/match-log/requests/${requestId}/decision`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ decision })
  });

  return handleResponse(response, 'respond-match-log');
}

export async function fetchMatchHistory() {
  const response = await fetch(`${API_BASE}/api/match-log/requests/history`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Accept': 'application/json' }
  });

  return handleResponse(response, 'match-history');
}

export async function fetchLeaderboard() {
  const response = await fetch(`${API_BASE}/api/leaderboard`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Accept': 'application/json' }
  });

  return handleResponse(response, 'leaderboard');
}
