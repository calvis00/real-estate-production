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
  const csrfFromStorage = (() => {
    if (typeof window === 'undefined') {
      return '';
    }

    return window.localStorage.getItem('crmCsrfToken') || '';
  })();

  if (typeof document === 'undefined') {
    return csrfFromStorage;
  }

  const tokenCookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith('csrfToken='));

  if (!tokenCookie) {
    return csrfFromStorage;
  }

  const cookieToken = decodeURIComponent(tokenCookie.split('=').slice(1).join('='));
  if (cookieToken && typeof window !== 'undefined') {
    window.localStorage.setItem('crmCsrfToken', cookieToken);
  }
  return cookieToken || csrfFromStorage;
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
