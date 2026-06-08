import styles from './MessageBubble.module.css';
import api from '../services/api';

const getMediaUrl = (url) => {
  if (!url || /^(https?:|data:|blob:)/i.test(url)) return url;

  const apiBaseUrl = api.defaults.baseURL || window.location.origin;
  const backendOrigin = new URL(apiBaseUrl, window.location.origin).origin;
  return new URL(url, backendOrigin).toString();
};

const formatFileSize = (size = 0) => {
  if (!size) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export default function MessageBubble({ message, isOwn, currentUserId }) {
  const time = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';
  const seen = message.seenBy?.some((id) => id.toString() !== currentUserId);
  const fileUrl = getMediaUrl(message.fileUrl || message.imageUrl);
  const isImage = message.type === 'image';
  const isFile = message.type === 'file';

  return (
    <div className={`${styles.wrapper} ${isOwn ? styles.own : ''}`}>
      <div className={styles.bubble}>
        {isImage && fileUrl && (
          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className={styles.imageWrap}>
            <img src={fileUrl} alt={message.fileName || 'Shared image'} className={styles.image} />
          </a>
        )}
        {isFile && fileUrl && (
          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className={styles.fileWrap}>
            <span className={styles.fileIcon}>FILE</span>
            <span className={styles.fileInfo}>
              <span className={styles.fileName}>{message.fileName || 'Attachment'}</span>
              <span className={styles.fileMeta}>{formatFileSize(message.fileSize)}</span>
            </span>
          </a>
        )}
        {message.type === 'text' && message.content && <p className={styles.text}>{message.content}</p>}
        <div className={styles.meta}>
          <span className={styles.time}>{time}</span>
          {isOwn && (
            <span className={styles.seen}>{seen ? '✓✓' : '✓'}</span>
          )}
        </div>
      </div>
    </div>
  );
}
