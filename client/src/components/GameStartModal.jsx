import React, { useEffect } from "react";
import { motion } from "framer-motion";
import BackgroundImage from "/images/resultsBackground.png";

const GameStartModal = ({ playerColor, role, allColors, onClose }) => {
  const otherColors = allColors.filter((c) => c !== playerColor);

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.(); // triggers exit animation
    }, 2000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        backgroundImage: `url(${BackgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Background characters */}
      <div className="absolute inset-0 flex justify-center items-center gap-10 opacity-30">
        {otherColors.slice(0, 7).map((color, i) => (
          <img
            key={color}
            src={`/images/charactersFront/${color}.png`}
            className="w-28 blur-sm"
            style={{ transform: `translateY(${(i % 2) * 40}px)` }}
          />
        ))}
      </div>

      {/* Main reveal */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="relative z-10 flex flex-col items-center gap-6 text-center"
      >
        <img
          src={`/images/charactersFront/${playerColor}.png`}
          className="w-60 drop-shadow-[0_0_40px_rgba(255,255,255,0.8)]"
        />

        <h1 className="text-white text-5xl font-extrabold">
          You are <span className="uppercase">{playerColor}</span>
        </h1>

        <h2
          className={`text-4xl font-bold ${
            role === "doomer" ? "text-red-400" : "text-blue-400"
          }`}
        >
          {role === "doomer" ? "DOOMER" : "VIBER"}
        </h2>
      </motion.div>
    </motion.div>
  );
};

export default GameStartModal;
