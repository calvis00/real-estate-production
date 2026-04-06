'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { apiUrl } from '@/utils/api';

type AuthState = {
  loading: boolean;
  isAuthed: boolean;
  role: string;
  name: string;
};

type BotProperty = {
  id: string;
  title: string;
  city: string;
  locality: string;
  category: string;
  price: string;
  image: string;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'bot';
  text: string;
  properties?: BotProperty[];
};

const stripUnsafeText = (value: string) =>
  value.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();

export default function UnifiedCommWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [auth, setAuth] = useState<AuthState>({
    loading: true,
    isAuthed: false,
    role: '',
    name: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formState, setFormState] = useState({
    name: '',
    phone: '',
    message: '',
  });
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    'Show 2BHK options in Chennai under 1 Cr',
    'I need a villa under 2 Cr',
    'Help me with home loan steps',
    'Connect me to an agent',
  ]);
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'bot',
      text: 'Hi, I am your real estate assistant. Ask me about budget, area, loan guidance, or request an agent callback.',
    },
  ]);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  const isCrmRoute = pathname.startsWith('/crm');
  const propertyId = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length === 2 && parts[0] === 'properties') {
      return parts[1];
    }
    return '';
  }, [pathname]);

  useEffect(() => {
    if (isCrmRoute) {
      return;
    }

    let alive = true;
    const loadMe = async () => {
      try {
        const response = await fetch(apiUrl('/api/auth/me'), {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!alive) {
          return;
        }

        if (!response.ok) {
          setAuth({
            loading: false,
            isAuthed: false,
            role: '',
            name: '',
          });
          return;
        }

        const payload = await response.json();
        const me = payload?.data;
        setAuth({
          loading: false,
          isAuthed: true,
          role: String(me?.role || ''),
          name: String(me?.name || ''),
        });
      } catch (error) {
        if (!alive) {
          return;
        }
        setAuth({
          loading: false,
          isAuthed: false,
          role: '',
          name: '',
        });
      }
    };

    void loadMe();
    return () => {
      alive = false;
    };
  }, [isCrmRoute]);

  if (isCrmRoute) {
    return null;
  }

  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, isOpen]);

  const askBot = async (input: string, options?: { createLead?: boolean }) => {
    const cleanInput = stripUnsafeText(input);
    if (!cleanInput) return;

    setAsking(true);
    setSubmitError('');
    setSubmitMessage('');
    setMessages((current) => [
      ...current,
      { id: `${Date.now()}-u`, role: 'user', text: cleanInput },
    ]);

    try {
      const response = await fetch(apiUrl('/api/chatbot/ask'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: cleanInput,
          createLead: Boolean(options?.createLead),
          customerName: stripUnsafeText(formState.name),
          phone: stripUnsafeText(formState.phone),
          email: '',
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || 'Assistant unavailable now.');
      }

      const data = payload?.data as
        | {
            reply?: string;
            suggestions?: string[];
            properties?: BotProperty[];
            requiresAgentHandoff?: boolean;
            handoffCreated?: boolean;
          }
        | undefined;
      const reply = data?.reply || 'I could not process that. Please try again.';
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-b`,
          role: 'bot',
          text: reply,
          properties: Array.isArray(data?.properties) ? data?.properties : [],
        },
      ]);

      if (Array.isArray(data?.suggestions) && data.suggestions.length) {
        setSuggestions(data.suggestions);
      }
      if (data?.requiresAgentHandoff) {
        setShowAgentForm(true);
      }
      if (data?.handoffCreated) {
        setSubmitMessage('Agent callback request created successfully.');
      }
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-e`,
          role: 'bot',
          text: error instanceof Error ? error.message : 'Could not respond now.',
        },
      ]);
    } finally {
      setAsking(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError('');
    setSubmitMessage('');

    const customerName = stripUnsafeText(formState.name);
    const phone = stripUnsafeText(formState.phone);
    const message = stripUnsafeText(formState.message);

    if (!customerName || !phone || !message) {
      setSubmitError('Please fill all fields before sending.');
      return;
    }
    setSubmitting(true);
    await askBot(message, { createLead: true });
    setFormState({
      name: customerName,
      phone,
      message: '',
    });
    setSubmitting(false);
  };

  return (
    <div className="fixed bottom-5 right-5 z-[90]">
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2 rounded-full border border-primary/20 bg-primary px-4 py-3 text-white shadow-2xl transition hover:-translate-y-0.5 hover:bg-primary/95"
          aria-label="Open chat and enquiry widget"
        >
          <span className="material-symbols-outlined text-secondary text-base">chat</span>
          <span className="text-xs font-black uppercase tracking-[0.15em]">Chat</span>
        </button>
      )}

      {isOpen && (
        <div className="w-[min(92vw,360px)] rounded-3xl border border-surface-container bg-surface p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-[0.15em] text-primary">
              Chat + Enquiry
            </h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-outline transition hover:bg-background hover:text-primary"
              aria-label="Close widget"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          <div className="space-y-3">
            {auth.isAuthed && ['ADMIN', 'SALES', 'VIEWER'].includes(auth.role) && (
              <button
                type="button"
                onClick={() => router.push('/crm/chat')}
                className="w-full rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-left transition hover:bg-primary/10"
              >
                <p className="text-xs font-black uppercase tracking-[0.12em] text-primary">
                  Open CRM Chat
                </p>
                <p className="mt-1 text-[11px] font-semibold text-outline">
                  {auth.name ? `Signed in as ${auth.name}` : 'You are signed in'}
                </p>
              </button>
            )}

            {!auth.loading && !auth.isAuthed && (
              <button
                type="button"
                onClick={() => router.push('/crm/login')}
                className="w-full rounded-2xl border border-secondary/30 bg-secondary/10 px-4 py-3 text-left transition hover:bg-secondary/20"
              >
                <p className="text-xs font-black uppercase tracking-[0.12em] text-primary">
                  CRM Login
                </p>
                <p className="mt-1 text-[11px] font-semibold text-outline">
                  Login to chat with clients in CRM
                </p>
              </button>
            )}

            <div ref={messagesRef} className="max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-surface-container bg-background p-3">
              {messages.map((messageItem) => (
                <div key={messageItem.id} className={`rounded-xl px-3 py-2 ${messageItem.role === 'user' ? 'ml-6 bg-primary text-white' : 'mr-6 border border-surface-container bg-surface text-on-surface'}`}>
                  <p className="text-xs font-semibold">{messageItem.text}</p>
                  {!!messageItem.properties?.length && (
                    <div className="mt-2 space-y-2">
                      {messageItem.properties.map((property) => (
                        <button
                          type="button"
                          key={property.id}
                          onClick={() => router.push(`/properties/${property.id}`)}
                          className="block w-full rounded-lg border border-surface-container bg-background px-2 py-2 text-left transition hover:border-primary/40"
                        >
                          <p className="text-[11px] font-black uppercase tracking-[0.08em] text-primary">{property.title}</p>
                          <p className="text-[11px] font-semibold text-outline">{property.locality}, {property.city}</p>
                          <p className="text-[11px] font-black text-secondary">{property.price}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {asking && (
                <div className="mr-6 rounded-xl border border-surface-container bg-surface px-3 py-2 text-xs font-semibold text-outline">
                  Assistant is typing...
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {suggestions.slice(0, 3).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    setQuestion(suggestion);
                    void askBot(suggestion);
                  }}
                  className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[10px] font-bold text-primary transition hover:bg-primary/10"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                const q = question;
                setQuestion('');
                void askBot(q);
              }}
              className="space-y-2 rounded-2xl border border-surface-container bg-background p-3"
            >
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-primary">
                Ask Your Doubt
              </p>
              {propertyId && (
                <p className="text-[10px] font-bold uppercase tracking-wider text-outline">
                  Linked to property #{propertyId}
                </p>
              )}
              <textarea
                required
                rows={2}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Type your question..."
                className="w-full resize-none rounded-xl border border-surface-container bg-surface px-3 py-2 text-sm font-semibold text-on-surface outline-none transition focus:border-primary"
              />
              <button
                type="submit"
                disabled={asking}
                className="w-full rounded-xl bg-primary px-3 py-2 text-xs font-black uppercase tracking-[0.15em] text-white transition hover:bg-primary/95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {asking ? 'Thinking...' : 'Ask Assistant'}
              </button>
            </form>

            {showAgentForm && (
              <form onSubmit={handleSubmit} className="space-y-2 rounded-2xl border border-secondary/30 bg-secondary/5 p-3">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-primary">
                  Connect to Agent
                </p>
              <input
                required
                type="text"
                value={formState.name}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Your name"
                className="w-full rounded-xl border border-surface-container bg-surface px-3 py-2 text-sm font-semibold text-on-surface outline-none transition focus:border-primary"
              />
              <input
                required
                type="tel"
                value={formState.phone}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, phone: event.target.value }))
                }
                placeholder="Phone"
                className="w-full rounded-xl border border-surface-container bg-surface px-3 py-2 text-sm font-semibold text-on-surface outline-none transition focus:border-primary"
              />
              <textarea
                required
                rows={3}
                value={formState.message}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, message: event.target.value }))
                }
                placeholder="Your requirement summary"
                className="w-full resize-none rounded-xl border border-surface-container bg-surface px-3 py-2 text-sm font-semibold text-on-surface outline-none transition focus:border-primary"
              />
              {submitMessage && (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                  {submitMessage}
                </p>
              )}
              {submitError && (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700">
                  {submitError}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-primary px-3 py-2 text-xs font-black uppercase tracking-[0.15em] text-white transition hover:bg-primary/95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Sending...' : 'Connect to Agent'}
              </button>
            </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
