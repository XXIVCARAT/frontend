const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

function normalizeErrorMessage(message, status) {
  const text = (message || '').toLowerCase();

  if (status === 409) {
    if (text.includes('email')) return 'Email already exists';
    if (text.includes('username')) return 'Username already exists';
  }

  if (status === 401) {
    return 'Password invalid';
  }

  if (status === 404) {
    return 'Account does not exist';
  }

  if (status === 400) {
    if (text.includes('password')) return 'Password invalid';
    if (text.includes('email')) return 'Email invalid';
    if (text.includes('username')) return 'Username invalid';
  }

  return message || 'Request failed';
}

async function handleResponse(response) {
  if (response.ok) {
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

  const error = new Error(normalizeErrorMessage(message, response.status));
  error.status = response.status;
  throw error;
}

export async function login(identifier, password) {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ identifier, password })
  });

  return handleResponse(response);
}

export async function register(email, username, password) {
  const response = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ email, username, password })
  });

  return handleResponse(response);
}
