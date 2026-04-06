import { Router } from 'express';
import { authMiddleware, requireRoles } from '../middleware/auth.js';
import {
  addParticipant,
  canAccessConversation,
  createCallRecording,
  createCall,
  createConversation,
  createMessage,
  endCall,
  getActiveCallForConversation,
  getCallById,
  getConversationById,
  listCalls,
  listCallRecordings,
  listCallsForUser,
  getCommunicationAnalyticsForUser,
  listConversationsForUser,
  listMessages,
  listParticipants,
  listPresence,
  listTyping,
  propertyExists,
  setPresenceOffline,
  touchPresence,
  updateTypingState,
  acceptCall,
  rejectCall,
} from '../services/communicationStore.js';
import { emitRealtimeEvent, registerSseClient } from '../services/communicationRealtime.js';
import { sanitizeEmail, sanitizeLooseText, sanitizePlainText } from '../utils/sanitize.js';
import { chatUpload } from '../middleware/chatUpload.js';
import { callRecordingUpload } from '../middleware/callRecordingUpload.js';
import {
  communicationReadLimiter,
  communicationSignalLimiter,
  communicationWriteLimiter,
} from '../middleware/security.js';

const router = Router();

router.use(authMiddleware, requireRoles(['ADMIN', 'SALES', 'VIEWER']));

function isValidMessageType(value: string) {
  return ['TEXT', 'FILE', 'SYSTEM'].includes(value);
}

