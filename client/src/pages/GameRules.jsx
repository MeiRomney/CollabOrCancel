import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const GameRules = () => {
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
                  else if (item === "About us") navigate("/aboutus");
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
        <h1 className="text-6xl font-bold text-white mb-10">
          Collab or Cancel – Game Instructions
        </h1>

        {/* Overview */}
        <section className="mb-8">
          <h2 className="text-4xl font-semibold text-white mb-4">
            1. Overview
          </h2>
          <ul className="list-disc list-inside text-white space-y-2 text-lg">
            <li>
              <strong>Players:</strong> 8 (6 Vibers, 2 Doomers)
            </li>
            <li>
              <strong>Goal:</strong>
              <ul className="list-decimal list-inside ml-6 space-y-1">
                <li>
                  Loyalists (Vibers): Two vibers must reach{" "}
                  <strong>10+ Aura</strong> together to win (becoming Overlord)
                </li>
                <li>
                  Traitors (Doomers): One doomer reaching{" "}
                  <strong>10 Aura</strong> wins solo (becoming Overlord)
                </li>
              </ul>
            </li>
            <li>
              <strong>Player stats:</strong>
              <ul className="list-disc list-inside ml-6 space-y-1">
                <li>Aura (PT): Start at 0</li>
                <li>Vibe (HP): Start at 2/2</li>
              </ul>
            </li>
            <li>
              Stats are <strong>hidden</strong> from all other players
            </li>
          </ul>
        </section>

        {/* Roles & Abilities */}
        <section className="mb-8">
          <h2 className="text-4xl font-semibold text-white mb-4">
            2. Roles & Abilities
          </h2>

          <h3 className="text-2xl font-bold text-white mb-2">2.1 Vibers</h3>
          <ul className="list-disc list-inside text-white space-y-2 ml-6 text-lg">
            <li>
              Proposal to form collab: +2 Aura if successful / –2 Aura if fails
            </li>
            <li>
              Voting for a collab: +1 Aura if your choice wins / –1 Aura if
              losing
            </li>
            <li>
              Skipping collab: 0 Aura (cannot be defended by collab host this
              round)
            </li>
            <li>
              Self-defense: +1 Aura / –0.5 Aura; see saboteur/attacker if
              defended successfully
            </li>
            <li>
              Defend others: +1 Aura / –0.5 Aura; see attacker/saboteur if
              defended successfully
            </li>
            <li>Heal others: +1 Aura / –1 Aura</li>
            <li>Sabotage: +1 PT (visible to sabotaged player)</li>
            <li>Vote to cancel a player: +0.5 Aura / –0.5 Aura</li>
          </ul>

          <h3 className="text-2xl font-bold text-white mb-2 mt-6">
            2.2 Doomers
          </h3>
          <ul className="list-disc list-inside text-white space-y-2 ml-6 text-lg">
            <li>All vibers abilities plus:</li>
            <li>Attack others: –1 Vibe</li>
            <li>Sabotage: +1 Aura (invisible)</li>
          </ul>

          <h3 className="text-2xl font-bold text-white mb-2 mt-6">
            2.3 Collab Host Ability
          </h3>
          <ul className="list-disc list-inside text-white space-y-2 ml-6 text-lg">
            <li>Immune from attacks during collab round</li>
            <li>Can defend any player without Aura penalty for one round</li>
            <li>
              Can see net Aura & Vibe changes for all players (aggregate only)
            </li>
          </ul>

          <h3 className="text-2xl font-bold text-white mb-2 mt-6">
            2.4 Special Rules
          </h3>
          <ul className="list-disc list-inside text-white space-y-2 ml-6 text-lg">
            <li>
              Get healed wrongly: Viber +1 Aura; Doomer +1 Aura + next attack
              does double damage
            </li>
            <li>Get sabotaged: –1 Aura</li>
            <li>Get attacked: –1 Aura</li>
            <li>Get healed: +1 Vibe</li>
            <li>Get voted out: canceled</li>
          </ul>
        </section>

        {/* Collab Mechanics */}
        <section className="mb-8">
          <h2 className="text-4xl font-semibold text-white mb-4">
            3. Collab Mechanics
          </h2>
          <ol className="list-decimal list-inside text-white space-y-2 text-lg ml-6">
            <li>Any player can propose a collab.</li>
            <li>Players vote for one collab to join or skip.</li>
            <li>
              Winning collab: largest number of players → +1 Aura for members
            </li>
            <li>Losing collab(s): –1 Aura for members</li>
            <li>
              Tie: all players in tied collab gain +1 Aura, no collab formed
            </li>
            <li>
              Skipping vote: player cannot be defended by collab host this round
            </li>
            <li>
              Leader bonus: proposer of winning collab optionally gains +2 Aura
            </li>
          </ol>
        </section>

        {/* Actions */}
        <section className="mb-8">
          <h2 className="text-4xl font-semibold text-white mb-4">
            4. Actions per Round
          </h2>
          <ol className="list-decimal list-inside text-white space-y-2 text-lg ml-6">
            <li>Collab proposals & votes</li>
            <li>Private communications</li>
            <li>Doomer actions: attack, sabotage</li>
            <li>Viber actions: heal, defend, self-defense, sabotage</li>
            <li>Voting for cancelation</li>
            <li>Resolve Aura & Vibe changes</li>
            <li>Resolve round event</li>
            <li>Check endgame conditions</li>
          </ol>
        </section>

        {/* Win Conditions */}
        <section className="mb-8">
          <h2 className="text-4xl font-semibold text-white mb-4">
            5. Win Conditions
          </h2>
          <ul className="list-disc list-inside text-white space-y-2 text-lg ml-6">
            <li>Vibers: Two vibers with 10+ Aura</li>
            <li>Doomer: One doomer with 10+ Aura</li>
            <li>Elimination: Aura ≤ –5 or voted out → canceled</li>
          </ul>
        </section>

        {/* Tips */}
        <section className="mb-8">
          <h2 className="text-4xl font-semibold text-white mb-4">6. Tips</h2>
          <ul className="list-disc list-inside text-white space-y-2 text-lg ml-6">
            <li>Balance alliance-building with personal Aura gain</li>
            <li>
              Collab, sabotage, and private communications create social
              deduction tension
            </li>
            <li>
              Aura and Vibe are hidden; players must infer roles and intentions
            </li>
            <li>
              Each round includes a mandatory event (optional for testing)
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default GameRules;
