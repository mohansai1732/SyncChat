import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const CallContext = createContext(null);

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

// ==========================================
// WEB AUDIO API TONE GENERATOR
// ==========================================
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.interval = null;
    this.activeNodes = [];
  }

  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.activeNodes.forEach((node) => {
      try {
        node.stop();
        node.disconnect();
      } catch (_) {}
    });
    this.activeNodes = [];
  }

  playRingback() {
    this.init();
    this.stop();
    if (!this.ctx) return;

    const playBeep = () => {
      if (!this.ctx || this.ctx.state === 'closed') return;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc2.frequency.setValueAtTime(480, this.ctx.currentTime);

      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime + 1.2);
      gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.3);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(this.ctx.currentTime + 1.3);
      osc2.stop(this.ctx.currentTime + 1.3);

      this.activeNodes.push(osc1, osc2, gain);
    };

    playBeep();
    this.interval = setInterval(playBeep, 3500);
  }

  playRingtone() {
    this.init();
    this.stop();
    if (!this.ctx) return;

    const playChime = () => {
      if (!this.ctx || this.ctx.state === 'closed') return;
      const notes = [
        { freq: 853, start: 0, dur: 0.3 },
        { freq: 960, start: 0.15, dur: 0.3 },
        { freq: 853, start: 0.5, dur: 0.3 },
        { freq: 960, start: 0.65, dur: 0.3 },
      ];

      notes.forEach(({ freq, start, dur }) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + start);

        gain.gain.setValueAtTime(0, this.ctx.currentTime + start);
        gain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + start + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + start + dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + start);
        osc.stop(this.ctx.currentTime + start + dur);
        this.activeNodes.push(osc, gain);
      });
    };

    playChime();
    this.interval = setInterval(playChime, 2400);
  }

  playBusy() {
    this.init();
    this.stop();
    if (!this.ctx) return;

    let count = 0;
    this.interval = setInterval(() => {
      if (count++ >= 4) {
        this.stop();
        return;
      }
      if (!this.ctx || this.ctx.state === 'closed') return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(480, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    }, 450);
  }

  playEnd() {
    this.init();
    this.stop();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(520, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }
}

const sounds = new SoundEffects();

export function CallProvider({ children }) {
  const socket = useSocket();
  const { user } = useAuth();

  // Call States: 'idle' | 'calling' | 'ringing' | 'connected' | 'busy' | 'unavailable' | 'ended'
  const [callState, setCallState] = useState('idle');
  const [callType, setCallType] = useState('video'); // 'audio' | 'video'
  const [peer, setPeer] = useState(null); // { _id, name }
  const [callId, setCallId] = useState(null);
  const [conversationId, setConversationId] = useState(null);

  // Streams & controls
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [mediaError, setMediaError] = useState(null); // null | 'denied' | 'no-device' | 'error'
  const [statusMessage, setStatusMessage] = useState('');

  // Refs
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const queuedCandidatesRef = useRef([]);
  const durationTimerRef = useRef(null);
  const incomingOfferRef = useRef(null);
  const activeCallIdRef = useRef(null);
  const peerRef = useRef(null);

  // Synchronize active refs
  useEffect(() => {
    activeCallIdRef.current = callId;
  }, [callId]);

  useEffect(() => {
    peerRef.current = peer;
  }, [peer]);

  // Handle call duration counter
  useEffect(() => {
    if (callState === 'connected') {
      setCallDuration(0);
      durationTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    }
    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, [callState]);

  // Clean up media tracks and peer connection
  const cleanupMediaAndPeer = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (_) {}
      });
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);

    if (pcRef.current) {
      try {
        pcRef.current.onicecandidate = null;
        pcRef.current.ontrack = null;
        pcRef.current.close();
      } catch (_) {}
      pcRef.current = null;
    }
    queuedCandidatesRef.current = [];
    incomingOfferRef.current = null;
  }, []);

  // Teardown call completely
  const terminateCall = useCallback(
    (nextState = 'idle', message = '') => {
      sounds.stop();
      cleanupMediaAndPeer();
      setIsMuted(false);
      setIsVideoOff(false);
      setIsMinimized(false);
      setStatusMessage(message);

      if (nextState !== 'idle') {
        setCallState(nextState);
        // Reset to idle after displaying transient state
        setTimeout(() => {
          setCallState('idle');
          setPeer(null);
          setCallId(null);
          setConversationId(null);
          setStatusMessage('');
        }, 2500);
      } else {
        setCallState('idle');
        setPeer(null);
        setCallId(null);
        setConversationId(null);
      }
    },
    [cleanupMediaAndPeer]
  );

  // Request user media safely
  const acquireUserMedia = async (type) => {
    setMediaError(null);
    try {
      const constraints = {
        audio: true,
        video: type === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.warn('getUserMedia error:', err.name, err.message);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMediaError('denied');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setMediaError('no-device');
      } else {
        setMediaError('error');
      }
      throw err;
    }
  };

  // Create and configure RTCPeerConnection
  const setupPeerConnection = (targetUserId, currentCallId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('call:ice-candidate', {
          callId: currentCallId,
          toUserId: targetUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        terminateCall('ended', 'Connection lost');
      }
    };

    pcRef.current = pc;
    return pc;
  };

  // ==========================================
  // CALL ACTIONS
  // ==========================================

  // Initiate an outgoing call
  const startCall = async (targetUser, convId, type = 'video') => {
    if (!socket || !targetUser?._id) return;
    if (callState !== 'idle') return;

    sounds.init();
    const newCallId = crypto.randomUUID();
    setCallId(newCallId);
    setPeer(targetUser);
    setConversationId(convId);
    setCallType(type);
    setCallState('calling');
    setStatusMessage('Calling...');

    let stream;
    try {
      stream = await acquireUserMedia(type);
    } catch (e) {
      sounds.playBusy();
      terminateCall('ended', 'Microphone/Camera permission denied or unavailable');
      return;
    }

    try {
      const pc = setupPeerConnection(targetUser._id, newCallId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      sounds.playRingback();

      socket.emit('call:invite', {
        callId: newCallId,
        toUserId: targetUser._id,
        conversationId: convId,
        callType: type,
        offer,
      });
    } catch (err) {
      console.error('Failed to create call offer:', err);
      sounds.stop();
      terminateCall('ended', 'Call setup failed');
    }
  };

  // Accept an incoming call
  const acceptCall = async () => {
    if (!socket || !incomingOfferRef.current || !peerRef.current) return;
    const currentCallId = activeCallIdRef.current;
    const currentOffer = incomingOfferRef.current;
    const targetUser = peerRef.current;

    sounds.stop();
    sounds.init();
    setStatusMessage('Connecting...');

    let stream;
    try {
      stream = await acquireUserMedia(callType);
    } catch (e) {
      sounds.playBusy();
      socket.emit('call:reject', {
        callId: currentCallId,
        toUserId: targetUser._id,
        reason: 'Media devices unavailable or denied',
      });
      terminateCall('ended', 'Microphone/Camera access denied');
      return;
    }

    try {
      const pc = setupPeerConnection(targetUser._id, currentCallId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(currentOffer));

      // Flush any queued ICE candidates received before remote description was ready
      if (queuedCandidatesRef.current.length > 0) {
        for (const candidate of queuedCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
        }
        queuedCandidatesRef.current = [];
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('call:accept', {
        callId: currentCallId,
        toUserId: targetUser._id,
        answer,
      });

      setCallState('connected');
      setStatusMessage('');
    } catch (err) {
      console.error('Failed to accept call:', err);
      terminateCall('ended', 'Connection failed');
    }
  };

  // Reject / Decline incoming call
  const rejectCall = (reason = 'declined') => {
    if (socket && peerRef.current && activeCallIdRef.current) {
      socket.emit('call:reject', {
        callId: activeCallIdRef.current,
        toUserId: peerRef.current._id,
        reason,
      });
    }
    sounds.stop();
    terminateCall('idle');
  };

  // End active call
  const endCall = () => {
    sounds.playEnd();
    if (socket && peerRef.current && activeCallIdRef.current) {
      socket.emit('call:end', {
        callId: activeCallIdRef.current,
        toUserId: peerRef.current._id,
      });
    }
    terminateCall('ended', 'Call ended');
  };

  // Toggle Microphone
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle Camera
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const toggleMinimize = () => {
    setIsMinimized((prev) => !prev);
  };

  const clearMediaError = () => {
    setMediaError(null);
  };

  // ==========================================
  // SOCKET SIGNALING LISTENERS
  // ==========================================
  useEffect(() => {
    if (!socket) return;

    // 1. Incoming call invite from caller
    const onCallIncoming = ({ callId: incomingCallId, caller, conversationId: cId, callType: cType, offer }) => {
      // If already in a call, notify caller as busy
      if (callState !== 'idle') {
        socket.emit('call:busy', {
          callId: incomingCallId,
          toUserId: caller._id,
          reason: 'User is busy',
        });
        return;
      }

      setCallId(incomingCallId);
      setPeer(caller);
      setConversationId(cId);
      setCallType(cType || 'video');
      incomingOfferRef.current = offer;
      setCallState('ringing');
      sounds.playRingtone();
    };

    // 2. Outgoing call was accepted by recipient
    const onCallAccepted = async ({ callId: acceptedCallId, answer, responder }) => {
      if (acceptedCallId !== activeCallIdRef.current) return;
      sounds.stop();

      const pc = pcRef.current;
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));

          // Drain queued candidates
          if (queuedCandidatesRef.current.length > 0) {
            for (const candidate of queuedCandidatesRef.current) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
            }
            queuedCandidatesRef.current = [];
          }

          setCallState('connected');
          setStatusMessage('');
        } catch (err) {
          console.error('Error setting remote answer:', err);
          terminateCall('ended', 'Connection handshake failed');
        }
      }
    };

    // 3. Outgoing call was rejected
    const onCallRejected = ({ callId: rejCallId, reason }) => {
      if (rejCallId !== activeCallIdRef.current) return;
      sounds.stop();
      sounds.playBusy();
      terminateCall('ended', reason === 'declined' ? 'Call declined' : reason);
    };

    // 4. Target is busy on another call
    const onCallBusy = ({ callId: busyCallId }) => {
      if (busyCallId !== activeCallIdRef.current) return;
      sounds.stop();
      sounds.playBusy();
      terminateCall('busy', 'User is busy on another call');
    };

    // 5. Target is offline / unavailable
    const onCallUnavailable = ({ callId: unavailCallId }) => {
      if (unavailCallId !== activeCallIdRef.current) return;
      sounds.stop();
      sounds.playBusy();
      terminateCall('unavailable', 'User is currently offline');
    };

    // 6. ICE candidate received from peer
    const onIceCandidate = async ({ callId: cId, candidate }) => {
      if (cId !== activeCallIdRef.current || !candidate) return;
      const pc = pcRef.current;
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('Error adding ICE candidate:', e);
        }
      } else {
        queuedCandidatesRef.current.push(candidate);
      }
    };

    // 7. Peer ended the call
    const onCallEnded = ({ callId: endCallId }) => {
      if (activeCallIdRef.current && (!endCallId || endCallId === activeCallIdRef.current)) {
        sounds.playEnd();
        terminateCall('ended', 'Call ended by user');
      }
    };

    // 8. Multi-tab cancellation: Incoming call was answered or rejected in another tab
    const onCallCancelled = ({ callId: cancelledCallId }) => {
      if (activeCallIdRef.current === cancelledCallId && callState === 'ringing') {
        sounds.stop();
        terminateCall('idle');
      }
    };

    socket.on('call:incoming', onCallIncoming);
    socket.on('call:accepted', onCallAccepted);
    socket.on('call:rejected', onCallRejected);
    socket.on('call:busy', onCallBusy);
    socket.on('call:unavailable', onCallUnavailable);
    socket.on('call:ice-candidate', onIceCandidate);
    socket.on('call:ended', onCallEnded);
    socket.on('call:cancelled', onCallCancelled);

    return () => {
      socket.off('call:incoming', onCallIncoming);
      socket.off('call:accepted', onCallAccepted);
      socket.off('call:rejected', onCallRejected);
      socket.off('call:busy', onCallBusy);
      socket.off('call:unavailable', onCallUnavailable);
      socket.off('call:ice-candidate', onIceCandidate);
      socket.off('call:ended', onCallEnded);
      socket.off('call:cancelled', onCallCancelled);
    };
  }, [socket, callState, terminateCall]);

  return (
    <CallContext.Provider
      value={{
        callState,
        callType,
        peer,
        callId,
        conversationId,
        localStream,
        remoteStream,
        isMuted,
        isVideoOff,
        isMinimized,
        callDuration,
        mediaError,
        statusMessage,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleAudio,
        toggleVideo,
        toggleMinimize,
        clearMediaError,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}
