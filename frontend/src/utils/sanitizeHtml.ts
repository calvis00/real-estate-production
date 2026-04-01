import DOMPurify from 'dompurify';

export function sanitizeHtml(html: string) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'blockquote', 'br', 'em', 'h1', 'h2', 'h3', 'h4', 'i', 'li', 'ol', 'p', 'strong', 'u', 'ul'],
    ALLOWED_ATTR: [],
  }).trim();
}
