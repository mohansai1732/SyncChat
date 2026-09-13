import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import Avatar from './Avatar';
import MessageBubble from './MessageBubble';
import { useCall } from '../context/CallContext';
import styles from './ChatWindow.module.css';

export default function ChatWindow({ conversation, currentUser, socket, onConversationUpdate }) {
  const { startCall, callState } = useCall();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const listRef = useRef(null);

  const other = conversation?.participants?.find((p) => p._id !== currentUser?._id) || {};

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!conversation?._id) {
      setMessages([]);
      return;
    }
    setLoading(true);
    api
      .get(`/messages/${conversation._id}`)
      .then((res) => setMessages(res.data))
      .finally(() => setLoading(false));
  }, [conversation?._id]);

  useEffect(() => {
    if (socket && conversation?._id) {
      socket.emit('join_conversation', conversation._id);
      api.post(`/messages/${conversation._id}/seen`).catch(() => {});
      return () => socket.emit('leave_conversation', conversation._id);
    }
  }, [socket, conversation?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket) return;
    const onNew = (msg) => {
      if (msg.conversation === conversation?._id) {
        setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
      }
    };
    socket.on('message:new', onNew);
    return () => socket.off('message:new', onNew);
  }, [socket, conversation?._id]);

  const sendMessage = async (content, attachment = null) => {
    if (!conversation?._id) return;
    setSending(true);
    try {
      const res = await api.post(`/messages/${conversation._id}`, {
        content: content || '',
        type: attachment?.type || 'text',
        imageUrl: attachment?.type === 'image' ? attachment.url : undefined,
        fileUrl: attachment?.url,
        fileName: attachment?.name,
        fileMimeType: attachment?.mimeType,
        fileSize: attachment?.size,
      });
      setMessages((prev) => (prev.some((m) => m._id === res.data._id) ? prev : [...prev, res.data]));
      onConversationUpdate?.({
        ...conversation,
        lastMessage: res.data,
        lastMessageAt: res.data.createdAt,
      });
      setInput('');
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    sendMessage(text);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    api
      .post('/upload/file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(({ data }) => {
        if (!data.url) throw new Error('Upload did not return a file URL.');
        return sendMessage('', data);
      })
      .catch((error) => {
        console.log('File upload failed:', error.response?.data || error.message);
      })
      .finally(() => setUploading(false));
    e.target.value = '';
  };

  if (!conversation) {
    return (
      <div className={styles.placeholder}>
        <p>Select a chat or start a new one</p>
      </div>
    );
  }

  return (
    <div className={styles.window}>
      <header className={styles.header}>
        <Avatar name={other.name} size={40} />
        <div className={styles.headerInfo}>
          <span className={styles.headerName}>{other.name || other.email || 'Chat'}</span>
          <span className={styles.headerStatus}>Tap for more info</span>
        </div>

        {other._id && other._id !== currentUser?._id && (
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.callBtn}
              onClick={() => startCall(other, conversation._id, 'audio')}
              disabled={callState !== 'idle'}
              title="Start voice call"
              aria-label="Start voice call"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </button>

            <button
              type="button"
              className={styles.callBtn}
              onClick={() => startCall(other, conversation._id, 'video')}
              disabled={callState !== 'idle'}
              title="Start video call"
              aria-label="Start video call"
            >
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </button>
          </div>
        )}
      </header>

      <div className={styles.messages} ref={listRef}>
        {loading && <p className={styles.loading}>Loading messages...</p>}
        {!loading && messages.map((msg) => (
          <MessageBubble
            key={msg._id}
            message={msg}
            isOwn={msg.sender?._id === currentUser?._id || msg.sender === currentUser?._id}
            currentUserId={currentUser?._id}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.attachBtn}>
          <input
            type="file"
            accept="image/*,video/mp4,.pdf,.doc,.docx,.txt,.csv,.zip"
            onChange={handleFileSelect}
            disabled={uploading}
            hidden
          />
          {uploading ? '...' : '+'}
        </label>
        <input
          type="text"
          placeholder="Type a message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className={styles.input}
          disabled={sending}
        />
        <button type="submit" disabled={sending || !input.trim()} className={styles.sendBtn}>
          Send
        </button>
      </form>
    </div>
  );
}

