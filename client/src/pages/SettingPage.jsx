import React, { useState } from "react";
import Header from "../components/Header";

const SettingPage = () => {
  const [activeMenu, setActiveMenu] = useState(false);

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
        <button className="w-80 h-20 rounded-full bg-white flex items-center justify-center cursor-pointer duration-500 hover:bg-red-500 hover:scale-95 transition-all text-black text-2xl font-bold">
          PLAY NOW
        </button>
        <button className="w-80 h-20 rounded-full bg-red-400 flex items-center justify-center cursor-pointer duration-500 hover:bg-red-500 hover:scale-95 transition-all text-white text-2xl font-bold">
          Sign Up
        </button>
      </div>
    </div>
  );
};

export default SettingPage;
