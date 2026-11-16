export function accountUrl(path, appUrl = window.location.href) {
  const destination = new URL(appUrl);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(destination.hostname);
  const accountOrigin = local
    ? `${destination.protocol}//${destination.hostname}:5000`
    : 'https://www.gradinware.com';
  const url = new URL(path, accountOrigin);
  url.searchParams.set('returnUrl', destination.href);
  return url.href;
}
