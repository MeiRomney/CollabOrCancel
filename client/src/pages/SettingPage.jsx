import React, { useState } from "react";
import Header from "../components/Header";
import { useAudio } from "../contexts/AudioContext";

const SettingPage = () => {
  const [activeMenu, setActiveMenu] = useState(false);
  const { isMuted, toggleMute } = useAudio();

  const toggleMenu = () => setActiveMenu(!activeMenu);

  return (
    <div
      className="w-screen h-screen overflow-hidden"
      style={{
        backgroundImage: "url('/HomePageBackground.png')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundAttachment: "fixed", // fix the background
      }}
    >
      {/* Header */}
      <Header activeMenu={activeMenu} toggleMenu={toggleMenu} />

      <div className="flex flex-col gap-10 mt-8 items-center justify-center">
        <h1 className="text-6xl font-bold text-white mb-10">Setting</h1>
        <button
          onClick={toggleMute}
          className="w-80 h-20 rounded-full bg-blue-400 flex items-center justify-center cursor-pointer duration-500 hover:bg-blue-500 hover:scale-95 transition-all text-white text-2xl font-bold"
        >
          {isMuted ? "🔇 Music Off" : "🔊 Music On"}
        </button>
      </div>
    </div>
  );
};

export default SettingPage;
