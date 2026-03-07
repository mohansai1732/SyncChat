# MERN Real-Time Chat Application

A clean, resume-level real-time chat app using **React**, **Node.js**, **Express**, **MongoDB Atlas** (Mongoose), **Socket.io**, and **JWT** authentication. WhatsApp-style UI with one-to-one messaging, image uploads, online status, and seen indicators.

## Tech Stack

- **Frontend:** React (Vite), React Router, Socket.io Client, Axios
- **Backend:** Node.js, Express, Mongoose, Socket.io, JWT, Multer
- **Database:** MongoDB Atlas (existing cluster, database: `chatapp`)

## Features

- **Auth:** Signup, Login, JWT, basic profile (name, avatar)
- **Real-time:** One-to-one messaging, Socket.io, timestamps, seen status
- **Conversations:** Recent chat list, last message preview, unread count
- **User status:** Online / offline indicator
- **Media:** Send image messages, stored in backend `/uploads`
- **UI:** WhatsApp-style layout, sidebar chat list, message bubbles, responsive

## Project Structure

```
chat-application/
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection (dbName: chatapp)
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── conversationController.js
│   │   ├── messageController.js
│   │   └── uploadController.js
│   ├── middleware/
│   │   ├── auth.js            # JWT protect
│   │   ├── errorHandler.js
│   │   └── upload.js          # Multer image upload
│   ├── models/
│   │   ├── User.js
│   │   ├── Message.js
│   │   └── Conversation.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── conversationRoutes.js
│   │   ├── messageRoutes.js
│   │   └── uploadRoutes.js
│   ├── socket/
│   │   └── index.js           # Socket.io auth, join/leave, online/offline
│   ├── uploads/               # Image uploads (local)
│   ├── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## Setup (using your MongoDB Atlas cluster)

### 1. Backend

- **Do not** create a new cluster; use your existing MongoDB Atlas cluster.
- Database name used by the app: **`chatapp`** (set in `config/db.js` via `dbName: 'chatapp'`).

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` (copy from `.env.example`):

```env
PORT=5000
MONGODB_URI=mongodb+srv://mohansai1732_db_user:Mohan1732@cluster0.yph5pvw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

- Replace `JWT_SECRET` with a strong secret in production.
- Ensure your Atlas IP allowlist allows your current IP (or `0.0.0.0/0` for development only).

Start the server:

```bash
npm run dev
```

Server runs at `http://localhost:5000`. Uploaded images are served at `http://localhost:5000/uploads`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`. Vite proxies `/api`, `/uploads`, and `/socket.io` to the backend.

### 3. Usage

1. Open `http://localhost:5173`.
2. Sign up with name, email, password.
3. Use “+” in the sidebar to search users and start a chat.
4. Send text and image messages; see real-time delivery and online/offline status.

## API Overview

- **Auth:** `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me`, `PATCH /api/auth/profile`
- **Users:** `GET /api/users/search?q=`, `GET /api/users/:id`
- **Conversations:** `GET /api/conversations`, `POST /api/conversations` (body: `{ participantId }`)
- **Messages:** `GET /api/messages/:conversationId`, `POST /api/messages/:conversationId`, `POST /api/messages/:conversationId/seen`
- **Upload:** `POST /api/upload/image` (multipart `image`), returns `{ url }`

All except signup/login require `Authorization: Bearer <token>`.

## Socket.io Events

- **Client → Server:** `join_conversation`, `leave_conversation` (with conversation id).
- **Server → Client:** `user:online`, `user:offline` (payload: `{ userId }`), `message:new` (full message), `message:seen` (payload: `{ userId }`).

Connect with `auth: { token }` so the server can attach `userId` to the socket.

## Database (chatapp)

- **User:** name, email, password (hashed), avatar, lastSeen, isOnline
- **Conversation:** participants (2 user refs), lastMessage, lastMessageAt
- **Message:** conversation, sender, content, type (text | image), imageUrl, seenBy[]

No new cluster is created; the app uses your existing Atlas cluster and the `chatapp` database.
