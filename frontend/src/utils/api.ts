const getFallbackApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8081`;
  }

  return 'http://localhost:8081';
};

export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') || getFallbackApiBaseUrl();

export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${apiBaseUrl}${normalizedPath}`;
};

export const getCsrfToken = () => {
  if (typeof document === 'undefined') {
    return '';
  }

  const tokenCookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith('csrfToken='));

  if (!tokenCookie) {
    return '';
  }

  return decodeURIComponent(tokenCookie.split('=').slice(1).join('='));
};

export const withCsrfHeader = (headers: Record<string, string> = {}) => {
  const csrfToken = getCsrfToken();
  if (!csrfToken) {
    return headers;
  }

  return {
    ...headers,
    'x-csrf-token': csrfToken,
  };
};
