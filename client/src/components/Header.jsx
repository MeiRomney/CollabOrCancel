import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { useNavigate } from "react-router-dom";

const Header = ({ activeMenu, toggleMenu }) => {
  const navigate = useNavigate();

  return (
    <>
      <div className="w-full h-32 bg-transparent border-b-white border-2 flex items-center justify-between px-5 flex-shrink-0">
        <div className="flex gap-10">
          <button
            onClick={toggleMenu}
            className={`w-36 h-16 border-white border-2 rounded-full flex justify-center items-center gap-3 transition-all duration-500 ease-in-out ${
              activeMenu
                ? "bg-white scale-95"
                : "bg-transparent hover:bg-white hover:scale-95"
            } group`}
          >
            <p
              className={
                activeMenu
                  ? "font-bold text-xl text-black translate-x-2 transition-all duration-500"
                  : "font-bold text-xl text-white transition-all duration-500 group-hover:text-black group-hover:translate-x-2"
              }
            >
              Menu
            </p>
            <img
              src="/images/menu.png"
              alt="menuIcon"
              className={`w-4 h-4 transition-all duration-500 ease-in-out ${
                activeMenu
                  ? "opacity-0 scale-0"
                  : "group-hover:opacity-0 group-hover:scale-0"
              }`}
            />
          </button>
          <button className="w-72 h-16 border-white border-2 rounded-full bg-transparent cursor-pointer flex justify-center items-center gap-3">
            <img
              src="/images/CollabOrCancelLogo.png"
              alt="logo"
              className="w-12 h-12"
            />
            <p className="font-bold text-xl text-white">Collab or Cancel</p>
          </button>
        </div>

        <div className="flex gap-16 text-white text-xl font-bold pr-5">
          {["Home", "Game Rules", "Roles", "About us", "Setting"].map(
            (item) => (
              <button
                key={item}
                className="cursor-pointer transition-all duration-500 relative 
              after:content-[''] after:absolute after:left-0 after:bottom-0 
              after:h-[3px] after:w-0 after:bg-white after:transition-all after:duration-500 
              hover:after:w-full hover:scale-110"
                onClick={() => {
                  if (item === "Home") navigate("/");
                  else if (item === "Game Rules") navigate("/gamerules");
                  else if (item === "Roles") navigate("/roles");
                  else if (item === "About us") navigate("/aboutus");
                  else if (item === "Setting") navigate("/setting");
                }}
              >
                {item}
              </button>
            )
          )}
          <button className="w-32 h-16 rounded-full bg-red-400 flex items-center justify-center cursor-pointer duration-500 hover:bg-red-500 hover:scale-95 transition-all">
            Sign Up
          </button>
        </div>
      </div>

      <AnimatePresence>
        {activeMenu ? (
          <motion.div
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute top-32 left-5 w-60 p-10 border-black border-2 rounded-xl bg-black opacity-90 z-50"
          >
            <div className="flex flex-col gap-10 text-white text-2xl font-bold pr-5">
              {["Home", "Game Rules", "Roles", "About us", "Setting"].map(
                (item) => (
                  <button
                    key={item}
                    className="cursor-pointer transition-all duration-500 relative 
                  after:content-[''] after:absolute after:left-0 after:bottom-0 
                  after:h-[3px] after:w-0 after:bg-white after:transition-all after:duration-500 
                  hover:after:w-full hover:scale-110"
                    onClick={() => {
                      if (item === "Home") navigate("/");
                      else if (item === "Game Rules") navigate("/gamerules");
                      else if (item === "Roles") navigate("/roles");
                      else if (item === "About us") navigate("/aboutus");
                      else if (item === "Setting") navigate("/setting");
                    }}
                  >
                    {item}
                  </button>
                )
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
};

export default Header;
