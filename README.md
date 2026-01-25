# 🎮 Collab or Cancel

A fast-paced multiplayer browser game where players compete in real-time challenges, collaborate with teammates, and decide who stays in the game. Built with modern web technologies for seamless gameplay and instant action.

View Live Site: [https://collab-or-cancel-game.vercel.app/](https://collab-or-cancel-game.vercel.app/)

---
<img width="1918" height="901" alt="image" src="https://github.com/user-attachments/assets/0443e4bc-2f1f-4771-b9ea-e3daae555727" />
<img width="1918" height="907" alt="image" src="https://github.com/user-attachments/assets/4fafc150-c62f-4096-ab23-9ae00d7097a1" />

---

## 🌟 Features

- **Real-Time Multiplayer** — Play with friends using WebSocket connections for instant updates
- **Matchmaking System** — Automatic player pairing and team assignment
- **Live Chat & DMs** — Communicate with other players in real-time
- **Dynamic Gameplay** — Collab with teammates or cancel opponents to win
- **Responsive Design** — Play on desktop, tablet, or mobile devices
- **User Authentication** — Secure login and account management with Supabase

## 🚀 Getting Started

### Prerequisites

- Node.js v22.12.0 or higher
- npm v10.0.0 or higher
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/collab-or-cancel.git
   cd collab-or-cancel
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the `client/` folder:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_KEY=your_supabase_anon_key
   ```

   Create a `.env` file in the `server/` folder:
   ```
   PORT=3001
   CLIENT_URL=http://localhost:5173
   ALLOWED_ORIGINS=http://localhost:5173
   ```

4. **Start the development servers**
   ```bash
   # Terminal 1 - Frontend
   cd client
   npm run dev

   # Terminal 2 - Backend
   cd server
   npm start
   ```

5. **Open your browser**
   ```
   http://localhost:5173
   ```

## 📁 Project Structure

```
collab-or-cancel/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── server/                 # Node.js backend
│   ├── sockets/           # Socket.io event handlers
│   ├── index.js           # Server entry point
│   ├── app.js             # Express app setup
│   ├── socket.js          # Socket.io configuration
│   └── package.json
├── package.json           # Root monorepo config
└── railway.json          # Railway deployment config
```

## 🛠️ Tech Stack

### Frontend
- **React** — UI library
- **Vite** — Fast build tool
- **Tailwind CSS** — Utility-first CSS framework
- **Socket.io Client** — Real-time communication
- **React Router** — Client-side routing
- **Supabase** — Authentication & backend services

### Backend
- **Node.js** — JavaScript runtime
- **Express.js** — Web framework
- **Socket.io** — Real-time WebSocket library
- **CORS** — Cross-origin resource sharing
- **Dotenv** — Environment variable management

## 🎮 How to Play

1. **Sign up or log in** with your account
2. **Enter matchmaking** to find opponents
3. **Collaborate with teammates** or **cancel opponents** to win rounds
4. **Chat in real-time** with other players
5. **Climb the leaderboard** to become the ultimate champion

## 🚢 Deployment

### Frontend (Vercel)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set Root Directory to `client/`
4. Add environment variables in Vercel settings
5. Deploy!

### Backend (Railway)
1. Connect your GitHub repository to Railway
2. Railway automatically deploys the monorepo
3. Add environment variables in Railway dashboard
4. Backend runs automatically on deployment

## 🔑 Environment Variables

### Frontend (`client/.env.local`)
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_KEY=your_supabase_anon_key
```

### Backend (`server/.env`)
```
PORT=3001
CLIENT_URL=https://your-frontend-url.vercel.app
ALLOWED_ORIGINS=https://your-frontend-url.vercel.app
NODE_ENV=production
```

## 📡 API & Socket Events

### Socket.io Events

**Matchmaking**
- `join-queue` — Join the matchmaking queue
- `leave-queue` — Leave the matchmaking queue
- `match-found` — Match successfully created

**Game**
- `game-start` — Game round begins
- `player-action` — Player performs an action
- `round-end` — Round ends with results
- `game-end` — Game concludes with winner

**Chat**
- `send-message` — Send chat message
- `receive-message` — Receive chat message
- `user-joined` — User joins chat
- `user-left` — User leaves chat

**Direct Messages**
- `send-dm` — Send direct message to player
- `receive-dm` — Receive direct message

## 🐛 Troubleshooting

**Socket.io Connection Error (404)**
- Ensure backend is running on correct port
- Check CORS configuration in `server/socket.js`
- Verify client is connecting to correct backend URL

**Build Fails on Railway**
- Ensure Node.js version is 22.12.0 or higher
- Delete `package-lock.json` files and reinstall
- Check that all environment variables are set

**Frontend Can't Connect to Backend**
- Verify backend URL in frontend code matches deployment URL
- Check that ALLOWED_ORIGINS includes your frontend domain
- Ensure firewall/network allows WebSocket connections

## 📝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License — see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [React](https://react.dev) and [Vite](https://vitejs.dev)
- Real-time magic with [Socket.io](https://socket.io)
- Authentication by [Supabase](https://supabase.com)
- Deployed on [Vercel](https://vercel.com) and [Railway](https://railway.app)

## 📞 Support

Have questions or found a bug? Open an issue on GitHub or reach out to the development team.

---

**Happy gaming! 🎉**
