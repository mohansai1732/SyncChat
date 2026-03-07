import styles from './MessageBubble.module.css';

export default function MessageBubble({ message, isOwn }) {
  const time = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';
  const seen = message.seenBy?.length > 0;

  return (
    <div className={`${styles.wrapper} ${isOwn ? styles.own : ''}`}>
      <div className={styles.bubble}>
        {message.type === 'image' && message.imageUrl && (
          <a href={message.imageUrl} target="_blank" rel="noopener noreferrer" className={styles.imageWrap}>
            <img src={message.imageUrl} alt="" className={styles.image} />
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
