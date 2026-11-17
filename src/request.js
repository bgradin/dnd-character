export async function request(path, options = {}) {
  const apiOrigin = process.env.NODE_ENV === 'production' ? 'https://www.gradinware.com' : '';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${apiOrigin}${path}`, {
      credentials: 'include', signal: controller.signal, ...options,
      headers: { 'Content-Type': 'application/json', 'X-Site-Action': '1', ...options.headers }
    });
    if (!response.ok) {
      const error = new Error(response.status === 409
        ? 'This sheet changed in another tab. Copy your changes before reloading.'
        : response.status === 401 ? 'Your session expired. Sign in again to save.'
        : response.status === 404 ? 'This character sheet could not be found.' : 'Unable to save or load. Please try again.');
      error.status = response.status;
      throw error;
    }
    return response.status === 204 ? null : await response.json();
  } finally { clearTimeout(timeout); }
}

