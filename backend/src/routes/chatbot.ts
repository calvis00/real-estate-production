import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { leads, properties } from '../db/schema.js';
import { sanitizeCrmPayload, sanitizeEmail, sanitizePlainText } from '../utils/sanitize.js';

type ChatIntent =
  | 'GREETING'
  | 'PROPERTY_SEARCH'
  | 'PRICING'
  | 'HOME_LOAN'
  | 'LEGAL'
  | 'CONTACT_AGENT'
  | 'UNKNOWN';

const router = Router();

function parseBudgetRupees(text: string): number | undefined {
  const normalized = text.toLowerCase().replace(/,/g, '').trim();
  const croreMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(cr|crore)/);
  if (croreMatch?.[1]) return Math.round(Number(croreMatch[1]) * 10000000);

  const lakhMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(l|lac|lakh)/);
  if (lakhMatch?.[1]) return Math.round(Number(lakhMatch[1]) * 100000);

  const numberMatch = normalized.match(/\b(\d{5,10})\b/);
  if (numberMatch?.[1]) return Number(numberMatch[1]);

  return undefined;
}

function inferIntent(text: string): ChatIntent {
  const msg = text.toLowerCase();
  if (/(hi|hello|hey|vanakkam)\b/.test(msg)) return 'GREETING';
  if (/(price|budget|cost|emi|expensive|cheap|rate)\b/.test(msg)) return 'PRICING';
  if (/(loan|home loan|emi|interest|bank)\b/.test(msg)) return 'HOME_LOAN';
  if (/(legal|document|registration|patta|guideline|approval)\b/.test(msg)) return 'LEGAL';
  if (/(agent|call me|contact|phone|speak|talk to|site visit|visit)\b/.test(msg)) return 'CONTACT_AGENT';
  if (/(buy|rent|property|flat|villa|plot|apartment|house|home|listing|chennai|coimbatore)\b/.test(msg)) {
    return 'PROPERTY_SEARCH';
  }
  return 'UNKNOWN';
}

function inferType(text: string): string | undefined {
  const msg = text.toLowerCase();
  if (msg.includes('villa')) return 'VILLA';
  if (msg.includes('apartment') || msg.includes('flat')) return 'APARTMENT';
  if (msg.includes('plot') || msg.includes('land')) return 'PLOT';
  if (msg.includes('commercial') || msg.includes('office')) return 'COMMERCIAL';
  if (msg.includes('farmhouse')) return 'FARMHOUSE';
  return undefined;
}

function inferCity(text: string): string | undefined {
  const msg = text.toLowerCase();
  const cities = ['chennai', 'coimbatore', 'madurai', 'trichy', 'salem', 'tiruppur', 'erode'];
  return cities.find((city) => msg.includes(city));
}

function formatPriceINR(price: number) {
  if (price >= 10000000) return `Rs ${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `Rs ${(price / 100000).toFixed(2)} L`;
  return `Rs ${Math.round(price).toLocaleString('en-IN')}`;
}

function getReplyByIntent(intent: ChatIntent) {
  switch (intent) {
    case 'GREETING':
      return 'Hello. I can help with property options, budget guidance, and connecting you to an agent.';
    case 'PRICING':
      return 'Share your budget and preferred city/property type. I will suggest the best matching listings right away.';
    case 'HOME_LOAN':
      return 'For home loan planning, keep documents ready: income proof, ID/address proof, and bank statements. I can also connect an agent for EMI guidance.';
    case 'LEGAL':
      return 'Before booking, verify title deed, encumbrance certificate, approvals, and tax receipts. I can connect you to an agent for document support.';
    case 'CONTACT_AGENT':
      return 'I can connect you to our agent now. Please share your name and phone, then tap "Connect to Agent".';
    case 'PROPERTY_SEARCH':
      return 'Based on your request, here are some matching property suggestions.';
    default:
      return 'I can help with buying, renting, pricing, loan guidance, and scheduling an agent call. Tell me your city and budget.';
  }
}

router.post('/ask', async (req, res) => {
  try {
    const rawMessage = sanitizePlainText(req.body?.message) || '';
    const customerName = sanitizePlainText(req.body?.customerName);
    const phone = sanitizePlainText(req.body?.phone);
    const email = sanitizeEmail(req.body?.email);
    const createLead = Boolean(req.body?.createLead);

    if (!rawMessage && !createLead) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const intent = inferIntent(rawMessage);
    const budgetMax = parseBudgetRupees(rawMessage);
    const wantedType = inferType(rawMessage);
    const wantedCity = inferCity(rawMessage);

    const activeProperties = await db
      .select()
      .from(properties)
      .where(eq(properties.status, 'ACTIVE'))
      .limit(120);

    const scored = activeProperties
      .map((property) => {
        let score = 0;
        if (wantedType && property.category?.toUpperCase() === wantedType) score += 4;
        if (wantedCity && property.city?.toLowerCase().includes(wantedCity)) score += 3;
        if (budgetMax && property.price <= budgetMax) score += 2;
        if (property.featured) score += 1;
        return { property, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ property }) => ({
        id: property.id,
        title: property.title,
        city: property.city,
        locality: property.locality,
        category: property.category,
        price: formatPriceINR(property.price),
        image: property.images?.[0] || '',
      }));

    let leadId: number | undefined;
    if (createLead && customerName && phone) {
      const payload = sanitizeCrmPayload({
        customerName,
        phone,
        email,
        requirementText: rawMessage || 'Requested callback from AI assistant',
        preferredLocation: wantedCity,
        propertyType: wantedType,
        budgetMax,
        source: 'AI_CHATBOT',
        notes: 'Lead created via website AI chatbot handoff',
      });

      const [lead] = await db.insert(leads).values(payload as any).returning();
      leadId = lead?.id;
    }

    const reply = getReplyByIntent(intent);
    const suggestions = [
      'Show 2BHK options in Chennai under 1 Cr',
      'I need a villa under 2 Cr',
      'Help me with home loan steps',
      'Connect me to an agent',
    ];

    return res.json({
      message: 'Chatbot response generated',
      data: {
        intent,
        reply,
        suggestions,
        properties: scored,
        requiresAgentHandoff: intent === 'CONTACT_AGENT' || createLead,
        handoffCreated: Boolean(leadId),
        leadId,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to process chatbot request', error: error?.message });
  }
});

export default router;
