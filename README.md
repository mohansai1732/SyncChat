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

