import { X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react'

const Note = ({ playerColor, onClose }) => {
    const [note, setNote] = useState("");
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [size, setSize] = useState({ width: 600, height: 600 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const chatRef = useRef(null);
    const messagesEndRef = useRef(null);

    const STORAGE_KEY = "game_notes";

    const loadNote = () => {
        const data = JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || {};
        return data[playerColor] || "";
    }

    const saveNote = (value) => {
        let data = JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || {};
        data[playerColor] = value;
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    useEffect(() => {
        setNote(loadNote());
    }, [playerColor]);

    useEffect(() => {
        saveNote(note);
    }, [note])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        scrollToBottom();
    }, [note]);

    const handleMouseDown = (e) => {
        if(e.target.closest('.chat-header')) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - position.x,
                y: e.clientY - position.y
            });
        }
    };

    const handleResizeMouseDown = (e) => {
        e.stopPropagation();
        setIsResizing(true);
        setResizeStart({
            x: e.clientX,
            y: e.clientY,
            width: size.width,
            height: size.height
        });
    };

    const handleMouseMove = (e) => {
        if(isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        } else if(isResizing) {
            const deltaX = e.clientX - resizeStart.x;
            const deltaY = e.clientY - resizeStart.y;

            setSize({
                width: Math.max(300, resizeStart.width + deltaX),
                height: Math.max(250, resizeStart.height + deltaY),
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setIsResizing(false);
    };

    useEffect(() => {
        if(isDragging || isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, isResizing, dragStart, resizeStart]);

  return (
    <div 
        ref={chatRef}
        className='fixed w-96 h-96 bg-black/60 backdrop-blur-md rounded-2xl border border-white p-3 flex flex-col overflow-hidden shadow-xl z-50'
        style={{
            left: '50%',
            top: '35%',
            width: `${size.width}px`,
            height: `${size.height}px`,
            transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
            userSelect: isDragging || isResizing ? 'none' : 'auto'
        }}
        onMouseDown={handleMouseDown}
    >
        {/* Header */}
        <div className='chat-header cursor-move text-white text-xl font-bold p-2 bg-white/10 rounded-xl mb-2 flex justify-between'>
            <p>Notes</p>
            <button 
                className='cursor-pointer bg-transparent hover:bg-white/20 transition-all duration-500 rounded-md'
                onClick={onClose}
            >
                <X className='w-8 h-8'/>
            </button>
        </div>

        {/* Text area */}
        <textarea 
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={`Note for Player ${playerColor}`}
            className='scrollbar-custom overflow-y-auto flex-1 bg-transparent text-white resize-none outline-none p-3 rounded-xl border border-white/20 placeholder-white/40'
            style={{
                scrollbarWidth: "thin",
                scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent',
            }}
        />

        {/* Resize handle */}
        <div
            className='absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize'
            onMouseDown={handleResizeMouseDown}
            style={{
                background: 'linear-gradient(135deg, transparent 50%, rgba(255, 255, 255, 0.3) 50%)',
                borderBottomRightRadius: '1rem',
            }}
        />
    </div>
  )
}

export default Note