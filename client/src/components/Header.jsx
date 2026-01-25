import { AnimatePresence, motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase environment variables are missing!");
  console.log("VITE_SUPABASE_URL:", supabaseUrl);
  console.log("VITE_SUPABASE_ANON_KEY:", supabaseKey ? "Set" : "Missing");
}

const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const Header = ({ activeMenu, toggleMenu }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    // Check current user session
    const checkUser = async () => {
      if (!supabase) return;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    checkUser();

    // Listen for auth state changes
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setShowProfileMenu(false);
    navigate("/");
  };

  // Get user's initial from name or email
  const getUserInitial = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name.charAt(0).toUpperCase();
    } else if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

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
            ),
          )}

          {/* Conditional rendering: Profile button or Sign Up button */}
          {user ? (
            <div className="relative">
              <button
                className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center cursor-pointer duration-500 hover:from-indigo-700 hover:to-purple-700 hover:scale-95 transition-all shadow-lg"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <span className="text-white text-2xl font-bold">
                  {getUserInitial()}
                </span>
              </button>

              {/* Profile Dropdown Menu */}
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-56 bg-black/90 border-2 border-white rounded-xl shadow-lg overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-white/30">
                      <p className="text-white font-semibold text-sm truncate">
                        {user.user_metadata?.full_name || "User"}
                      </p>
                      <p className="text-gray-300 text-xs truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          // navigate("/profile");
                        }}
                        className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors duration-200 flex items-center gap-3"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        Profile
                      </button>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate("/setting");
                        }}
                        className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors duration-200 flex items-center gap-3"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        Settings
                      </button>
                      <hr className="border-white/30 my-2" />
                      <button
                        onClick={handleSignOut}
                        className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/10 transition-colors duration-200 flex items-center gap-3"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              className="w-32 h-16 rounded-full bg-red-400 flex items-center justify-center cursor-pointer duration-500 hover:bg-red-500 hover:scale-95 transition-all"
              onClick={() => navigate("/login")}
            >
              Sign Up
            </button>
          )}
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
                ),
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
};

export default Header;
