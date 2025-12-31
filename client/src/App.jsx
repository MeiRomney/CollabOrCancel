import React from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import GameplayPage from './pages/GameplayPage'
import Results from './pages/Results'
import LobbyPage from './pages/LobbyPage'

const App = () => {
  return (
    <div>
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/lobby' element={<LobbyPage />}/>
        <Route path='/gameplay' element={<GameplayPage />} />
        <Route path='/results' element={<Results />} />
      </Routes>
    </div>
  )
}

export default App