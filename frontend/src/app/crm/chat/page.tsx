'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiUrl } from '@/utils/api';

type ChatMessage = {
  id: number;
  sender_email: string;
  sender_role: string;
  message_text: string | null;
  message_type: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_mime?: string | null;
  created_at: string;
};

type ConversationRow = {
  id: string;
  property_id: string;
  subject: string | null;
  client_name: string | null;
  client_email: string | null;
  status: string;
  last_message_at: string | null;
  last_message_text: string | null;
  updated_at: string;
};

type ParticipantRow = {
  conversation_id: string;
  user_email: string;
  role: string;
  joined_at: string;
};

type TypingRow = {
  conversation_id: string;
  user_email: string;
  is_typing: boolean;
  updated_at: string;
};

type PresenceRow = {
  user_email: string;
  is_online: boolean;
  last_seen_at: string;
};

type CallRow = {
  id: string;
  conversation_id: string;
  property_id: string;
  caller_email: string;
  caller_role: string;
  target_emails: string[];
  status: 'RINGING' | 'CONNECTED' | 'REJECTED' | 'ENDED';
  accepted_by: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
};

type CallSignalEvent = {
  callId: string;
  conversationId: string;
  from: string;
  type: 'OFFER' | 'ANSWER' | 'ICE';
  payload: any;
  at: string;
};

type CallRecordingRow = {
  id: number;
  call_id: string;
  conversation_id: string;
  property_id: string;
  recorded_by_email: string;
  mime_type: string | null;
  file_url: string;
  file_name: string | null;
  duration_sec: number | null;
  created_at: string;
};

type IncomingCallAlert = {
  conversationId: string;
  call: CallRow;
};

