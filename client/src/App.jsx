import React from "react";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import HomePage from "./pages/HomePage";
import GameplayPage from "./pages/GameplayPage";
import Results from "./pages/Results";
import LobbyPage from "./pages/LobbyPage";
import MatchMakingPage from "./pages/MatchMakingPage";
import { SocketProvider } from "./contexts/SocketContext";
import GameRules from "./pages/GameRules";
import RolesPage from "./pages/RolesPage";
import AboutUsPage from "./pages/AboutUsPage";
import SettingPage from "./pages/SettingPage";
import { AudioProvider } from "./contexts/AudioContext";

const App = () => {
  return (
    <AudioProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/gamerules" element={<GameRules />} />
            <Route path="/roles" element={<RolesPage />} />
            <Route path="/aboutus" element={<AboutUsPage />} />
            <Route path="/setting" element={<SettingPage />} />
            <Route path="/matchmaking" element={<MatchMakingPage />} />
            <Route path="/lobby" element={<LobbyPage />} />
            <Route path="/gameplay" element={<GameplayPage />} />
            <Route path="/results" element={<Results />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AudioProvider>
  );
};

export default App;
