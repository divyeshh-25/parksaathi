const AUTH_STORAGE_KEY = 'parksaathi_auth_session';

export function getSession() {
  try {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!saved) {
      return null;
    }

    const session = JSON.parse(saved);

    if (
      !session ||
      !['admin', 'member'].includes(session.role) ||
      !session.token ||
      !session.userId
    ) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export function saveSession(session) {
  if (
    !session ||
    !['admin', 'member'].includes(session.role) ||
    !session.token ||
    !session.userId
  ) {
    throw new Error('Invalid authentication session.');
  }

  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify(session),
  );
}

export function clearSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function isLoggedIn() {
  return getSession() !== null;
}

export function isAdmin() {
  return getSession()?.role === 'admin';
}

export function isMember() {
  return getSession()?.role === 'member';
}

export function getAuthToken() {
  return getSession()?.token || null;
}

export function getAuthHeaders(additionalHeaders = {}) {
  const token = getAuthToken();

  return {
    Accept: 'application/json',
    ...additionalHeaders,
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };
}

export async function authFetch(url, options = {}) {
  const headers = getAuthHeaders(options.headers || {});

  return fetch(url, {
    ...options,
    headers,
  });
}