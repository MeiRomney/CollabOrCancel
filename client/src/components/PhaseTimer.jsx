import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const PhaseTimer = ({ endTime, phase, round }) => {
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            const remaining = Math.max(0, endTime - Date.now());
            setTimeLeft(Math.floor(remaining / 1000));

            if(remaining <= 0) {
                clearInterval(interval);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [endTime]);

    const getColor = () => {
        if(timeLeft <= 10) return 'text-red-400';
        if(timeLeft <= 30) return 'text-yellow-400';
        return 'text-green-400';
    };

  return (
    <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className='absolute top-8 left-1/2 -translate-x-1/2 z-50'
    >
        <div className='bg-black/80 backdrop-blur-md border-2 border-white rounded-2xl px-8 py-4'>
            <div className='text-center'>
                <div className='text-white text-sm uppercase tracking-wider mb-1'>
                    Round {round} - {phase}
                </div>
                <div className={`text-4xl font-bold ${getColor()}`}>
                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </div>
            </div>
        </div>
    </motion.div>
  );
};

export default PhaseTimer;