function formatTime(value?: string) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function CrmChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialConversationId = searchParams.get('conversationId') || '';
  const initialPropertyId = searchParams.get('propertyId') || '';

  const [loadingMessages, setLoadingMessages] = useState(true);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [error, setError] = useState('');
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState(initialConversationId);
  const [selectedPropertyId, setSelectedPropertyId] = useState(initialPropertyId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [typingRows, setTypingRows] = useState<TypingRow[]>([]);
  const [presenceByEmail, setPresenceByEmail] = useState<Record<string, PresenceRow>>({});
  const [currentCall, setCurrentCall] = useState<CallRow | null>(null);
  const [recordings, setRecordings] = useState<CallRecordingRow[]>([]);
  const [callBusy, setCallBusy] = useState(false);
  const [incomingCallAlerts, setIncomingCallAlerts] = useState<IncomingCallAlert[]>([]);
  const [unreadByConversation, setUnreadByConversation] = useState<Record<string, number>>({});
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recorderChunksRef = useRef<BlobPart[]>([]);
  const recordingStartedAtRef = useRef<number>(0);
  const recordingCallIdRef = useRef<string>('');
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const ringtoneAudioContextRef = useRef<AudioContext | null>(null);
  const ringtoneTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ringtoneStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const title = useMemo(
    () => (selectedConversationId ? `Conversation ${selectedConversationId.slice(0, 12)}...` : 'Property Chat Inbox'),
    [selectedConversationId],
  );

  async function loadConversations(selectFirstIfEmpty = false) {
    try {
      setLoadingConversations(true);
      const res = await fetch(apiUrl('/api/communications/conversations'), {
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.status === 401) {
        router.push('/crm/login');
        return;
      }
      if (!res.ok) throw new Error('Unable to load conversations');
      const data = await res.json();
      const rows = (data?.data || []) as ConversationRow[];
      setConversations(rows);

      if (!selectedConversationId && rows.length && selectFirstIfEmpty) {
        const first = rows[0];
        setSelectedConversationId(first.id);
        setSelectedPropertyId(first.property_id || '');
      }
    } catch (loadErr) {
      console.error(loadErr);
      setError('Failed to load conversations.');
    } finally {
      setLoadingConversations(false);
    }
  }

  async function loadCurrentUser() {
    try {
      const res = await fetch(apiUrl('/api/auth/me'), { credentials: 'include', cache: 'no-store' });
      if (res.status === 401) {
        router.push('/crm/login');
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      setCurrentUserEmail(String(data?.user?.email || '').toLowerCase());
    } catch {
      // no-op
    }
  }

  async function loadConversationMeta(conversationId: string) {
    if (!conversationId) {
      setParticipants([]);
      setTypingRows([]);
      return;
    }
    try {
      const res = await fetch(apiUrl(`/api/communications/conversations/${conversationId}`), {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data = await res.json();
      const fetchedParticipants = (data?.data?.participants || []) as ParticipantRow[];
      const fetchedTyping = (data?.data?.typing || []) as TypingRow[];
      setParticipants(fetchedParticipants);
      setTypingRows(fetchedTyping);

      const emails = fetchedParticipants.map((row) => row.user_email).filter(Boolean);
      if (emails.length) {
        const presenceRes = await fetch(
          apiUrl(`/api/communications/presence?emails=${encodeURIComponent(emails.join(','))}`),
          { credentials: 'include', cache: 'no-store' },
        );
        if (presenceRes.ok) {
          const presenceData = await presenceRes.json();
          const nextMap: Record<string, PresenceRow> = {};
          ((presenceData?.data || []) as PresenceRow[]).forEach((row) => {
            nextMap[String(row.user_email || '').toLowerCase()] = row;
          });
          setPresenceByEmail((current) => ({ ...current, ...nextMap }));
        }
      }
    } catch {
      // no-op
    }
  }

  async function setTyping(isTyping: boolean, conversationId = selectedConversationId) {
    if (!conversationId) return;
    await fetch(apiUrl(`/api/communications/conversations/${conversationId}/typing`), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isTyping }),
    }).catch(() => undefined);
  }

  async function loadLatestCall(conversationId: string) {
    if (!conversationId) {
      setCurrentCall(null);
      return;
    }
    try {
      const res = await fetch(apiUrl(`/api/communications/conversations/${conversationId}/calls?limit=1`), {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data = await res.json();
      const latest = ((data?.data || []) as CallRow[])[0] || null;
      setCurrentCall(latest);
    } catch {
      // no-op
    }
  }

  async function loadCallRecordings(callId: string) {
    if (!callId) {
      setRecordings([]);
      return;
    }
    try {
      const res = await fetch(apiUrl(`/api/communications/calls/${callId}/recordings?limit=25`), {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data = await res.json();
      setRecordings((data?.data || []) as CallRecordingRow[]);
    } catch {
      // no-op
    }
  }

  async function startCall() {
    if (!selectedConversationId) return;
    setCallBusy(true);
    try {
      const res = await fetch(apiUrl(`/api/communications/conversations/${selectedConversationId}/calls/start`), {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || 'Unable to start call');
      } else {
        setCurrentCall(data?.data || null);
        setError('');
      }
    } catch {
      setError('Unable to start call');
    } finally {
      setCallBusy(false);
    }
  }

  async function acceptCurrentCall() {
    if (!currentCall?.id) return;
    setCallBusy(true);
    try {
      const res = await fetch(apiUrl(`/api/communications/calls/${currentCall.id}/accept`), {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || 'Unable to accept call');
      } else {
        setCurrentCall(data?.data || null);
        setError('');
      }
    } catch {
      setError('Unable to accept call');
    } finally {
      setCallBusy(false);
    }
  }

  async function rejectCurrentCall() {
    if (!currentCall?.id) return;
    setCallBusy(true);
    try {
      const res = await fetch(apiUrl(`/api/communications/calls/${currentCall.id}/reject`), {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || 'Unable to reject call');
      } else {
        setCurrentCall(data?.data || null);
        setError('');
      }
    } catch {
      setError('Unable to reject call');
    } finally {
      setCallBusy(false);
    }
  }

  async function endCurrentCall() {
    if (!currentCall?.id) return;
    setCallBusy(true);
    try {
      const res = await fetch(apiUrl(`/api/communications/calls/${currentCall.id}/end`), {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || 'Unable to end call');
      } else {
        setCurrentCall(data?.data || null);
        setError('');
      }
    } catch {
      setError('Unable to end call');
    } finally {
      setCallBusy(false);
    }
  }

  async function acceptCallById(callId: string) {
    const res = await fetch(apiUrl(`/api/communications/calls/${callId}/accept`), {
      method: 'POST',
      credentials: 'include',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || 'Unable to accept call');
    }
    return data?.data as CallRow;
  }

  async function rejectCallById(callId: string) {
    const res = await fetch(apiUrl(`/api/communications/calls/${callId}/reject`), {
      method: 'POST',
      credentials: 'include',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || 'Unable to reject call');
    }
    return data?.data as CallRow;
  }

  function stopRingtone() {
    if (ringtoneTimerRef.current) {
      clearInterval(ringtoneTimerRef.current);
      ringtoneTimerRef.current = null;
    }
    if (ringtoneStopTimerRef.current) {
      clearTimeout(ringtoneStopTimerRef.current);
      ringtoneStopTimerRef.current = null;
    }
  }

  async function startRingtone() {
    if (ringtoneTimerRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!ringtoneAudioContextRef.current) {
        ringtoneAudioContextRef.current = new AudioCtx();
      }
      const ctx = ringtoneAudioContextRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const beep = () => {
        if (!ringtoneAudioContextRef.current) return;
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = 940;
        gain.gain.value = 0.06;
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.18);
      };

      beep();
      ringtoneTimerRef.current = setInterval(beep, 1200);
      ringtoneStopTimerRef.current = setTimeout(() => {
        stopRingtone();
      }, 30000);
    } catch {
      // ignore ringtone failures
    }
  }

  async function sendCallSignal(callId: string, type: 'OFFER' | 'ANSWER' | 'ICE', payload: any) {
    await fetch(apiUrl(`/api/communications/calls/${callId}/signal`), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload }),
    }).catch(() => undefined);
  }

  async function ensureLocalStream() {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    localStreamRef.current = stream;
    return stream;
  }

  function cleanupPeerResources() {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    remoteStreamRef.current = null;
  }

  async function ensurePeerConnection(call: CallRow) {
    if (peerConnectionRef.current) return peerConnectionRef.current;
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && call?.id) {
        sendCallSignal(call.id, 'ICE', event.candidate.toJSON()).catch(() => undefined);
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      remoteStreamRef.current = stream || null;
      if (remoteAudioRef.current && stream) {
        remoteAudioRef.current.srcObject = stream;
      }
    };

    const localStream = await ensureLocalStream();
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
    peerConnectionRef.current = pc;
    return pc;
  }

  async function becomeOfferer(call: CallRow) {
    const pc = await ensurePeerConnection(call);
    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
    });
    await pc.setLocalDescription(offer);
    await sendCallSignal(call.id, 'OFFER', offer);
  }

  async function handleCallSignal(signal: CallSignalEvent) {
    if (!currentCall || signal.callId !== currentCall.id) return;
    if (signal.conversationId !== selectedConversationId) return;
    if (signal.from === currentUserEmail) return;

    const pc = await ensurePeerConnection(currentCall);

    if (signal.type === 'OFFER') {
      await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await sendCallSignal(currentCall.id, 'ANSWER', answer);
      return;
    }

    if (signal.type === 'ANSWER') {
      await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
      return;
    }

    if (signal.type === 'ICE' && signal.payload) {
      await pc.addIceCandidate(new RTCIceCandidate(signal.payload));
    }
  }

  async function stopAndUploadRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    const callId = recordingCallIdRef.current;
    const startedAt = recordingStartedAtRef.current;
    const durationSec = startedAt ? Math.max(1, Math.round((Date.now() - startedAt) / 1000)) : undefined;

    await new Promise<void>((resolve) => {
      const onStop = async () => {
        recorder.removeEventListener('stop', onStop);
        const blob = new Blob(recorderChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        recorderChunksRef.current = [];
        mediaRecorderRef.current = null;
        recordingStartedAtRef.current = 0;
        recordingCallIdRef.current = '';

        if (!callId || !blob.size) {
          resolve();
          return;
        }

        const formData = new FormData();
        formData.append('recording', blob, `recording-${Date.now()}.webm`);
        if (durationSec) {
          formData.append('durationSec', String(durationSec));
        }

        await fetch(apiUrl(`/api/communications/calls/${callId}/recordings`), {
          method: 'POST',
          credentials: 'include',
          body: formData,
        }).catch(() => undefined);

        await loadCallRecordings(callId);
        resolve();
      };

      recorder.addEventListener('stop', onStop);
      recorder.stop();
    });
  }

  async function startRecordingIfPossible(call: CallRow) {
    if (mediaRecorderRef.current) return;
    if (!call?.id || call.status !== 'CONNECTED') return;

    const localStream = await ensureLocalStream();
    const stream = new MediaStream();
    localStream.getAudioTracks().forEach((track) => stream.addTrack(track));
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getAudioTracks().forEach((track) => stream.addTrack(track));
    }

    const preferredTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'];
    const mimeType = preferredTypes.find((type) => (window as any).MediaRecorder?.isTypeSupported?.(type));
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

    recorderChunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recorderChunksRef.current.push(event.data);
      }
    };
    recorder.start(1000);
    mediaRecorderRef.current = recorder;
    recordingStartedAtRef.current = Date.now();
    recordingCallIdRef.current = call.id;
  }

  async function loadConversationMessages(conversationId: string) {
    if (!conversationId) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }
    try {
      setLoadingMessages(true);
      const res = await fetch(apiUrl(`/api/communications/conversations/${conversationId}/messages?limit=120`), {
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.status === 401) {
        router.push('/crm/login');
        return;
      }
      if (!res.ok) {
        throw new Error('Unable to load messages');
      }
      const data = await res.json();
      setMessages((data?.data || []) as ChatMessage[]);
      setError('');
    } catch (loadErr) {
      console.error(loadErr);
      setError('Failed to load conversation.');
    } finally {
      setLoadingMessages(false);
    }
  }

  useEffect(() => {
    loadCurrentUser();
    loadConversations(true);
  }, []);

  useEffect(() => {
    if (!selectedConversationId) return;
    loadConversationMessages(selectedConversationId);
    loadConversationMeta(selectedConversationId);
    loadLatestCall(selectedConversationId);
    setUnreadByConversation((current) => ({ ...current, [selectedConversationId]: 0 }));
  }, [selectedConversationId]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedConversationId) params.set('conversationId', selectedConversationId);
    if (selectedPropertyId) params.set('propertyId', selectedPropertyId);
    const suffix = params.toString();
    router.replace(suffix ? `/crm/chat?${suffix}` : '/crm/chat');
  }, [selectedConversationId, selectedPropertyId, router]);

  useEffect(() => {
    const stream = new EventSource(apiUrl('/api/communications/stream'), { withCredentials: true });
    eventSourceRef.current = stream;

    stream.addEventListener('connected', () => setRealtimeConnected(true));
    stream.addEventListener('message.created', (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data || '{}');
        const conversationId = String(payload?.conversationId || '');
        const message = payload?.message as ChatMessage | undefined;
        if (!conversationId || !message) return;

        loadConversations(false);

        if (conversationId === selectedConversationId) {
          setMessages((current) => {
            const exists = current.some((row) => row.id === message.id);
            return exists ? current : [...current, message];
          });
          return;
        }

        setUnreadByConversation((current) => ({
          ...current,
          [conversationId]: (current[conversationId] || 0) + 1,
        }));
      } catch (parseErr) {
        console.error(parseErr);
      }
    });

    stream.addEventListener('conversation.created', () => {
      loadConversations(false);
    });

    stream.addEventListener('typing.updated', (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data || '{}');
        const conversationId = String(payload?.conversationId || '');
        const typing = (payload?.typing || []) as TypingRow[];
        if (conversationId && conversationId === selectedConversationId) {
          setTypingRows(typing);
        }
      } catch {
        // no-op
      }
    });

    stream.addEventListener('presence.updated', (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data || '{}');
        const userEmail = String(payload?.userEmail || '').toLowerCase();
        if (!userEmail) return;
        setPresenceByEmail((current) => ({
          ...current,
          [userEmail]: {
            user_email: userEmail,
            is_online: Boolean(payload?.isOnline),
            last_seen_at: String(payload?.at || new Date().toISOString()),
          },
        }));
      } catch {
        // no-op
      }
    });

    stream.addEventListener('call.incoming', (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data || '{}');
        const conversationId = String(payload?.conversationId || '');
        const call = payload?.call as CallRow | undefined;
        if (!conversationId || !call) return;

        if (conversationId === selectedConversationId) {
          setCurrentCall(call);
          startRingtone().catch(() => undefined);
          return;
        }
        setIncomingCallAlerts((current) => {
          const exists = current.some((item) => item.call.id === call.id);
          if (exists) return current;
          return [{ conversationId, call }, ...current].slice(0, 5);
        });
        startRingtone().catch(() => undefined);
        setUnreadByConversation((current) => ({
          ...current,
          [conversationId]: (current[conversationId] || 0) + 1,
        }));
      } catch {
        // no-op
      }
    });

    stream.addEventListener('call.updated', (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data || '{}');
        const conversationId = String(payload?.conversationId || '');
        const call = payload?.call as CallRow | undefined;
        if (!conversationId || !call) return;
        if (conversationId === selectedConversationId) {
          setCurrentCall(call);
        }
        if (['CONNECTED', 'ENDED', 'REJECTED'].includes(call.status)) {
          setIncomingCallAlerts((current) => current.filter((item) => item.call.id !== call.id));
        }
      } catch {
        // no-op
      }
    });

    stream.addEventListener('call.recording.created', (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data || '{}');
        const conversationId = String(payload?.conversationId || '');
        const callId = String(payload?.callId || '');
        const recording = payload?.recording as CallRecordingRow | undefined;
        if (!recording) return;
        if (conversationId === selectedConversationId && currentCall?.id && callId === currentCall.id) {
          setRecordings((current) => {
            const exists = current.some((row) => row.id === recording.id);
            return exists ? current : [recording, ...current];
          });
        }
      } catch {
        // no-op
      }
    });

    stream.addEventListener('call.signal', (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data || '{}') as CallSignalEvent;
        handleCallSignal(payload).catch((err) => {
          console.error('call.signal handling failed', err);
        });
      } catch {
        // no-op
      }
    });

    stream.addEventListener('error', () => {
      setRealtimeConnected(false);
    });

    const heartbeatTimer = setInterval(() => {
      fetch(apiUrl('/api/communications/presence/heartbeat'), {
        method: 'POST',
        credentials: 'include',
      }).catch(() => undefined);
    }, 20000);

    return () => {
      clearInterval(heartbeatTimer);
      stream.close();
      eventSourceRef.current = null;
    };
  }, [selectedConversationId]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setTyping(false).catch(() => undefined);
      stopAndUploadRecording().catch(() => undefined);
      stopRingtone();
      if (ringtoneAudioContextRef.current) {
        ringtoneAudioContextRef.current.close().catch(() => undefined);
        ringtoneAudioContextRef.current = null;
      }
      cleanupPeerResources();
    };
  }, []);

  useEffect(() => {
    const hasIncomingInView =
      Boolean(currentCall) &&
      currentCall?.status === 'RINGING' &&
      String(currentCall?.caller_email || '').toLowerCase() !== currentUserEmail;

    if (incomingCallAlerts.length || hasIncomingInView) {
      startRingtone().catch(() => undefined);
      return;
    }

    stopRingtone();
  }, [incomingCallAlerts.length, currentCall?.status, currentCall?.caller_email, currentUserEmail]);

  useEffect(() => {
    if (!currentCall || !selectedConversationId) {
      cleanupPeerResources();
      return;
    }

    if (currentCall.conversation_id !== selectedConversationId) {
      cleanupPeerResources();
      return;
    }

    if (currentCall.status === 'CONNECTED') {
      ensurePeerConnection(currentCall)
        .then(async () => {
          const isCaller = String(currentCall.caller_email || '').toLowerCase() === currentUserEmail;
          if (isCaller) {
            const pc = peerConnectionRef.current;
            const alreadyOffered = Boolean(pc?.localDescription);
            if (!alreadyOffered) {
              await becomeOfferer(currentCall);
            }
          }
          await startRecordingIfPossible(currentCall);
        })
        .catch((err) => {
          console.error('WebRTC setup failed', err);
          setError('Voice media setup failed. Please retry call.');
        });
      return;
    }

    if (currentCall.status === 'ENDED' || currentCall.status === 'REJECTED') {
      stopAndUploadRecording().catch(() => undefined);
      cleanupPeerResources();
    }
  }, [currentCall, selectedConversationId, currentUserEmail]);

  useEffect(() => {
    if (currentCall?.id) {
      loadCallRecordings(currentCall.id);
      return;
    }
    setRecordings([]);
  }, [currentCall?.id]);

  async function sendMessage() {
    if (!selectedConversationId || (!draft.trim() && !selectedFile)) return;
    setSending(true);
    const text = draft.trim();
    const file = selectedFile;
    setDraft('');
    setSelectedFile(null);

    try {
      let attachmentPayload: { attachmentUrl?: string; attachmentName?: string; attachmentMime?: string } = {};

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await fetch(apiUrl(`/api/communications/conversations/${selectedConversationId}/attachments`), {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
        if (!uploadRes.ok) {
          throw new Error('File upload failed');
        }
        const uploadData = await uploadRes.json();
        attachmentPayload = {
          attachmentUrl: uploadData?.data?.attachmentUrl,
          attachmentName: uploadData?.data?.attachmentName,
          attachmentMime: uploadData?.data?.attachmentMime,
        };
      }

      const res = await fetch(apiUrl(`/api/communications/conversations/${selectedConversationId}/messages`), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageText: text || undefined,
          messageType: file ? 'FILE' : 'TEXT',
          ...attachmentPayload,
        }),
      });

      if (!res.ok) {
        throw new Error('Message failed to send');
      }

      await Promise.all([loadConversationMessages(selectedConversationId), loadConversations(false)]);
      await setTyping(false, selectedConversationId);
      setError('');
    } catch (sendErr) {
      console.error(sendErr);
      setError('Message or file failed to send.');
      setDraft(text);
      if (file) setSelectedFile(file);
    } finally {
      setSending(false);
    }
  }

  function openConversation(row: ConversationRow) {
    if (selectedConversationId && selectedConversationId !== row.id) {
      setTyping(false, selectedConversationId).catch(() => undefined);
    }
    setSelectedConversationId(row.id);
    setSelectedPropertyId(row.property_id || '');
  }

  async function openIncomingAlert(alert: IncomingCallAlert) {
    setIncomingCallAlerts((current) => current.filter((item) => item.call.id !== alert.call.id));
    setSelectedConversationId(alert.conversationId);
    const targetConversation = conversations.find((row) => row.id === alert.conversationId);
    if (targetConversation) {
      setSelectedPropertyId(targetConversation.property_id || '');
    }
    setCurrentCall(alert.call);
  }

  async function acceptIncomingAlert(alert: IncomingCallAlert) {
    try {
      const accepted = await acceptCallById(alert.call.id);
      await openIncomingAlert({ conversationId: alert.conversationId, call: accepted || alert.call });
    } catch (err) {
      console.error(err);
      setError('Unable to accept incoming call');
    }
  }

  async function rejectIncomingAlert(alert: IncomingCallAlert) {
    try {
      await rejectCallById(alert.call.id);
      setIncomingCallAlerts((current) => current.filter((item) => item.call.id !== alert.call.id));
    } catch (err) {
      console.error(err);
      setError('Unable to reject incoming call');
    }
  }

  const activeTypingUsers = typingRows.filter(
    (row) =>
      row.is_typing &&
      String(row.user_email || '').toLowerCase() !== currentUserEmail &&
      String(row.conversation_id || '') === selectedConversationId,
  );
  const isIncomingRinging =
    Boolean(currentCall) &&
    currentCall?.status === 'RINGING' &&
    String(currentCall?.caller_email || '').toLowerCase() !== currentUserEmail;
  const isMyOutgoingRinging =
    Boolean(currentCall) &&
    currentCall?.status === 'RINGING' &&
    String(currentCall?.caller_email || '').toLowerCase() === currentUserEmail;
  const isCallConnected = currentCall?.status === 'CONNECTED';

  return (
    <div className="min-h-screen bg-background px-4 py-6 text-on-surface md:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <audio ref={remoteAudioRef} autoPlay playsInline />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">Communication</p>
            <h1 className="mt-1 text-3xl font-extrabold font-headline text-primary">{title}</h1>
            <p className="mt-1 text-xs text-outline">{selectedPropertyId ? `Property ID: ${selectedPropertyId}` : 'Property-linked conversation inbox'}</p>
          </div>
          <div className="flex gap-2">
            {incomingCallAlerts.length > 0 && (
              <span className="inline-flex items-center rounded-full bg-rose-100 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-rose-700">
                {incomingCallAlerts.length} Incoming Call{incomingCallAlerts.length > 1 ? 's' : ''}
              </span>
            )}
            <span
              className={`inline-flex items-center rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-widest ${
                realtimeConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {realtimeConnected ? 'Realtime Connected' : 'Realtime Reconnecting'}
            </span>
            <button
              onClick={() => router.push('/crm/dashboard')}
              className="rounded-xl border border-surface-container bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary"
            >
              Back To CRM
            </button>
            <button
              onClick={() => router.push('/crm/communications')}
              className="rounded-xl border border-surface-container bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary"
            >
              Call Analytics
            </button>
            <button
              onClick={() => {
                loadConversations(false);
                if (selectedConversationId) {
                  loadConversationMessages(selectedConversationId);
                }
              }}
              className="rounded-xl bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-white"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_1fr]">
          <div className="rounded-3xl border border-surface-container bg-surface p-3 shadow-sm">
            <div className="mb-2 px-2 pt-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">Conversations</p>
            </div>
            <div className="max-h-[68vh] space-y-2 overflow-y-auto pr-1">
              {loadingConversations ? (
                <p className="rounded-xl border border-surface-container bg-background/30 px-3 py-3 text-xs text-outline">Loading conversations...</p>
              ) : conversations.length ? (
                conversations.map((row) => (
                  <button
                    key={row.id}
                    onClick={() => openConversation(row)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                      selectedConversationId === row.id
                        ? 'border-primary bg-primary/5'
                        : 'border-surface-container bg-background/30 hover:border-primary/40'
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-black uppercase tracking-wider text-primary">
                        {row.subject || row.client_name || 'Property Conversation'}
                      </p>
                      {unreadByConversation[row.id] > 0 && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-700">
                          {unreadByConversation[row.id]}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[11px] text-outline">{row.last_message_text || 'No messages yet'}</p>
                    <p className="mt-1 text-[10px] text-outline/80">
                      Property: {row.property_id.slice(0, 8)}... • {formatTime(row.last_message_at || row.updated_at)}
                    </p>
                  </button>
                ))
              ) : (
                <p className="rounded-xl border border-surface-container bg-background/30 px-3 py-3 text-xs text-outline">
                  No conversations found. Start from a property page.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
        <div className="rounded-3xl border border-surface-container bg-surface p-4 shadow-sm">
          {selectedConversationId ? (
            <div className="mb-3 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {participants.length ? (
                  participants.map((participant) => {
                    const email = String(participant.user_email || '').toLowerCase();
                    const presence = presenceByEmail[email];
                    const isOnline = Boolean(presence?.is_online);
                    return (
                      <span
                        key={email}
                        className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                          isOnline ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {email}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-xs text-outline">No participants listed.</span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-surface-container bg-background/30 px-3 py-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-outline">Voice Call</span>
                {currentCall ? (
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wider ${
                      currentCall.status === 'CONNECTED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : currentCall.status === 'RINGING'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {currentCall.status}
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600">
                    IDLE
                  </span>
                )}

                {!currentCall || currentCall.status === 'ENDED' || currentCall.status === 'REJECTED' ? (
                  <button
                    onClick={startCall}
                    disabled={callBusy || !selectedConversationId}
                    className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Start Call
                  </button>
                ) : null}

                {isIncomingRinging ? (
                  <>
                    <button
                      onClick={acceptCurrentCall}
                      disabled={callBusy}
                      className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Accept
                    </button>
                    <button
                      onClick={rejectCurrentCall}
                      disabled={callBusy}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Reject
                    </button>
                  </>
                ) : null}

                {(isMyOutgoingRinging || isCallConnected) ? (
                  <button
                    onClick={endCurrentCall}
                    disabled={callBusy}
                    className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    End Call
                  </button>
                ) : null}
              </div>

              <div className="rounded-xl border border-surface-container bg-background/20 p-2">
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-outline">Recordings</p>
                {recordings.length ? (
                  <div className="space-y-2">
                    {recordings.slice(0, 5).map((recording) => (
                      <div key={recording.id} className="flex items-center justify-between gap-2 rounded-lg border border-surface-container bg-white px-2 py-1.5">
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-bold text-primary">
                            {recording.file_name || `recording-${recording.id}.webm`}
                          </p>
                          <p className="text-[10px] text-outline">
                            {recording.duration_sec ? `${recording.duration_sec}s` : '-'} • {formatTime(recording.created_at)}
                          </p>
                        </div>
                        <audio controls preload="none" src={recording.file_url} className="max-w-[220px]" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-outline">No recordings yet.</p>
                )}
              </div>
            </div>
          ) : null}

          {loadingMessages ? (
            <p className="text-sm text-outline">Loading messages...</p>
          ) : error ? (
            <p className="text-sm text-rose-700">{error}</p>
          ) : (
            <div className="max-h-[56vh] space-y-2 overflow-y-auto pr-1">
              {messages.length ? (
                messages.map((message) => (
                  <div key={message.id} className="rounded-2xl border border-surface-container bg-background/40 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                        {message.sender_email} ({message.sender_role})
                      </p>
                      <p className="text-[10px] text-outline">{formatTime(message.created_at)}</p>
                    </div>
                    <p className="mt-1 text-sm text-on-surface">{message.message_text || '-'}</p>
                    {message.attachment_url && (
                      <a
                        href={message.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-2 rounded-lg border border-surface-container bg-white px-3 py-1.5 text-xs font-bold text-primary hover:bg-surface"
                      >
                        <span className="material-symbols-outlined text-sm">attach_file</span>
                        {message.attachment_name || 'View Attachment'}
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-outline">No messages yet. Start the conversation.</p>
              )}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-surface-container bg-surface p-4 shadow-sm">
          <div className="mb-2 min-h-5 text-xs text-outline">
            {activeTypingUsers.length
              ? `${activeTypingUsers.map((row) => row.user_email).join(', ')} typing...`
              : ''}
          </div>
          {selectedFile && (
            <div className="mb-2 flex items-center justify-between rounded-xl border border-surface-container bg-background/40 px-3 py-2 text-xs">
              <p className="truncate font-bold text-primary">Attached: {selectedFile.name}</p>
              <button
                onClick={() => setSelectedFile(null)}
                className="rounded-md border border-surface-container px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-outline"
              >
                Remove
              </button>
            </div>
          )}
          <div className="flex flex-col gap-3 md:flex-row">
            <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-surface-container bg-white px-3 py-3 text-xs font-bold uppercase tracking-widest text-primary">
              Attach
              <input
                type="file"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  setSelectedFile(file);
                  event.currentTarget.value = '';
                }}
              />
            </label>
            <input
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                if (!selectedConversationId) return;
                setTyping(true, selectedConversationId).catch(() => undefined);
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                }
                typingTimeoutRef.current = setTimeout(() => {
                  setTyping(false, selectedConversationId).catch(() => undefined);
                }, 1500);
              }}
              placeholder={selectedConversationId ? 'Type message...' : 'Select a conversation to chat'}
              disabled={!selectedConversationId}
              className="flex-1 rounded-xl border border-surface-container bg-white px-4 py-3 text-sm outline-none focus:border-primary"
              onBlur={() => {
                if (selectedConversationId) {
                  setTyping(false, selectedConversationId).catch(() => undefined);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  sendMessage();
                }
              }}
            />
            <button
              onClick={sendMessage}
              disabled={(!draft.trim() && !selectedFile) || !selectedConversationId || sending}
              className="rounded-xl bg-primary px-5 py-3 text-xs font-bold uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
          </div>
        </div>

        {incomingCallAlerts.length > 0 && (
          <div className="pointer-events-none fixed bottom-5 right-5 z-[90] w-[min(94vw,420px)] space-y-2">
            {incomingCallAlerts.slice(0, 2).map((alert) => (
              <div key={alert.call.id} className="pointer-events-auto rounded-2xl border border-rose-200 bg-rose-50 p-3 shadow-2xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-700">Incoming Call</p>
                <p className="mt-1 text-sm font-bold text-primary">{alert.call.caller_email}</p>
                <p className="text-[11px] text-outline">
                  Conversation: {alert.conversationId.slice(0, 12)}... • {formatTime(alert.call.created_at)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => acceptIncomingAlert(alert)}
                    className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-emerald-700"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => rejectIncomingAlert(alert)}
                    className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-rose-700"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => openIncomingAlert(alert)}
                    className="rounded-lg border border-surface-container bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-primary"
                  >
                    Open Chat
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CrmChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background p-8 text-sm text-outline">Loading chat...</div>}>
      <CrmChatPageContent />
    </Suspense>
  );
}
