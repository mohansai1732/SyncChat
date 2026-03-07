import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import Avatar from './Avatar';
import MessageBubble from './MessageBubble';
import styles from './ChatWindow.module.css';

export default function ChatWindow({ conversation, currentUser, socket, onConversationUpdate }) {
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

  const sendMessage = async (content, type = 'text', imageUrl = '') => {
    if (!conversation?._id) return;
    setSending(true);
    try {
      const res = await api.post(`/messages/${conversation._id}`, {
        content: content || '',
        type,
        imageUrl: imageUrl || undefined,
      });
      // console.log(res);
      setMessages((prev) => [...prev, content]);
      setInput('');
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    sendMessage(text, 'text');
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    const token = localStorage.getItem('token');
    fetch('/api/upload/image', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
      credentials: 'include',
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.url) sendMessage('', 'image', data.url);
      })
      .catch(() => {})
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
        <Avatar src={other.avatar} name={other.name} size={40} />
        <div className={styles.headerInfo}>
          <span className={styles.headerName}>{other.name || other.email || 'Chat'}</span>
          <span className={styles.headerStatus}>Tap for more info</span>
        </div>
      </header>

      <div className={styles.messages} ref={listRef}>
        {loading && <p className={styles.loading}>Loading messages...</p>}
        {!loading && messages.map((msg) => (
          <MessageBubble
            key={msg._id}
            message={msg}
            isOwn={msg.sender?._id === currentUser?._id || msg.sender === currentUser?._id}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.attachBtn}>
          <input type="file" accept="image/*" onChange={handleImageSelect} disabled={uploading} hidden />
          {uploading ? '…' : '📷'}
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
