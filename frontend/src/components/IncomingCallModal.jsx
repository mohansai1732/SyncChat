import { useCall } from '../context/CallContext';
import Avatar from './Avatar';
import styles from './IncomingCallModal.module.css';

export default function IncomingCallModal() {
  const { callState, callType, peer, acceptCall, rejectCall } = useCall();

  if (callState !== 'ringing' || !peer) return null;

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label="Incoming call">
      <div className={styles.modal}>
        <div className={styles.pulseRingContainer}>
          <div className={styles.ring} />
          <div className={styles.ring} />
          <div className={styles.ring} />
          <div className={styles.avatarWrapper}>
            <Avatar name={peer.name} size={84} />
          </div>
        </div>

        <h2 className={styles.callerName}>{peer.name || 'Incoming Call'}</h2>

        <div className={styles.callTypeBadge}>
          <span className={styles.dot} />
          <span>{callType === 'video' ? '📹 Incoming Video Call...' : '📞 Incoming Voice Call...'}</span>
        </div>

        <div className={styles.actions}>
          <div className={styles.actionItem}>
            <button
              type="button"
              className={`${styles.btn} ${styles.declineBtn}`}
              onClick={() => rejectCall('declined')}
              title="Decline call"
              aria-label="Decline call"
            >
              {/* Hangup / Phone off Icon */}
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
                <line x1="22" y1="2" x2="2" y2="22" />
              </svg>
            </button>
            <span className={styles.actionLabel}>Decline</span>
          </div>

          <div className={styles.actionItem}>
            <button
              type="button"
              className={`${styles.btn} ${styles.acceptBtn}`}
              onClick={acceptCall}
              title="Accept call"
              aria-label="Accept call"
            >
              {/* Accept Phone Icon */}
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </button>
            <span className={styles.actionLabel}>Accept</span>
          </div>
        </div>
      </div>
    </div>
  );
}
