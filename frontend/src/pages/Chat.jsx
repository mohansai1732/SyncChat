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

  const [selectedConversation, setSelectedConversation] =
    useState(null);

  const [onlineUsers, setOnlineUsers] =
    useState(new Set());

  // =========================
  // ONLINE / OFFLINE USERS
  // =========================

  useEffect(() => {
    if (!socket) return;

    const handleOnline = ({ userId }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.add(userId);
        return next;
      });
    };

    const handleOffline = ({ userId }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };

    socket.on('user:online', handleOnline);

    socket.on('user:offline', handleOffline);

    return () => {
      socket.off('user:online', handleOnline);

      socket.off('user:offline', handleOffline);
    };
  }, [socket]);

  // =========================
  // LOAD CONVERSATIONS
  // =========================

  const loadConversations = async () => {
    try {
      const res = await api.get('/conversations');

      setConversations(res.data);
      setOnlineUsers(
        new Set(
          res.data
            .flatMap((conv) => conv.participants || [])
            .filter((participant) => participant.isOnline && participant._id !== user._id)
            .map((participant) => participant._id)
        )
      );
    } catch (err) {
      console.log(
        'Load conversations error:',
        err
      );
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // =========================
  // NEW MESSAGE HANDLER
  // =========================

  const handleNewMessage = (message) => {
    const convId = message.conversation;
    const conversationDetails = message.conversationDetails || {};

    const isForSelected =
      selectedConversation?._id === convId;

    setConversations((prev) => {
      const exists = prev.find(
        (c) => c._id === convId
      );

      let updated;

      if (exists) {
        updated = prev.map((c) =>
          c._id === convId
            ? {
                ...c,
                lastMessage: message,
                lastMessageAt:
                  message.createdAt,

                unreadCount: isForSelected
                  ? 0
                  : (c.unreadCount || 0) + 1,
              }
            : c
        );
      } else {
        updated = [
          {
            ...conversationDetails,
            _id: convId,
            participants:
              conversationDetails.participants ||
              [],
            lastMessage: message,
            lastMessageAt:
              message.createdAt,
            unreadCount:
              isForSelected ? 0 : 1,
          },

          ...prev,
        ];
      }

      return updated.sort(
        (a, b) =>
          new Date(b.lastMessageAt || 0) -
          new Date(a.lastMessageAt || 0)
      );
    });

    if (isForSelected) {
      setSelectedConversation((prev) =>
        prev
          ? {
              ...prev,
              lastMessage: message,
              lastMessageAt:
                message.createdAt,
            }
          : null
      );
    }
  };

  // =========================
  // MESSAGE SEEN
  // =========================

  const handleMessageSeen = ({ userId }) => {
    if (userId === user._id) return;

    setConversations((prev) =>
      prev.map((c) =>
        c.participants.some(
          (p) => p._id === userId
        )
          ? {
              ...c,

              lastMessage: c.lastMessage
                ? {
                    ...c.lastMessage,

                    seenBy: [
                      ...(c.lastMessage.seenBy ||
                        []),

                      userId,
                    ],
                  }
                : c.lastMessage,
            }
          : c
      )
    );
  };

  // =========================
  // SOCKET LISTENERS
  // =========================

  useEffect(() => {
    if (!socket) return;

    socket.on(
      'message:new',
      handleNewMessage
    );

    socket.on(
      'message:seen',
      handleMessageSeen
    );

    return () => {
      socket.off(
        'message:new',
        handleNewMessage
      );

      socket.off(
        'message:seen',
        handleMessageSeen
      );
    };
  }, [socket, selectedConversation]);

  // =========================
  // START / SELECT CHAT
  // =========================

  const startOrSelectConversation =
  async (participant) => {

    try {

      console.log(
        'Selected participant:',
        participant
      );

      if (
        !participant ||
        !participant._id
      ) {
        console.log('Invalid participant');
        return;
      }

      // Prevent self chat
      if (
        participant._id === user._id
      ) {
        console.log('Cannot chat with yourself');
        return;
      }

      const res = await api.post(
        '/conversations',
        {
          participantId:
            participant._id,
        }
      );

      const conv = res.data;

      const existing =
        conversations.find(
          (c) =>
            c._id === conv._id
        );

      if (!existing) {

        const safeConv = {
          ...conv,

          participants:
            conv.participants ||
            [],

          unreadCount: 0,
        };

        setConversations(
          (prev) => [
            safeConv,
            ...prev,
          ]
        );
      }

      if (
        selectedConversation?._id
      ) {
        socket?.emit(
          'leave_conversation',
          selectedConversation._id
        );
      }

      socket?.emit(
        'join_conversation',
        conv._id
      );

      setSelectedConversation(
        conv
      );

    } catch (err) {

      console.log(
        'Conversation error:',
        err.response?.data ||
          err.message
      );
    }
  };

  // =========================
  // CLEAR UNREAD
  // =========================

  const clearUnread = (conv) => {
    setConversations((prev) =>
      prev.map((c) =>
        c._id === conv._id
          ? {
              ...c,
              unreadCount: 0,
            }
          : c
      )
    );
  };

  // =========================
  // RENDER
  // =========================

  return (
    <div className={styles.layout}>
      <Sidebar
        user={user}
        conversations={conversations}
        selectedConversation={
          selectedConversation
        }
        onlineUsers={onlineUsers}
        onSelectConversation={(conv) => {

          // Leave previous room
          if (
            selectedConversation?._id
          ) {
            socket?.emit(
              'leave_conversation',
              selectedConversation._id
            );
          }

          // Join selected room
          socket?.emit(
            'join_conversation',
            conv._id
          );

          setSelectedConversation(conv);

          clearUnread(conv);
        }}
        onStartChat={
          startOrSelectConversation
        }
        onRefreshConversations={
          loadConversations
        }
        onLogout={logout}
      />

      <ChatWindow
        conversation={
          selectedConversation
        }
        currentUser={user}
        socket={socket}
        onConversationUpdate={(
          updated
        ) => {
          setSelectedConversation(
            updated
          );

          setConversations((prev) =>
            prev
              .map((c) =>
                c._id === updated._id
                  ? {
                      ...c,
                      ...updated,
                      unreadCount:
                        updated.unreadCount ??
                        c.unreadCount ??
                        0,
                    }
                  : c
              )
              .sort(
                (a, b) =>
                  new Date(
                    b.lastMessageAt || 0
                  ) -
                  new Date(
                    a.lastMessageAt || 0
                  )
              )
          );
        }}
      />
    </div>
  );
}
