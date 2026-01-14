import React from "react";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import HomePage from "./pages/HomePage";
import GameplayPage from "./pages/GameplayPage";
import Results from "./pages/Results";
import LobbyPage from "./pages/LobbyPage";
import MatchMakingPage from "./pages/MatchMakingPage";
import { SocketProvider } from "./contexts/SocketContext";
import GameRules from "./pages/GameRules";

const App = () => {
  return (
    <SocketProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/gamerules" element={<GameRules />} />
          <Route path="/matchmaking" element={<MatchMakingPage />} />
          <Route path="/lobby" element={<LobbyPage />} />
          <Route path="/gameplay" element={<GameplayPage />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      </BrowserRouter>
    </SocketProvider>
  );
};

export default App;
