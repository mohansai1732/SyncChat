# MERN Real-Time Chat Application

A clean, resume-level real-time chat app using **React**, **Node.js**, **Express**, **MongoDB Atlas** (Mongoose), **Socket.io**, and **JWT** authentication. WhatsApp-style UI with one-to-one messaging, image uploads, online status, and seen indicators.

## Tech Stack

- **Frontend:** React (Vite), React Router, Socket.io Client, WebRTC, Axios, CSS Modules
- **Backend:** Node.js, Express, Mongoose, Socket.io, JWT, Multer, Cloudinary
- **Database:** MongoDB Atlas (database: `chatapp`)

## Features

- **Auth:** Signup, Login, JWT authentication, persistent sessions, profile management
- **Real-Time Messaging:** One-to-one messaging, Socket.io events, timestamps, seen/read status indicators
- **Conversations:** Recent chat list, last message preview, unread count badge
- **Voice & Video Calling:** Peer-to-peer WebRTC audio/video calls with ringtone tone generation and modal overlays
- **User Status:** Live online/offline presence tracking
- **Media & File Attachments:** Image, video, document, and file uploads powered by Cloudinary
- **UI & UX:** Modern WhatsApp-style layout, responsive design, dark-mode accents, scoped CSS modules

## 📁 Project Structure

```text
SyncChat/
├── 📂 backend/                             # Express & Node.js REST API + Socket.io Server
│   ├── 📂 config/
│   │   ├── cloudinary.js                  # Cloudinary SDK setup & Multer storage configuration
│   │   └── db.js                          # MongoDB Atlas Mongoose connection
│   ├── 📂 controllers/
│   │   ├── authController.js              # User authentication (register, login, me)
│   │   ├── conversationController.js      # Conversation threads & participant management
│   │   ├── messageController.js           # Message delivery, retrieval, & read receipts
│   │   ├── uploadController.js            # Media upload processing (images/attachments)
│   │   └── userController.js              # User directory & profile queries
│   ├── 📂 middleware/
│   │   ├── auth.js                        # JWT verification & route protection guard
│   │   ├── errorHandler.js                # Centralized 404 and global error handling
│   │   └── upload.js                      # Multer configuration for file and image handling
│   ├── 📂 models/
│   │   ├── Conversation.js                # Conversation schema (participants, lastMessage)
│   │   ├── Message.js                     # Message schema (sender, content, media, status)
│   │   └── User.js                        # User schema (credentials, avatar, online status)
│   ├── 📂 routes/
│   │   ├── authRoutes.js                  # /api/auth routes
│   │   ├── conversationRoutes.js          # /api/conversations routes
│   │   ├── messageRoutes.js               # /api/messages routes
│   │   ├── uploadRoutes.js                # /api/upload routes
│   │   └── userRoutes.js                  # /api/users routes
│   ├── 📂 socket/
│   │   └── index.js                       # Socket.io auth, active status & WebRTC signaling
│   ├── 📂 uploads/                        # Temporary local upload cache (.gitkeep)
│   ├── .env.example                       # Backend environment variable template
│   ├── package.json                       # Backend dependencies and run scripts
│   └── server.js                          # Express entry point, CORS, HTTP & Socket.io server
│
├── 📂 frontend/                            # React 18 + Vite SPA Client
│   ├── 📂 public/
│   │   └── _redirects                     # SPA routing redirect rule for deployment
│   ├── 📂 src/
│   │   ├── 📂 components/                 # Reusable UI components & scoped styles
│   │   │   ├── Avatar.jsx                 # User profile avatar with online status indicator
│   │   │   ├── Avatar.module.css
│   │   │   ├── CallModal.jsx              # Active WebRTC audio/video call screen overlay
│   │   │   ├── CallModal.module.css
│   │   │   ├── IncomingCallModal.jsx      # Incoming call alert dialog with audio tone
│   │   │   ├── IncomingCallModal.module.css
│   │   │   ├── ChatWindow.jsx             # Active chat header, message feed, media inputs
│   │   │   ├── ChatWindow.module.css
│   │   │   ├── MessageBubble.jsx          # Individual message bubble, timestamps, seen ticks
│   │   │   ├── MessageBubble.module.css
│   │   │   ├── Sidebar.jsx                # Conversation list, search, user info, logout
│   │   │   └── Sidebar.module.css
│   │   ├── 📂 context/                    # React Context providers for global state
│   │   │   ├── AuthContext.jsx            # User auth state, token storage, login/logout
│   │   │   ├── CallContext.jsx            # WebRTC P2P calling logic & tone generation
│   │   │   └── SocketContext.jsx          # Real-time Socket.io client connection management
│   │   ├── 📂 pages/                      # Top-level route pages
│   │   │   ├── Auth.module.css            # Styles for authentication screens
│   │   │   ├── Chat.jsx                   # Primary chat layout combining Sidebar & ChatWindow
│   │   │   ├── Chat.module.css
│   │   │   ├── Login.jsx                  # Sign-in page
│   │   │   └── Signup.jsx                 # User registration page
│   │   ├── 📂 services/
│   │   │   └── api.js                     # Axios client instance with Bearer token interceptor
│   │   ├── App.jsx                        # Root React component & route switch
│   │   ├── index.css                      # Global design system tokens, themes, typography
│   │   └── main.jsx                       # React DOM root render
│   ├── .env.example                       # Frontend environment variable template
│   ├── index.html                         # Single-page application HTML entry
│   ├── package.json                       # Frontend dependencies and Vite scripts
│   ├── vercel.json                        # Vercel deployment configuration
│   └── vite.config.js                     # Vite build and plugin configuration
│
├── .gitignore                             # Ignored files (node_modules, .env, uploads)
└── README.md                              # Project documentation
```

### 🏛️ Architectural Overview

| Layer / Directory | Primary Responsibility | Key Technologies |
| :--- | :--- | :--- |
| **Backend Core** (`server.js`) | Bootstraps Express, mounts HTTP & Socket.io servers, configures sanitized CORS. | Node.js, Express, `http` |
| **Database & Config** (`config/`) | Manages MongoDB Atlas connection via Mongoose and Cloudinary storage configuration. | Mongoose, Cloudinary |
| **Business Logic** (`controllers/`) | Encapsulates request processing for authentication, chats, messages, and file uploads. | JavaScript (ESM) |
| **Security & Guards** (`middleware/`) | Protects routes via JWT verification and manages multipart file parsing. | JSON Web Tokens, Multer |
| **Real-Time & Calls** (`socket/`) | Handles Socket.io authentication, online presence tracking, and WebRTC peer call signaling. | Socket.io, WebRTC |
| **State Management** (`context/`) | Distributes authentication state, real-time socket connections, and WebRTC call lifecycle. | React Context API |
| **UI Components** (`components/`) | Modular interface elements styled with isolated CSS Modules (chat bubbles, call dialogs, sidebar). | React, CSS Modules |
| **HTTP Client** (`services/`) | Configures Axios instance with automatic JWT Bearer token injection and error handling. | Axios |