router.get('/stream', async (req: any, res) => {
  const userEmail = String(req.user?.email || '').toLowerCase();
  if (!userEmail) return res.status(401).json({ message: 'Unauthorized' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  await touchPresence(userEmail, true);
  emitRealtimeEvent('presence.updated', { userEmail, isOnline: true, at: new Date().toISOString() });

  const unregister = registerSseClient(userEmail, res);
  req.on('close', async () => {
    unregister();
    await setPresenceOffline(userEmail);
    emitRealtimeEvent('presence.updated', { userEmail, isOnline: false, at: new Date().toISOString() });
  });
});

router.post('/presence/heartbeat', communicationWriteLimiter, async (req: any, res) => {
  const userEmail = String(req.user?.email || '').toLowerCase();
  await touchPresence(userEmail, true);
  emitRealtimeEvent('presence.updated', { userEmail, isOnline: true, at: new Date().toISOString() });
  res.json({ message: 'Presence updated' });
});

router.get('/presence', communicationReadLimiter, async (req, res) => {
  const rawEmails = sanitizeLooseText(req.query?.emails);
  const emails = rawEmails
    ? rawEmails.split(',').map((email) => sanitizeEmail(email)).filter((email): email is string => Boolean(email))
    : undefined;

  const presence = await listPresence(emails);
  res.json({ data: presence });
});

router.post('/conversations', communicationWriteLimiter, async (req: any, res) => {
  const propertyId = sanitizeLooseText(req.body?.propertyId);
  const clientName = sanitizePlainText(req.body?.clientName);
  const clientEmail = sanitizeEmail(req.body?.clientEmail);
  const clientPhone = sanitizePlainText(req.body?.clientPhone);
  const subject = sanitizePlainText(req.body?.subject);
  if (subject && subject.length > 500) {
    return res.status(400).json({ message: 'subject too long (max 500 chars)' });
  }

  if (!propertyId) return res.status(400).json({ message: 'propertyId is required' });

  const propertyFound = await propertyExists(propertyId);
  if (!propertyFound) return res.status(404).json({ message: 'Property not found' });

  const conversation = await createConversation({
    propertyId,
    createdByEmail: String(req.user?.email || '').toLowerCase(),
    createdByRole: String(req.user?.role || '').toUpperCase(),
    clientName,
    clientEmail,
    clientPhone,
    subject,
  });

  emitRealtimeEvent('conversation.created', { conversation });
  res.status(201).json({ data: conversation });
});

router.get('/conversations', communicationReadLimiter, async (req: any, res) => {
  const propertyId = sanitizeLooseText(req.query?.propertyId);
  const rows = await listConversationsForUser(
    String(req.user?.email || '').toLowerCase(),
    String(req.user?.role || '').toUpperCase(),
    propertyId,
  );
  res.json({ data: rows });
});

router.get('/conversations/:id', communicationReadLimiter, async (req: any, res) => {
  const conversationId = sanitizeLooseText(req.params?.id);
  if (!conversationId) return res.status(400).json({ message: 'Invalid conversation id' });

  const allowed = await canAccessConversation(
    conversationId,
    String(req.user?.email || '').toLowerCase(),
    String(req.user?.role || '').toUpperCase(),
  );
  if (!allowed) return res.status(403).json({ message: 'Access denied' });

  const conversation = await getConversationById(conversationId);
  if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

  const participants = await listParticipants(conversationId);
  const typing = await listTyping(conversationId);
  res.json({ data: { conversation, participants, typing } });
});

router.post('/conversations/:id/participants', communicationWriteLimiter, requireRoles(['ADMIN', 'SALES']), async (req: any, res) => {
  const conversationId = sanitizeLooseText(req.params?.id);
  const participantEmail = sanitizeEmail(req.body?.userEmail);
  const participantRole = String(sanitizeLooseText(req.body?.role) || 'SALES').toUpperCase();
  if (!conversationId || !participantEmail) {
    return res.status(400).json({ message: 'conversation id and userEmail are required' });
  }

  const allowed = await canAccessConversation(
    conversationId,
    String(req.user?.email || '').toLowerCase(),
    String(req.user?.role || '').toUpperCase(),
  );
  if (!allowed) return res.status(403).json({ message: 'Access denied' });

  await addParticipant(conversationId, participantEmail, participantRole);
  const participants = await listParticipants(conversationId);
  emitRealtimeEvent('conversation.participants.updated', { conversationId, participants });
  res.json({ data: participants });
});

router.get('/conversations/:id/messages', communicationReadLimiter, async (req: any, res) => {
  const conversationId = sanitizeLooseText(req.params?.id);
  const limitRaw = Number(req.query?.limit || 100);
  if (!conversationId) return res.status(400).json({ message: 'Invalid conversation id' });

  const allowed = await canAccessConversation(
    conversationId,
    String(req.user?.email || '').toLowerCase(),
    String(req.user?.role || '').toUpperCase(),
  );
  if (!allowed) return res.status(403).json({ message: 'Access denied' });

  const rows = await listMessages(conversationId, Number.isFinite(limitRaw) ? limitRaw : 100);
  res.json({ data: rows });
});

router.post('/conversations/:id/messages', communicationWriteLimiter, async (req: any, res) => {
  const conversationId = sanitizeLooseText(req.params?.id);
  const messageText = sanitizePlainText(req.body?.messageText);
  const messageType = String(sanitizeLooseText(req.body?.messageType) || 'TEXT').toUpperCase();
  const attachmentUrl = sanitizeLooseText(req.body?.attachmentUrl);
  const attachmentName = sanitizePlainText(req.body?.attachmentName);
  const attachmentMime = sanitizeLooseText(req.body?.attachmentMime);

  if (!conversationId) return res.status(400).json({ message: 'Invalid conversation id' });
  if (!isValidMessageType(messageType)) {
    return res.status(400).json({ message: 'Invalid message type' });
  }
  if (messageText && messageText.length > 5000) {
    return res.status(400).json({ message: 'messageText too long (max 5000 chars)' });
  }
  if (!messageText && !attachmentUrl) {
    return res.status(400).json({ message: 'messageText or attachmentUrl is required' });
  }

  const allowed = await canAccessConversation(
    conversationId,
    String(req.user?.email || '').toLowerCase(),
    String(req.user?.role || '').toUpperCase(),
  );
  if (!allowed) return res.status(403).json({ message: 'Access denied' });

  const message = await createMessage({
    conversationId,
    senderEmail: String(req.user?.email || '').toLowerCase(),
    senderRole: String(req.user?.role || '').toUpperCase(),
    messageType,
    messageText,
    attachmentUrl,
    attachmentName,
    attachmentMime,
  });

  const participants = await listParticipants(conversationId);
  const targetEmails = participants.map((row: any) => String(row.user_email || '').toLowerCase());
  emitRealtimeEvent('message.created', { conversationId, message }, targetEmails);

  res.status(201).json({ data: message });
});

router.post('/conversations/:id/attachments', communicationWriteLimiter, chatUpload.single('file'), async (req: any, res) => {
  const conversationId = sanitizeLooseText(req.params?.id);
  if (!conversationId) return res.status(400).json({ message: 'Invalid conversation id' });

  const userEmail = String(req.user?.email || '').toLowerCase();
  const userRole = String(req.user?.role || '').toUpperCase();
  const allowed = await canAccessConversation(conversationId, userEmail, userRole);
  if (!allowed) return res.status(403).json({ message: 'Access denied' });

  const file = req.file as any;
  if (!file) return res.status(400).json({ message: 'File is required' });

  res.status(201).json({
    data: {
      attachmentUrl: file.path,
      attachmentName: file.originalname,
      attachmentMime: file.mimetype,
      size: file.size,
    },
  });
});

router.post('/conversations/:id/typing', communicationSignalLimiter, async (req: any, res) => {
  const conversationId = sanitizeLooseText(req.params?.id);
  const isTyping = Boolean(req.body?.isTyping);
  if (!conversationId) return res.status(400).json({ message: 'Invalid conversation id' });

  const userEmail = String(req.user?.email || '').toLowerCase();
  const userRole = String(req.user?.role || '').toUpperCase();
  const allowed = await canAccessConversation(conversationId, userEmail, userRole);
  if (!allowed) return res.status(403).json({ message: 'Access denied' });

  await updateTypingState(conversationId, userEmail, isTyping);
  const typing = await listTyping(conversationId);
  const participants = await listParticipants(conversationId);
  const targetEmails = participants.map((row: any) => String(row.user_email || '').toLowerCase());
  emitRealtimeEvent('typing.updated', { conversationId, typing }, targetEmails);

  res.json({ data: typing });
});

router.get('/conversations/:id/calls', communicationReadLimiter, async (req: any, res) => {
  const conversationId = sanitizeLooseText(req.params?.id);
  const limitRaw = Number(req.query?.limit || 50);
  if (!conversationId) return res.status(400).json({ message: 'Invalid conversation id' });

  const userEmail = String(req.user?.email || '').toLowerCase();
  const userRole = String(req.user?.role || '').toUpperCase();
  const allowed = await canAccessConversation(conversationId, userEmail, userRole);
  if (!allowed) return res.status(403).json({ message: 'Access denied' });

  const calls = await listCalls(conversationId, Number.isFinite(limitRaw) ? limitRaw : 50);
  res.json({ data: calls });
});

router.get('/calls', communicationReadLimiter, async (req: any, res) => {
  const limitRaw = Number(req.query?.limit || 200);
  const userEmail = String(req.user?.email || '').toLowerCase();
  const userRole = String(req.user?.role || '').toUpperCase();
  const rows = await listCallsForUser(userEmail, userRole, Number.isFinite(limitRaw) ? limitRaw : 200);
  res.json({ data: rows });
});

router.get('/analytics', communicationReadLimiter, async (req: any, res) => {
  const userEmail = String(req.user?.email || '').toLowerCase();
  const userRole = String(req.user?.role || '').toUpperCase();
  const data = await getCommunicationAnalyticsForUser(userEmail, userRole);
  res.json({ data });
});

router.post('/conversations/:id/calls/start', communicationWriteLimiter, async (req: any, res) => {
  const conversationId = sanitizeLooseText(req.params?.id);
  if (!conversationId) return res.status(400).json({ message: 'Invalid conversation id' });

  const userEmail = String(req.user?.email || '').toLowerCase();
  const userRole = String(req.user?.role || '').toUpperCase();
  const allowed = await canAccessConversation(conversationId, userEmail, userRole);
  if (!allowed) return res.status(403).json({ message: 'Access denied' });

  const conversation = await getConversationById(conversationId);
  if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

  const existingActive = await getActiveCallForConversation(conversationId);
  if (existingActive) {
    return res.status(409).json({ message: 'A call is already active for this conversation', data: existingActive });
  }

  const participants = await listParticipants(conversationId);
  const targetEmails = participants
    .map((row: any) => String(row.user_email || '').toLowerCase())
    .filter((email: string) => email && email !== userEmail);

  const call = await createCall({
    conversationId,
    propertyId: String(conversation.property_id),
    callerEmail: userEmail,
    callerRole: userRole,
    targetEmails,
  });

  emitRealtimeEvent('call.incoming', { conversationId, call }, targetEmails);
  emitRealtimeEvent('call.updated', { conversationId, call }, [userEmail, ...targetEmails]);
  res.status(201).json({ data: call });
});

router.post('/calls/:id/accept', communicationWriteLimiter, async (req: any, res) => {
  const callId = sanitizeLooseText(req.params?.id);
  if (!callId) return res.status(400).json({ message: 'Invalid call id' });

  const call = await getCallById(callId);
  if (!call) return res.status(404).json({ message: 'Call not found' });

  const userEmail = String(req.user?.email || '').toLowerCase();
  const userRole = String(req.user?.role || '').toUpperCase();
  const allowed = await canAccessConversation(String(call.conversation_id), userEmail, userRole);
  if (!allowed) return res.status(403).json({ message: 'Access denied' });
  if (String(call.status) !== 'RINGING') {
    return res.status(409).json({ message: `Call is already ${call.status}`, data: call });
  }

  const updated = await acceptCall(callId, userEmail);
  if (!updated) return res.status(500).json({ message: 'Unable to accept call' });

  const participants = await listParticipants(String(call.conversation_id));
  const targetEmails = participants.map((row: any) => String(row.user_email || '').toLowerCase());
  emitRealtimeEvent('call.updated', { conversationId: call.conversation_id, call: updated }, targetEmails);

  res.json({ data: updated });
});

router.post('/calls/:id/reject', communicationWriteLimiter, async (req: any, res) => {
  const callId = sanitizeLooseText(req.params?.id);
  if (!callId) return res.status(400).json({ message: 'Invalid call id' });

  const call = await getCallById(callId);
  if (!call) return res.status(404).json({ message: 'Call not found' });

  const userEmail = String(req.user?.email || '').toLowerCase();
  const userRole = String(req.user?.role || '').toUpperCase();
  const allowed = await canAccessConversation(String(call.conversation_id), userEmail, userRole);
  if (!allowed) return res.status(403).json({ message: 'Access denied' });

  const updated = await rejectCall(callId);
  if (!updated) return res.status(500).json({ message: 'Unable to reject call' });

  const participants = await listParticipants(String(call.conversation_id));
  const targetEmails = participants.map((row: any) => String(row.user_email || '').toLowerCase());
  emitRealtimeEvent('call.updated', { conversationId: call.conversation_id, call: updated }, targetEmails);

  res.json({ data: updated });
});

router.post('/calls/:id/end', communicationWriteLimiter, async (req: any, res) => {
  const callId = sanitizeLooseText(req.params?.id);
  if (!callId) return res.status(400).json({ message: 'Invalid call id' });

  const call = await getCallById(callId);
  if (!call) return res.status(404).json({ message: 'Call not found' });

  const userEmail = String(req.user?.email || '').toLowerCase();
  const userRole = String(req.user?.role || '').toUpperCase();
  const allowed = await canAccessConversation(String(call.conversation_id), userEmail, userRole);
  if (!allowed) return res.status(403).json({ message: 'Access denied' });

  const updated = await endCall(callId);
  if (!updated) return res.status(500).json({ message: 'Unable to end call' });

  const participants = await listParticipants(String(call.conversation_id));
  const targetEmails = participants.map((row: any) => String(row.user_email || '').toLowerCase());
  emitRealtimeEvent('call.updated', { conversationId: call.conversation_id, call: updated }, targetEmails);

  res.json({ data: updated });
});

router.get('/calls/:id/recordings', communicationReadLimiter, async (req: any, res) => {
  const callId = sanitizeLooseText(req.params?.id);
  const limitRaw = Number(req.query?.limit || 30);
  if (!callId) return res.status(400).json({ message: 'Invalid call id' });

  const call = await getCallById(callId);
  if (!call) return res.status(404).json({ message: 'Call not found' });

  const userEmail = String(req.user?.email || '').toLowerCase();
  const userRole = String(req.user?.role || '').toUpperCase();
  const allowed = await canAccessConversation(String(call.conversation_id), userEmail, userRole);
  if (!allowed) return res.status(403).json({ message: 'Access denied' });

  const recordings = await listCallRecordings(callId, Number.isFinite(limitRaw) ? limitRaw : 30);
  res.json({ data: recordings });
});

router.post('/calls/:id/recordings', communicationWriteLimiter, callRecordingUpload.single('recording'), async (req: any, res) => {
  const callId = sanitizeLooseText(req.params?.id);
  if (!callId) return res.status(400).json({ message: 'Invalid call id' });

  const call = await getCallById(callId);
  if (!call) return res.status(404).json({ message: 'Call not found' });

  const userEmail = String(req.user?.email || '').toLowerCase();
  const userRole = String(req.user?.role || '').toUpperCase();
  const allowed = await canAccessConversation(String(call.conversation_id), userEmail, userRole);
  if (!allowed) return res.status(403).json({ message: 'Access denied' });

  const file = req.file as any;
  if (!file) return res.status(400).json({ message: 'Recording file is required' });

  const durationRaw = Number(req.body?.durationSec || 0);
  const recording = await createCallRecording({
    callId,
    conversationId: String(call.conversation_id),
    propertyId: String(call.property_id),
    recordedByEmail: userEmail,
    mimeType: file.mimetype,
    fileUrl: file.path,
    fileName: file.originalname,
    durationSec: Number.isFinite(durationRaw) && durationRaw > 0 ? Math.round(durationRaw) : undefined,
  });

  if (!recording) return res.status(500).json({ message: 'Failed to save recording metadata' });

  const participants = await listParticipants(String(call.conversation_id));
  const targetEmails = participants.map((row: any) => String(row.user_email || '').toLowerCase());
  emitRealtimeEvent('call.recording.created', { conversationId: call.conversation_id, callId, recording }, targetEmails);

  res.status(201).json({ data: recording });
});

router.post('/calls/:id/signal', communicationSignalLimiter, async (req: any, res) => {
  const callId = sanitizeLooseText(req.params?.id);
  const signalType = String(sanitizeLooseText(req.body?.type) || '').toUpperCase();
  const payload = req.body?.payload;

  if (!callId) return res.status(400).json({ message: 'Invalid call id' });
  if (!['OFFER', 'ANSWER', 'ICE'].includes(signalType)) {
    return res.status(400).json({ message: 'Invalid signal type' });
  }
  if (!payload) return res.status(400).json({ message: 'Signal payload is required' });

  const call = await getCallById(callId);
  if (!call) return res.status(404).json({ message: 'Call not found' });

  const userEmail = String(req.user?.email || '').toLowerCase();
  const userRole = String(req.user?.role || '').toUpperCase();
  const allowed = await canAccessConversation(String(call.conversation_id), userEmail, userRole);
  if (!allowed) return res.status(403).json({ message: 'Access denied' });
  if (!['RINGING', 'CONNECTED'].includes(String(call.status))) {
    return res.status(409).json({ message: `Call is ${call.status}` });
  }

  const participants = await listParticipants(String(call.conversation_id));
  const targetEmails = participants
    .map((row: any) => String(row.user_email || '').toLowerCase())
    .filter((email: string) => email && email !== userEmail);

  emitRealtimeEvent(
    'call.signal',
    {
      callId,
      conversationId: call.conversation_id,
      from: userEmail,
      type: signalType,
      payload,
      at: new Date().toISOString(),
    },
    targetEmails,
  );

  res.json({ message: 'Signal relayed' });
});

export default router;
