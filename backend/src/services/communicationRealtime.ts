import type { Response } from 'express';

type SseClient = {
  id: string;
  userEmail: string;
  res: Response;
};

const sseClients = new Map<string, SseClient>();

function writeEvent(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function registerSseClient(userEmail: string, res: Response) {
  const clientId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const client: SseClient = { id: clientId, userEmail, res };
  sseClients.set(clientId, client);

  writeEvent(res, 'connected', { clientId, userEmail, at: new Date().toISOString() });

  const pingTimer = setInterval(() => {
    try {
      writeEvent(res, 'ping', { at: new Date().toISOString() });
    } catch {
      // connection may have been closed
    }
  }, 25000);

  return () => {
    clearInterval(pingTimer);
    sseClients.delete(clientId);
  };
}

export function emitRealtimeEvent(event: string, payload: unknown, targetEmails?: string[]) {
  const targetSet = targetEmails?.length
    ? new Set(targetEmails.map((email) => String(email || '').toLowerCase()))
    : null;

  sseClients.forEach((client) => {
    if (targetSet && !targetSet.has(client.userEmail.toLowerCase())) {
      return;
    }
    writeEvent(client.res, event, payload);
  });
}

