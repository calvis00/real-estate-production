import sanitizeHtmlLib from 'sanitize-html';

const CONTROL_CHARS_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const ALLOWED_HTML_TAGS = ['b', 'blockquote', 'br', 'em', 'h1', 'h2', 'h3', 'h4', 'i', 'li', 'ol', 'p', 'strong', 'u', 'ul'];

function normalizeWhitespace(value: string) {
  return value.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();
}

export function sanitizePlainText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  return normalizeWhitespace(value.replace(CONTROL_CHARS_REGEX, ''));
}

export function sanitizeLooseText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  return value.replace(CONTROL_CHARS_REGEX, '').trim();
}

export function sanitizeEmail(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const sanitizedEmail = sanitizePlainText(value);
  return sanitizedEmail?.toLowerCase();
}

export function sanitizeStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .map((item) => sanitizePlainText(item))
    .filter((item): item is string => typeof item === 'string' && item.length > 0);
}

export function sanitizeHtml(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;

  return sanitizeHtmlLib(value.replace(CONTROL_CHARS_REGEX, ''), {
    allowedTags: ALLOWED_HTML_TAGS,
    allowedAttributes: {},
    allowedSchemes: ['http', 'https', 'mailto'],
    disallowedTagsMode: 'discard',
  }).trim();
}

export function sanitizeCrmPayload(payload: Record<string, unknown>) {
  return {
    customerName: sanitizePlainText(payload.customerName),
    phone: sanitizePlainText(payload.phone),
    email: sanitizeEmail(payload.email),
    requirementText: sanitizePlainText(payload.requirementText),
    propertyType: sanitizePlainText(payload.propertyType),
    preferredLocation: sanitizePlainText(payload.preferredLocation),
    budgetMin: payload.budgetMin,
    budgetMax: payload.budgetMax,
    status: sanitizePlainText(payload.status),
    priority: sanitizePlainText(payload.priority),
    source: sanitizePlainText(payload.source),
    assignedTo: sanitizeLooseText(payload.assignedTo),
    nextFollowUpDate: payload.nextFollowUpDate,
    lastContactedAt: payload.lastContactedAt,
    notes: sanitizePlainText(payload.notes),
    tags: sanitizeStringArray(payload.tags),
    isConverted: payload.isConverted,
    convertedAt: payload.convertedAt,
  };
}

export function sanitizePropertyPayload(payload: Record<string, unknown>) {
  return {
    title: sanitizePlainText(payload.title),
    description: sanitizeHtml(payload.description),
    price: payload.price,
    city: sanitizePlainText(payload.city),
    locality: sanitizePlainText(payload.locality),
    bedrooms: payload.bedrooms,
    bathrooms: payload.bathrooms,
    areaSqft: payload.areaSqft,
    type: sanitizePlainText(payload.type),
    category: sanitizePlainText(payload.category),
    featured: payload.featured,
    verified: payload.verified,
    status: sanitizePlainText(payload.status),
    tags: Array.isArray(payload.tags)
      ? sanitizeStringArray(payload.tags)
      : typeof payload.tags === 'string'
        ? payload.tags
            .split(',')
            .map((tag) => sanitizePlainText(tag))
            .filter((tag): tag is string => typeof tag === 'string' && tag.length > 0)
        : payload.tags,
  };
}
