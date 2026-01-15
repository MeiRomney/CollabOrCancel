import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const AboutUsPage = () => {
  const navigate = useNavigate();
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
      <div className="w-full h-40 flex items-center justify-between p-5 border-b-2 border-white bg-transparent">
        {/* Logo + Menu */}
        <div className="flex gap-10">
          <button
            onClick={toggleMenu}
            className={`w-40 h-20 border-white border-2 rounded-full flex justify-center items-center gap-3 transition-all duration-500 ease-in-out ${
              activeMenu
                ? "bg-white scale-95"
                : "bg-transparent hover:bg-white hover:scale-95"
            } group`}
          >
            <p
              className={`font-bold text-2xl transition-all duration-500 ${
                activeMenu
                  ? "text-black translate-x-2"
                  : "text-white group-hover:text-black group-hover:translate-x-2"
              }`}
            >
              Menu
            </p>
            <img
              src="/images/menu.png"
              alt="menuIcon"
              className={`w-5 h-5 transition-all duration-500 ease-in-out ${
                activeMenu
                  ? "opacity-0 scale-0"
                  : "group-hover:opacity-0 group-hover:scale-0"
              }`}
            />
          </button>
          <button className="w-80 h-20 border-white border-2 rounded-full bg-transparent flex justify-center items-center gap-3">
            <img
              src="/images/CollabOrCancelLogo.png"
              alt="logo"
              className="w-15 h-15"
            />
            <p className="font-bold text-2xl text-white">Collab or Cancel</p>
          </button>
        </div>

        {/* Menu Items */}
        <div className="flex gap-20 text-white text-2xl font-bold pr-10">
          {["Home", "Game Rules", "Roles", "About us", "Setting"].map(
            (item) => (
              <button
                key={item}
                className="cursor-pointer relative after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[3px] after:w-0 after:bg-white after:transition-all after:duration-500 hover:after:w-full hover:scale-110"
                onClick={() => {
                  if (item === "Home") navigate("/");
                  else if (item === "Game Rules") navigate("/gamerules");
                  else if (item === "Roles") navigate("/roles");
                }}
              >
                {item}
              </button>
            )
          )}
          <button className="w-40 h-20 rounded-full bg-red-400 flex items-center justify-center cursor-pointer duration-500 hover:bg-red-500 hover:scale-95 transition-all">
            Sign Up
          </button>
        </div>
      </div>

      <AnimatePresence>
        {activeMenu && (
          <motion.div
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute w-60 p-10 border-black border-2 rounded-xl bg-black opacity-90 z-50"
          >
            <div className="flex flex-col gap-10 text-white text-2xl font-bold">
              {["Profile", "Character"].map((item) => (
                <button
                  key={item}
                  className="cursor-pointer relative after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[3px] after:w-0 after:bg-white after:transition-all after:duration-500 hover:after:w-full hover:scale-110"
                >
                  {item}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Body - scrollable */}
      <div className="w-full mx-auto h-[calc(100vh-10rem)] overflow-y-auto px-10 py-5 pl-50 scrollbar-hide">
        <h1 className="text-6xl font-bold text-white mb-10">About Us</h1>

        {/* Introduction */}
        <section className="mb-8">
          <h2 className="text-4xl font-semibold text-white mb-4">
            Welcome to Collab or Cancel
          </h2>
          <p className="text-white text-lg mb-4">
            Collab or Cancel is a social deduction game that blends strategy,
            deception, and collaboration. This project was created as a personal
            endeavor to explore game design, web development, and interactive
            storytelling.
          </p>
          <p className="text-white text-lg">
            The game challenges players to navigate the complex dynamics of
            trust and betrayal, where hidden roles and secret objectives create
            an atmosphere of tension and excitement. Whether you're a Vibe
            seeking loyal allies or a Doomer plotting your path to power, every
            decision matters.
          </p>
        </section>

        {/* About the Creator */}
        <section className="mb-8">
          <h2 className="text-4xl font-semibold text-white mb-4">
            About the Creator
          </h2>
          <p className="text-white text-lg mb-4">
            Hi, I'm <strong>Mei Romney</strong>, a Computer Science student
            passionate about game development, web technologies, and creating
            engaging interactive experiences. Collab or Cancel represents my
            vision of combining social psychology with competitive gameplay
            mechanics.
          </p>
          <p className="text-white text-lg mb-4">
            As a CS student, I've always been fascinated by how games can bring
            people together while challenging them to think strategically and
            creatively. This project allowed me to explore full-stack
            development, UI/UX design, and game balance—all while building
            something I'm truly passionate about.
          </p>
          <p className="text-white text-lg">
            I'm constantly learning and improving, and this game is a reflection
            of that journey. I hope you enjoy playing Collab or Cancel as much
            as I enjoyed creating it!
          </p>
        </section>

        {/* Project Information */}
        <section className="mb-8">
          <h2 className="text-4xl font-semibold text-white mb-4">
            Project Vision
          </h2>
          <p className="text-white text-lg mb-4">
            The goal of Collab or Cancel is to create a unique multiplayer
            experience that emphasizes social interaction, strategic thinking,
            and psychological gameplay. The game draws inspiration from popular
            social deduction games while introducing innovative mechanics like
            the Aura system and dynamic role abilities.
          </p>
          <p className="text-white text-lg">
            This is an ongoing project, and I'm always looking for ways to
            improve the gameplay, balance, and overall experience. Future
            updates may include new roles, additional game modes, and enhanced
            features based on player feedback and testing.
          </p>
        </section>

        {/* Contact Information */}
        <section className="mb-8">
          <h2 className="text-4xl font-semibold text-white mb-4">
            Get in Touch
          </h2>
          <p className="text-white text-lg mb-6">
            I'd love to hear your thoughts, feedback, or suggestions about
            Collab or Cancel! Whether you've found a bug, have ideas for new
            features, or just want to connect, feel free to reach out.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <span className="text-2xl">✉️</span>
              </div>
              <div>
                <p className="text-white text-xl font-semibold">Email</p>
                <a
                  href="mailto:mei.romney987@gmail.com"
                  className="text-blue-300 text-lg hover:text-blue-400 transition-colors"
                >
                  mei.romney987@gmail.com
                </a>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <span className="text-2xl">💼</span>
              </div>
              <div>
                <p className="text-white text-xl font-semibold">LinkedIn</p>
                <a
                  href="https://www.linkedin.com/in/meiromney/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-300 text-lg hover:text-blue-400 transition-colors"
                >
                  Romney Mei
                </a>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <span className="text-2xl">💻</span>
              </div>
              <div>
                <p className="text-white text-xl font-semibold">GitHub</p>
                <a
                  href="https://github.com/MeiRomney"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-300 text-lg hover:text-blue-400 transition-colors"
                >
                  MeiRomney
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Acknowledgments */}
        <section className="mb-8">
          <h2 className="text-4xl font-semibold text-white mb-4">
            Acknowledgments
          </h2>
          <p className="text-white text-lg mb-4">
            Special thanks to everyone who has supported this project, provided
            feedback, and helped test the game. Your insights have been
            invaluable in shaping Collab or Cancel into what it is today.
          </p>
          <p className="text-white text-lg">
            This project is built with modern web technologies including React,
            Framer Motion, and React Router. The game mechanics were designed
            with careful consideration for balance, player psychology, and
            engaging gameplay.
          </p>
        </section>

        {/* Future Updates */}
        <section className="mb-8">
          <h2 className="text-4xl font-semibold text-white mb-4">
            What's Next?
          </h2>
          <p className="text-white text-lg mb-4">
            Development of Collab or Cancel is ongoing, and I have exciting
            plans for the future. Potential updates include:
          </p>
          <p className="text-white text-lg ml-6 mb-2">
            New character roles with unique abilities and strategies, expanded
            game modes for different group sizes and playstyles, enhanced visual
            and audio effects to improve immersion, matchmaking and multiplayer
            functionality for online play, and detailed statistics and
            leaderboards to track player performance.
          </p>
          <p className="text-white text-lg mt-4">
            Stay tuned for updates, and thank you for being part of the Collab
            or Cancel community!
          </p>
        </section>
      </div>
    </div>
  );
};

export default AboutUsPage;
