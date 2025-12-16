import React from 'react'
import BackgroundImage from '/images/resultsBackground.png'

const backgroundStyle = {
    backgroundImage: `url(${BackgroundImage})`,
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    width: "100vw",
    height: "100vh",
    position: "relative",
  };

const Results = () => {
  return (
    <div style={backgroundStyle}>
        
    </div>
  )
}

export default Results