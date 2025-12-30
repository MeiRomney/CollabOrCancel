import React from 'react';
import { motion } from 'framer-motion';

const EventDisplay = ({ event }) => {
    if(!event) return null;

  return (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className='absolute top-32 left-1/2 -translate-x-1/2 z-40'
    >
        <div className='bg-grandient-to-r from-purple-600/90 to-pink-600/90 backdrop-blur-md border-2 border-white rounded-2xl px-6 py-4 max-w-md'>
            <div className='text-center'>
                <div className='text-yellow-300 text-xs uppercase tracking-wider mb-1'>
                    ⚡ Active Event ⚡
                </div>
                <div className='text-white/90 text-sm'>
                    {event.description}
                </div>
            </div>
        </div>
    </motion.div>
  );
};

export default EventDisplay;