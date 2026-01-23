import React from "react";
import { useEffect } from "react";
import { useContext } from "react";
import { useState } from "react";
import { useRef } from "react";
import { createContext } from "react";

const AudioContext = createContext(null);

export function AudioProvider({ children }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Load saved preference from local storage
  useEffect(() => {
    const savedMuted = localStorage.getItem("musicMuted") === "true";
    setIsMuted(savedMuted);

    if (!savedMuted && audioRef.current) {
      // Try to autoplay
      audioRef.current.play().catch(() => {
        console.log("Autoplay blocked - waiting for user interaction");
      });
    }
  }, []);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    localStorage.setItem("musicMuted", String(newMuted));

    if (audioRef.current) {
      if (newMuted) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <AudioContext.Provider value={{ isPlaying, isMuted, toggleMute }}>
      <audio
        ref={audioRef}
        src="/audio/music.mp3"
        loop
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      {children}
    </AudioContext.Provider>
  );
}

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within AudioProvider");
  }
  return context;
};
