import React from 'react'

const backgroundImage = {
  backgroundImage: "url('/HomePageBackground.png')",
  backgroundSize: 'cover',
  backgroundRepeat: 'no-repeat',
  height: "100vh",
  width: "100vw",
};

const HomePage = () => {
  return (
    <div style={backgroundImage}>
      {/* Header */}
      <div className='w-[100vw] h-40 bg-transparent border-b-white border-2 top-0 flex items-center justify-between p-5'>
        <div className='flex gap-10'>
          <button className='w-40 h-20 border-white border-2 rounded-full bg-transparent flex justify-center items-center gap-3 transition-all duration-500 ease-in-out hover:bg-white hover:scale-95 group'>
            <p className='font-bold text-2xl text-white transition-all duration-500 ease-in-out group-hover:text-black group-hover:translate-x-2'>Menu</p>
            <img src="/images/menu.png" alt="menuIcon" className='w-5 h-5 transition-all duration-500 ease-in-out group-hover:opacity-0 group-hover:scale-0'/>
          </button>
          <button className='w-80 h-20 border-white border-2 rounded-full bg-transparent cursor-pointer flex justify-center items-center gap-3'>
            <img src="/images/CollabOrCancelLogo.png" alt="logo" className='w-15 h-15'/>
            <p className='font-bold text-2xl text-white'>Collab or Cancel</p>
          </button>
        </div>

        <div className='flex gap-20 text-white text-2xl font-bold pr-10'>
          {["Home", "Gameplay", "Roles", "About us", "Setting"].map((item) => (
            <button
              key={item}
              className="cursor-pointer transition-all duration-500 relative 
              after:content-[''] after:absolute after:left-0 after:bottom-0 
              after:h-[3px] after:w-0 after:bg-white after:transition-all after:duration-500 
              hover:after:w-full hover:scale-110"
            >
              {item}
            </button>
          ))}
          <button className='w-40 h-20 rounded-full bg-red-400 items-center justify-center cursor-pointer duration-500 hover:bg-red-500 hover:scale-95 transition-all'>Sign Up</button>          
        </div>
      </div>

      {/* Body */}
      <div className='absolute left-10 top-80'>
        <p className='text-8xl font-bold text-white leading-tight'>
          TRUST IS A<br />
          WEAPON.<br />
          BETRAYAL IS ART.
        </p>
        <div className='flex gap-10 mt-10'>
          <button className='w-60 h-24 rounded-full bg-white items-center justify-center cursor-pointer duration-500 hover:bg-red-500 hover:scale-95 transition-all text-black text-2xl font-bold'>PLAY NOW</button>
          <button className='w-60 h-24 rounded-full bg-red-400 items-center justify-center cursor-pointer duration-500 hover:bg-red-500 hover:scale-95 transition-all text-white text-2xl font-bold'>Sign Up</button>
        </div>
      </div>
    </div>
  )
}

export default HomePage