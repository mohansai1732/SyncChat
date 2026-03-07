import styles from './Avatar.module.css';

export default function Avatar({ src, name, size = 40 }) {
  const initial = name ? name.trim().charAt(0).toUpperCase() : '?';
  return (
    <div className={styles.avatar} style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {src ? <img src={src.startsWith('/') ? src : src} alt="" /> : <span>{initial}</span>}
    </div>
  );
}
