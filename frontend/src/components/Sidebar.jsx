import { useState, useRef } from 'react';
import api from '../services/api';
import Avatar from './Avatar';
import styles from './Sidebar.module.css';

export default function Sidebar({
  user,
  conversations,
  selectedConversation,
  onlineUsers,
  onSelectConversation,
  onStartChat,
  onRefreshConversations,
  onLogout,
}) {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchTimeoutRef = useRef(null);

  const searchUsers = async (q) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await api.get('/users/search', { params: { q } });
      setSearchResults(res.data);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchChange = (e) => {
    const v = e.target.value;
    setSearch(v);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => searchUsers(v), 300);
  };

  const getOtherParticipant = (conv) => {
    return conv.participants?.find((p) => p._id !== user._id) || {};
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (d.getFullYear() === now.getFullYear()) {
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const lastPreview = (conv) => {
    const last = conv.lastMessage;
    if (!last) return 'No messages yet';
    if (last.type === 'image') return '📷 Photo';
    return last.content?.slice(0, 35) + (last.content?.length > 35 ? '...' : '') || 'Photo';
  };

  return (
    <aside className={styles.sidebar}>
      <header className={styles.header}>
        <Avatar src={user?.avatar} name={user?.name} size={40} />
        <div className={styles.headerActions}>
          <button type="button" onClick={() => setShowSearch((s) => !s)} className={styles.iconBtn} title="New chat">
            <span className={styles.icon}>+</span>
          </button>
          <button type="button" onClick={onRefreshConversations} className={styles.iconBtn} title="Refresh">
            <span className={styles.icon}>↻</span>
          </button>
          <button type="button" onClick={onLogout} className={styles.iconBtn} title="Logout">
            <span className={styles.icon}>⎋</span>
          </button>
        </div>
      </header>

      {showSearch && (
        <div className={styles.searchPanel}>
          <input
            type="text"
            placeholder="Search users by name or email"
            value={search}
            onChange={handleSearchChange}
            className={styles.searchInput}
            autoFocus
          />
          {searching && <p className={styles.searchStatus}>Searching...</p>}
          <ul className={styles.searchResults}>
            {searchResults.map((u) => (
              <li key={u._id}>
                <button
                  type="button"
                  className={styles.searchResultItem}
                  onClick={() => {
                    onStartChat(u);
                    setShowSearch(false);
                    setSearch('');
                    setSearchResults([]);
                  }}
                >
                  <Avatar src={u.avatar} name={u.name} size={44} />
                  <div className={styles.searchResultInfo}>
                    <span className={styles.searchResultName}>{u.name}</span>
                    <span className={styles.searchResultEmail}>{u.email}</span>
                  </div>
                  {onlineUsers.has(u._id) && <span className={styles.onlineDot} />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.conversationList}>
        {conversations.length === 0 && !showSearch && (
          <p className={styles.empty}>No chats yet. Start a new chat above.</p>
        )}
        {conversations.map((conv) => {
          const other = getOtherParticipant(conv);
          const isSelected = selectedConversation?._id === conv._id;
          const unread = conv.unreadCount || 0;
          return (
            <button
              key={conv._id}
              type="button"
              className={`${styles.conversationItem} ${isSelected ? styles.selected : ''}`}
              onClick={() => onSelectConversation(conv)}
            >
              <div className={styles.convAvatar}>
                <Avatar src={other.avatar} name={other.name} size={48} />
                {onlineUsers.has(other._id) && <span className={styles.onlineBadge} />}
              </div>
              <div className={styles.convBody}>
                <div className={styles.convTop}>
                  <span className={styles.convName}>{other.name || other.email || 'Unknown'}</span>
                  {conv.lastMessageAt && (
                    <span className={styles.convTime}>{formatTime(conv.lastMessageAt)}</span>
                  )}
                </div>
                <div className={styles.convPreview}>
                  {lastPreview(conv)}
                  {unread > 0 && <span className={styles.unreadBadge}>{unread}</span>}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
