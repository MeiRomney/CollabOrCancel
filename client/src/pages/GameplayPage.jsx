import React, { useState } from "react";
import BackgroundImage from "/images/gameplayBackground.png";

const GameplayPage = () => {

  const backgroundStyle = {
    backgroundImage: `url(${BackgroundImage})`,
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    width: "100vw",
    height: "100vh",
    position: "relative",
  };

  const characterPositions = [
    { top: "60%", left: "26%" },
    { top: "50%", left: "33%" },
    { top: "45%", left: "41%" },
    { top: "43%", left: "50%" },
    { top: "45%", left: "60%" },
    { top: "50%", left: "68%" },
    { top: "60%", left: "75%" },
  ];

  return (
    <div style={backgroundStyle}>

        {/* Table */}
        <img
            src="/images/table.png"
            alt="table"
            style={{
            position: "absolute",
            width: "850px",
            left: "50%",
            top: "70%",
            transform: "translate(-50%, -50%)",
            zIndex: 4,
            }}
        />

        {/* Player Character */}
        <img
            src={`/images/characterBack.png`}
            alt="player"
            style={{
            position: "absolute",
            width: "200px",
            left: "50%",
            top: "52%",
            transform: "translateX(-50%)",
            zIndex: 5
            }}
        />

        {/* Other Characters */}
        {characterPositions.map((pos, i) => {
            let imageSrc = "/images/characters/white.png"
            if(i === 3) {
                imageSrc = "images/characterFront.png"
            }
            return (
                <img
                    key={i}
                    src={imageSrc}
                    alt={`npc-${i}`}
                    style={{
                        position: "absolute",
                        width: `${i === 0 || i=== 6 ? "160px" : i === 1 || i === 5 ? "150px" : "140px"}`,
                        ...pos,
                        transform: `translate(-50%, -50%) ${i < 3 ? "scaleX(-1)" : ""}`,
                        zIndex: 1,
                    }}
                />
            )
        })}

    </div>
  );
};

export default GameplayPage;
