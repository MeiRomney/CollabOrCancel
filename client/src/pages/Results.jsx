import React from 'react'
import BackgroundImage from '/images/resultsBackground.png'

const Results = () => {
  const winners = ["red", "black", "green"];
  const doomers = ["red", "black"];

  const winnerPositions = () => {
    if(winners.length === 1) {
      return [{top: "50%", left: "50%"},];
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

  return (
    <div style={backgroundStyle}>
      <div className='pt-5 my-auto flex flex-col items-center'>
        <p className='text-white text-6xl font-bold'>RESULTS</p>
        <p className='text-green-600 text-5xl font-bold mt-10'>DOOMERS WIN!</p>
      </div>
      {winnerPositions().map((pos, i) => {
        let imageSrc = `/images/charactersFront/${winners[i]}.png`;
        return (
          <img 
            key={i}
            src={imageSrc} 
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
      
      {/* Left panel */}
      <div className='absolute top-20 left-5 flex flex-col items-center justify-center'>
        {/* Winners info */}
        <p className='text-4xl text-white font-bold'>Winners Stats</p>
        <div className="mt-5 bg-transparent border border-white border-2 p-5 rounded-3xl flex flex-col gap-0">
          {winners.map((character, index) => {
            if(index > 3) {
              return null;
            }
            return (
              <div 
                key={character}
                className="p-2 flex gap-5"
              >
                <img src={`/images/charactersFront/${character}.png`} alt="playerCharacter" className="w-15" />
                <div>
                  <p className="text-white text-3xl">Name: <span className="font-bold">Player name</span></p>
                  <p className="text-white text-3xl">Role: <span className="font-bold">Doomer</span></p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Right panel */}
      <div className='absolute top-20 right-5 flex flex-col items-center justify-center'>
        {/* Doomers info */}
        <p className='text-3xl text-white font-bold'>Doomers Revealed</p>
        <div className="mt-5 bg-white/10 p-5 rounded-3xl flex flex-col gap-0">
          {doomers.map((character, index) => {
            if(index > 2) {
              return null;
            }
            return (
              <div 
                key={character}
                className="p-2 flex gap-5"
              >
                <img src={`/images/charactersFront/${character}.png`} alt="playerCharacter" className="w-10" />
                <div>
                  <p className="text-white text-xl">Name: <span className="font-bold">Player name</span></p>
                  <p className="text-white text-xl">Role: <span className="font-bold">Doomer</span></p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Match stats */}
        <p className='text-3xl text-white font-bold mt-10'>Statistics</p>
        <div className="relative mt-5 p-5 rounded-3xl bg-transparent border-white border-2 flex flex-col justify-center items-center">
          <p className="text-2xl text-white mx-auto">Total Round: <span className="font-bold">4</span></p>
          <p className="text-2xl text-white mx-auto">Vibers remained: <span className="font-bold">1</span></p>
          <p className="text-2xl text-white mx-auto">Doomers remained: <span className="font-bold">2</span></p>
        </div>
      </div>

      {/* Buttons */}
      <div className='absolute bottom-10 left-1/3 flex gap-10 mt-10'>
        <button className='w-80 h-24 rounded-full bg-white items-center justify-center cursor-pointer duration-500 hover:bg-gray-500 hover:scale-95 transition-all text-black text-2xl font-bold flex gap-2'>
          <img src="/images/again.png" alt="again" className='w-10 h-10' />
          PLAY AGAIN
        </button>
        <button className='w-80 h-24 rounded-full bg-white items-center justify-center cursor-pointer duration-500 hover:bg-gray-500 hover:scale-95 transition-all text-black text-2xl font-bold flex gap-2'>
          <img src="/images/home.png" alt="again" className='w-10 h-10' />
          RETURN TO LOBBY
        </button>
      </div>
      
    </div>
  )
}

export default Results