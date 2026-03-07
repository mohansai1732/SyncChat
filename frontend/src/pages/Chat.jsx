import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import styles from './Chat.module.css';

export default function Chat() {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    if (!socket) return;
    socket.on('user:online', ({ userId }) => {
      setOnlineUsers((prev) => new Set(prev).add(userId));
    });
    socket.on('user:offline', ({ userId }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });
    return () => {
      socket.off('user:online');
      socket.off('user:offline');
    };
  }, [socket]);

  const loadConversations = async () => {
    const res = await api.get('/conversations');
    setConversations(res.data);
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const handleNewMessage = (message) => {
    const convId = message.conversation;
    const isForSelected = selectedConversation?._id === convId;
    setConversations((prev) => {
      const updated = prev.map((c) =>
        c._id === convId
          ? {
              ...c,
              lastMessage: message,
              lastMessageAt: message.createdAt,
              unreadCount: isForSelected ? 0 : (c.unreadCount || 0) + 1,
            }
          : c
      );
      return updated.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
    });
    if (selectedConversation?._id === message.conversation) {
      setSelectedConversation((prev) => prev ? { ...prev, lastMessage: message } : null);
    }
  };

  const handleMessageSeen = ({ userId }) => {
    if (userId === user._id) return;
    setConversations((prev) =>
      prev.map((c) => (c.participants.some((p) => p._id === userId) ? { ...c, lastMessage: c.lastMessage ? { ...c.lastMessage, seenBy: [...(c.lastMessage.seenBy || []), userId] } : c } : c))
    );
  };

  useEffect(() => {
    if (!socket) return;
    socket.on('message:new', handleNewMessage);
    socket.on('message:seen', handleMessageSeen);
    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:seen', handleMessageSeen);
    };
  }, [socket, selectedConversation?._id]);

  const startOrSelectConversation = async (participant) => {
    const res = await api.post('/conversations', { participantId: participant._id });
    const conv = res.data;
    const existing = conversations.find((c) => c._id === conv._id);
    if (!existing) setConversations((prev) => [conv, ...prev]);
    setSelectedConversation(conv);
  };

  const clearUnread = (conv) => {
    setConversations((prev) => prev.map((c) => (c._id === conv._id ? { ...c, unreadCount: 0 } : c)));
  };

  return (
    <div className={styles.layout}>
      <Sidebar
        user={user}
        conversations={conversations}
        selectedConversation={selectedConversation}
        onlineUsers={onlineUsers}
        onSelectConversation={(conv) => {
          setSelectedConversation(conv);
          clearUnread(conv);
        }}
        onStartChat={startOrSelectConversation}
        onRefreshConversations={loadConversations}
        onLogout={logout}
      />
      <ChatWindow
        conversation={selectedConversation}
        currentUser={user}
        socket={socket}
        onConversationUpdate={(updated) => {
          setSelectedConversation(updated);
          setConversations((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
        }}
      />
    </div>
  );
}
