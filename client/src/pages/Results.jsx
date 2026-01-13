import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import BackgroundImage from '/images/resultsBackground.png'

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get data passed from GameplayPage
  const { winners = [], allPlayers = [], totalRounds = 0, gameId } = location.state || {};

  // Determine if doomers or vibers won
  const winnerRole = winners[0]?.role || 'unknown';
  const isDoomersWin = winnerRole === 'doomer';
  const isVibersWin = winnerRole === 'viber';

  // Get all doomers from all players
  const allDoomers = allPlayers.filter(p => p.role === 'doomer');
  
  // Count remaining alive players
  const alivePlayers = allPlayers.filter(p => p.alive);
  const vibersRemained = alivePlayers.filter(p => p.role === 'viber').length;
  const doomersRemained = alivePlayers.filter(p => p.role === 'doomer').length;

  const winnerPositions = () => {
    if(winners.length === 1) {
      return [{top: "50%", left: "50%"}];
    } else if (winners.length === 2) {
      return [
        {top: "50%", left: "40%"},
        {top: "50%", left: "60%"},
      ];
    } else {
      return [
        {top: "50%", left: "40%"},
        {top: "50%", left: "50%"},
        {top: "50%", left: "60%"},
      ];
    }
  }

  const backgroundStyle = {
    backgroundImage: `url(${BackgroundImage})`,
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    width: "100vw",
    height: "100vh",
    position: "relative",
  };

  const handlePlayAgain = () => {
    // Navigate back to matchmaking
    navigate('/matchmaking', { 
      state: { 
        createNew: true 
      } 
    });
  };

  const handleReturnToLobby = () => {
    // Navigate to home/main menu
    navigate('/');
  };

  return (
    <div style={backgroundStyle}>
      <div className='pt-5 my-auto flex flex-col items-center'>
        <p className='text-white text-6xl font-bold'>RESULTS</p>
        <p className={`text-5xl font-bold mt-10 ${isDoomersWin ? 'text-red-600' : isVibersWin ? 'text-green-600' : 'text-white'}`}>
          {isDoomersWin ? 'DOOMERS WIN!' : isVibersWin ? 'VIBERS WIN!' : 'GAME OVER'}
        </p>
      </div>
      
      {/* Winner characters display */}
      {winnerPositions().map((pos, i) => {
        if(!winners[i]) return null;
        let imageSrc = `/images/charactersFront/${winners[i].color}.png`;
        return (
          <img 
            key={i}
            src={imageSrc} 
            alt={winners[i].color}
            style={{
              position: "absolute",
              width: "180px",
              ...pos,
              zIndex: "1",
              transform: "translate(-50%, -50%)",
            }}
          />
        )
      })}
      
      {/* Left panel - Winners info */}
      <div className='absolute top-20 left-5 flex flex-col items-center justify-center'>
        <p className='text-4xl text-white font-bold'>Winners Stats</p>
        <div className="mt-5 bg-transparent border border-white border-2 p-5 rounded-3xl flex flex-col gap-0">
          {winners.slice(0, 4).map((winner) => {
            const player = allPlayers.find(p => p.color === winner.color) || winner;
            return (
              <div 
                key={winner.color}
                className="p-2 flex gap-5"
              >
                <img 
                  src={`/images/charactersFront/${winner.color}.png`} 
                  alt={winner.color} 
                  className="w-15" 
                />
                <div>
                  <p className="text-white text-3xl">
                    Color: <span className="font-bold capitalize">{winner.color}</span>
                  </p>
                  <p className="text-white text-3xl">
                    Role: <span className="font-bold capitalize">{winner.role}</span>
                  </p>
                  <p className="text-white text-2xl">
                    Aura: <span className="font-bold">{player.aura?.toFixed(1) || 0}</span>
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Right panel - Doomers revealed & Statistics */}
      <div className='absolute top-20 right-5 flex flex-col items-center justify-center'>
        {/* Doomers info */}
        <p className='text-3xl text-white font-bold'>Doomers Revealed</p>
        <div className="mt-5 bg-white/10 p-5 rounded-3xl flex flex-col gap-0">
          {allDoomers.slice(0, 3).map((doomer) => {
            return (
              <div 
                key={doomer.color}
                className="p-2 flex gap-5"
              >
                <img 
                  src={`/images/charactersFront/${doomer.color}.png`} 
                  alt={doomer.color} 
                  className="w-10" 
                />
                <div>
                  <p className="text-white text-xl">
                    Color: <span className="font-bold capitalize">{doomer.color}</span>
                  </p>
                  <p className="text-white text-xl">
                    Status: <span className="font-bold">{doomer.alive ? 'Alive' : 'Eliminated'}</span>
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Match stats */}
        <p className='text-3xl text-white font-bold mt-10'>Statistics</p>
        <div className="relative mt-5 p-5 rounded-3xl bg-transparent border-white border-2 flex flex-col justify-center items-center">
          <p className="text-2xl text-white mx-auto">
            Total Rounds: <span className="font-bold">{totalRounds}</span>
          </p>
          <p className="text-2xl text-white mx-auto">
            Vibers Remained: <span className="font-bold">{vibersRemained}</span>
          </p>
          <p className="text-2xl text-white mx-auto">
            Doomers Remained: <span className="font-bold">{doomersRemained}</span>
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className='absolute bottom-10 left-1/3 flex gap-10 mt-10'>
        <button 
          onClick={handlePlayAgain}
          className='w-80 h-24 rounded-full bg-white items-center justify-center cursor-pointer duration-500 hover:bg-gray-500 hover:scale-95 transition-all text-black text-2xl font-bold flex gap-2'
        >
          <img src="/images/again.png" alt="again" className='w-10 h-10' />
          PLAY AGAIN
        </button>
        <button 
          onClick={handleReturnToLobby}
          className='w-80 h-24 rounded-full bg-white items-center justify-center cursor-pointer duration-500 hover:bg-gray-500 hover:scale-95 transition-all text-black text-2xl font-bold flex gap-2'
        >
          <img src="/images/home.png" alt="home" className='w-10 h-10' />
          RETURN TO LOBBY
        </button>
      </div>
      
    </div>
  )
}

export default Results