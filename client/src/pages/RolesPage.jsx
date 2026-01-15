import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const RolesPage = () => {
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
          Collab or Cancel – Roles
        </h1>

        {/* Vibers */}
        <section className="mb-8">
          <h2 className="text-4xl font-semibold text-white mb-4">
            Vibers (Loyalists)
          </h2>
          <p className="text-white text-lg mb-4">
            Vibers are the loyal players who must work together to achieve
            victory. There are 6 Vibers in each game, and they start with 0 Aura
            and 2 Vibe. Their goal is to have two Vibers reach 10+ Aura together
            to become Overlords and win the game.
          </p>

          <h3 className="text-2xl font-bold text-white mb-2">Abilities</h3>
          <ul className="list-disc list-inside text-white space-y-2 ml-6 text-lg">
            <li>
              <strong>Propose Collab:</strong> Earn +2 Aura if successful, lose
              –2 Aura if it fails
            </li>
            <li>
              <strong>Vote for Collab:</strong> Gain +1 Aura if your choice
              wins, lose –1 Aura if it loses
            </li>
            <li>
              <strong>Skip Collab:</strong> Earn 0 Aura, but you cannot be
              defended by the collab host this round
            </li>
            <li>
              <strong>Self-Defense:</strong> Successfully defending yourself
              grants +1 Aura (or –0.5 if failed) and reveals the
              saboteur/attacker
            </li>
            <li>
              <strong>Defend Others:</strong> Protecting another player grants
              +1 Aura (or –0.5 if failed) and reveals the attacker/saboteur
            </li>
            <li>
              <strong>Heal Others:</strong> Restore another player's Vibe for +1
              Aura (or –1 if healing a Doomer)
            </li>
            <li>
              <strong>Sabotage:</strong> Reduce another player's Aura by 1
              (visible to the sabotaged player) and gain +1 Aura
            </li>
            <li>
              <strong>Vote to Cancel:</strong> Earn +0.5 Aura if your vote
              succeeds, lose –0.5 if it fails
            </li>
          </ul>

          <h3 className="text-2xl font-bold text-white mb-2 mt-6">
            Strategy Tips
          </h3>
          <p className="text-white text-lg ml-6">
            Vibers must balance building alliances with gaining personal Aura.
            Trust is crucial, but remember that stats are hidden from all
            players. Use your defensive abilities wisely to identify threats and
            protect your fellow Vibers. Communication and collaboration are your
            greatest strengths.
          </p>
        </section>

        {/* Doomers */}
        <section className="mb-8">
          <h2 className="text-4xl font-semibold text-white mb-4">
            Doomers (Traitors)
          </h2>
          <p className="text-white text-lg mb-4">
            Doomers are the traitors hidden among the Vibers. There are 2
            Doomers in each game, and they start with 0 Aura and 2 Vibe just
            like Vibers. A single Doomer reaching 10+ Aura wins the game solo by
            becoming the Overlord.
          </p>

          <h3 className="text-2xl font-bold text-white mb-2">Abilities</h3>
          <ul className="list-disc list-inside text-white space-y-2 ml-6 text-lg">
            <li>
              <strong>All Viber Abilities:</strong> Doomers can use all the same
              abilities as Vibers to blend in
            </li>
            <li>
              <strong>Attack Others:</strong> Reduce another player's Vibe by 1
              (unique to Doomers)
            </li>
            <li>
              <strong>Invisible Sabotage:</strong> Unlike Vibers, when Doomers
              sabotage, it's invisible to the victim, making them harder to
              detect
            </li>
          </ul>

          <h3 className="text-2xl font-bold text-white mb-2 mt-6">
            Strategy Tips
          </h3>
          <p className="text-white text-lg ml-6">
            Doomers must deceive and manipulate to succeed. Blend in with the
            Vibers by participating in collabs and using healing/defensive
            abilities. Use your attack ability strategically to eliminate
            threats while maintaining your cover. Remember, you win
            alone—betrayal is your path to victory.
          </p>
        </section>

        {/* Collab Host */}
        <section className="mb-8">
          <h2 className="text-4xl font-semibold text-white mb-4">
            Collab Host (Temporary Role)
          </h2>
          <p className="text-white text-lg mb-4">
            The Collab Host is a temporary role assigned to the player who
            successfully proposes the winning collab for that round. This role
            grants powerful abilities for one round only.
          </p>

          <h3 className="text-2xl font-bold text-white mb-2">
            Special Abilities
          </h3>
          <ul className="list-disc list-inside text-white space-y-2 ml-6 text-lg">
            <li>
              <strong>Attack Immunity:</strong> Cannot be attacked during the
              collab round
            </li>
            <li>
              <strong>Free Defense:</strong> Can defend any player without Aura
              penalty for one round
            </li>
            <li>
              <strong>Stat Vision:</strong> Can see net Aura and Vibe changes
              for all players (aggregate only, not individual stats)
            </li>
          </ul>

          <h3 className="text-2xl font-bold text-white mb-2 mt-6">
            Strategy Tips
          </h3>
          <p className="text-white text-lg ml-6">
            As Collab Host, use your immunity and vision wisely. The ability to
            see stat changes can help you identify suspicious behavior patterns.
            Your free defense can be crucial for protecting key allies or
            exposing attackers. However, remember this power is temporary—use it
            to gain strategic advantage for future rounds.
          </p>
        </section>

        {/* Overlord */}
        <section className="mb-8">
          <h2 className="text-4xl font-semibold text-white mb-4">
            Overlord (Victory Role)
          </h2>
          <p className="text-white text-lg mb-4">
            The Overlord represents ultimate victory in Collab or Cancel. This
            is not a role you start with, but rather the status you achieve when
            you win the game.
          </p>

          <h3 className="text-2xl font-bold text-white mb-2">
            How to Become Overlord
          </h3>
          <ul className="list-disc list-inside text-white space-y-2 ml-6 text-lg">
            <li>
              <strong>Viber Path:</strong> Two Vibers must both reach 10+ Aura
              simultaneously. They become co-Overlords and share the victory.
            </li>
            <li>
              <strong>Doomer Path:</strong> A single Doomer reaching 10+ Aura
              becomes the sole Overlord, achieving victory alone through
              deception and betrayal.
            </li>
          </ul>

          <h3 className="text-2xl font-bold text-white mb-2 mt-6">
            The Ultimate Goal
          </h3>
          <p className="text-white text-lg ml-6">
            Becoming Overlord means you've mastered the delicate balance of
            collaboration and competition. Whether through teamwork as a Viber
            or cunning deception as a Doomer, the Overlord status represents
            dominance in the social game of Collab or Cancel.
          </p>
        </section>

        {/* Elimination */}
        <section className="mb-8">
          <h2 className="text-4xl font-semibold text-white mb-4">
            Elimination & Cancelation
          </h2>
          <p className="text-white text-lg mb-4">
            Players can be eliminated from the game through two primary methods:
          </p>

          <ul className="list-disc list-inside text-white space-y-2 ml-6 text-lg">
            <li>
              <strong>Negative Aura:</strong> If your Aura drops to –5 or below,
              you are canceled and eliminated from the game
            </li>
            <li>
              <strong>Voting:</strong> Players can vote to cancel someone each
              round. If you receive enough votes, you're eliminated
            </li>
            <li>
              <strong>Zero Vibe:</strong> If your Vibe (HP) reaches 0 from
              attacks, you are canceled
            </li>
          </ul>

          <p className="text-white text-lg mt-4 ml-6">
            Remember: all player stats are hidden. You won't know exactly how
            close someone is to elimination, which adds to the tension and
            deception of the game.
          </p>
        </section>
      </div>
    </div>
  );
};

export default RolesPage;
