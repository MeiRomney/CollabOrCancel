import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

const HomePage = () => {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState(false);

  const toggleMenu = () => {
    setActiveMenu(!activeMenu);
  };

  return (
    <div
      className="w-screen h-screen overflow-hidden flex flex-col"
      style={{
        backgroundImage: "url('/HomePageBackground.png')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Header */}
      <Header activeMenu={activeMenu} toggleMenu={toggleMenu} />

      {/* Body */}
      <div className="flex-1 flex items-center pl-10">
        <div>
          <p className="text-7xl font-bold text-white leading-tight">
            TRUST IS A<br />
            WEAPON.
            <br />
            BETRAYAL IS ART.
          </p>
          <div className="flex gap-10 mt-8">
            <button
              className="w-56 h-20 rounded-full bg-white flex items-center justify-center cursor-pointer duration-500 hover:bg-red-500 hover:scale-95 transition-all text-black text-2xl font-bold"
              onClick={() => navigate("/matchmaking")}
            >
              PLAY NOW
            </button>
            <button
              className="w-56 h-20 rounded-full bg-red-400 flex items-center justify-center cursor-pointer duration-500 hover:bg-red-500 hover:scale-95 transition-all text-white text-2xl font-bold"
              onClick={() => navigate("/login")}
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
