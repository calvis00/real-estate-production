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
