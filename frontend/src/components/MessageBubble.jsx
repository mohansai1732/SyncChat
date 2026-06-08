import styles from './MessageBubble.module.css';
import api from '../services/api';

const getMediaUrl = (url) => {
  if (!url || /^(https?:|data:|blob:)/i.test(url)) return url;

  const apiBaseUrl = api.defaults.baseURL || window.location.origin;
  const backendOrigin = new URL(apiBaseUrl, window.location.origin).origin;
  return new URL(url, backendOrigin).toString();
};

export default function MessageBubble({ message, isOwn }) {
  const time = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';
  const seen = message.seenBy?.length > 0;
  const imageUrl = getMediaUrl(message.imageUrl);

  return (
    <div className={`${styles.wrapper} ${isOwn ? styles.own : ''}`}>
      <div className={styles.bubble}>
        {message.type === 'image' && imageUrl && (
          <a href={imageUrl} target="_blank" rel="noopener noreferrer" className={styles.imageWrap}>
            <img src={imageUrl} alt="" className={styles.image} />
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
