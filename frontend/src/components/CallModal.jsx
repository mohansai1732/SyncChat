import { useEffect, useRef } from 'react';
import { useCall } from '../context/CallContext';
import Avatar from './Avatar';
import styles from './CallModal.module.css';

const formatDuration = (totalSeconds) => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export default function CallModal() {
  const {
    callState,
    callType,
    peer,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    isMinimized,
    callDuration,
    mediaError,
    statusMessage,
    endCall,
    toggleAudio,
    toggleVideo,
    toggleMinimize,
  } = useCall();

  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);

  // Bind remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callState]);

  // Bind local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState]);

  // Only render if call is active and not ringing (ringing is handled by IncomingCallModal)
  if (callState === 'idle' || callState === 'ringing' || !peer) {
    return null;
  }

  const isConnected = callState === 'connected';
  const showVideo = callType === 'video';

  return (
    <div
      className={`${styles.overlay} ${isMinimized ? styles.minimized : ''}`}
      role="region"
      aria-label="Active Call Window"
    >
      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.peerInfo}>
          <span className={styles.peerName}>{peer.name || 'User'}</span>
          <div className={styles.statusBadge}>
            {isConnected ? (
              <>
                <span className={styles.timerDot} />
                <span>{formatDuration(callDuration)}</span>
              </>
            ) : (
              <span>{statusMessage || 'Connecting...'}</span>
            )}
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.headerIconBtn}
            onClick={toggleMinimize}
            title={isMinimized ? 'Expand call window' : 'Minimize call window'}
            aria-label={isMinimized ? 'Expand call window' : 'Minimize call window'}
          >
            {isMinimized ? (
              /* Expand Icon */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
            ) : (
              /* Minimize Icon */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M4 14h6v6M20 10h-6V4M10 14l-7 7M14 10l7-7" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* MEDIA ERROR BANNER */}
      {mediaError && (
        <div className={styles.errorBanner} role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>
            {mediaError === 'denied'
              ? 'Microphone/Camera permission denied. Please allow device access in browser settings.'
              : 'No audio or video recording devices detected.'}
          </span>
        </div>
      )}

      {/* STAGE */}
      <div className={styles.stage}>
        {showVideo && remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={styles.remoteVideo}
          />
        ) : (
          <div className={styles.audioStage}>
            <div className={styles.avatarRingWrapper}>
              {!isConnected && <div className={styles.callingRing} />}
              {!isConnected && <div className={styles.callingRing} />}
              <Avatar name={peer.name} size={isMinimized ? 52 : 110} />
            </div>

            {isConnected ? (
              <div className={styles.soundWaves}>
                <div className={styles.waveBar} />
                <div className={styles.waveBar} />
                <div className={styles.waveBar} />
                <div className={styles.waveBar} />
                <div className={styles.waveBar} />
              </div>
            ) : (
              <p className={styles.callStatusNotice}>{statusMessage || 'Calling...'}</p>
            )}
          </div>
        )}

        {/* FLOATING LOCAL VIDEO PIP (Video calls only) */}
        {showVideo && (
          <div className={styles.localPipWrapper}>
            {isVideoOff ? (
              <div className={styles.localVideoOffPlaceholder}>Camera off</div>
            ) : (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted // Muted to avoid feedback loop
                className={styles.localVideo}
              />
            )}
          </div>
        )}
      </div>

      {/* CONTROLS BAR */}
      <footer className={styles.controlsBar}>
        {/* Mute Mic */}
        <button
          type="button"
          className={`${styles.controlBtn} ${isMuted ? styles.activeDanger : ''}`}
          onClick={toggleAudio}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? (
            /* Mic Off */
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          ) : (
            /* Mic On */
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
        </button>

        {/* Toggle Camera (available on video calls) */}
        {showVideo && (
          <button
            type="button"
            className={`${styles.controlBtn} ${isVideoOff ? styles.activeDanger : ''}`}
            onClick={toggleVideo}
            title={isVideoOff ? 'Turn camera on' : 'Turn camera off'}
            aria-label={isVideoOff ? 'Turn camera on' : 'Turn camera off'}
          >
            {isVideoOff ? (
              /* Camera Off */
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56" />
              </svg>
            ) : (
              /* Camera On */
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            )}
          </button>
        )}

        {/* End Call */}
        <button
          type="button"
          className={`${styles.controlBtn} ${styles.endCallBtn}`}
          onClick={endCall}
          title="End call"
          aria-label="End call"
        >
          {/* Hangup Icon */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
            <line x1="22" y1="2" x2="2" y2="22" />
          </svg>
        </button>
      </footer>
    </div>
  );
}
