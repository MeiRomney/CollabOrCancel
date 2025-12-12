import React, { useEffect, useRef, useState } from 'react'

const CollabVote = ({ playerColor, onClose}) => {
  const [messages, setMessages] = useState([
        { id: 1, sender: "blue", text: "Hello everyone!", isNew: false },
        { id: 2, sender: playerColor, text: "Ready for the round.", isNew: false },
    ]);
    const [input, setInput] = useState("");
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [size, setSize] = useState({ width: 600, height: 600 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const chatRef = useRef(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if(!input.trim()) return;
        setMessages(prev => [...prev, { id: Date.now(), sender: playerColor, text: input, isNew: true }]);
        setInput("");
    };

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
            <p>Direct Message</p>
            <button 
                className='cursor-pointer bg-transparent hover:bg-white/20 transition-all duration-500 rounded-md'
                onClick={onClose}
            >
                <X className='w-8 h-8'/>
            </button>
        </div>

        {/* Messages */}
        <div 
            className='scrollbar-custom flex-1 overflow-y-auto flex flex-col gap-3 p-2'
            style={{
                scrollbarWidth: "thin",
                scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent',
            }}
        >
            {messages.map((m) => (
                <div
                    key={m.id}
                    className={`max-w-[80%] flex items-start gap-2
                            ${m.sender === playerColor ? "self-end flex-row-reverse" : "self-start"}
                            ${m.isNew ? "animate-popIn" : ""}
                        `}
                    onAnimationEnd={() => {
                        if (m.isNew) {
                            setMessages(prev =>
                                prev.map(msg =>
                                    msg.id === m.id ? { ...msg, isNew: false } : msg
                                )
                            );
                        }
                    }}
                >
                    <img
                        src={`/images/charactersHead/${m.sender}.png`} 
                        alt={`${m.sender} profiles`}
                        className='w-8 h-8 rounded-full' 
                    />

                    <div className={`px-3 py-2 rounded-xl text-white
                        ${m.sender === playerColor
                            ? "bg-gradient-to-r from-gray-800 to-gray-600"
                            : "bg-white/20"
                        }`}
                    >
                        <p className='text-xs opacity-70 mb-1'>{m.sender}</p>
                        <p>{m.text}</p>
                    </div>
                    
                </div>
            ))}
            <div ref={messagesEndRef}/>
        </div>

        {/* Input */}
        <div className='flex gap-2 mt-2'>
            <input
                className='flex-1 bg-white/10 text-white p-2 rounded-xl outline-none placeholder-white/50'
                placeholder='Type a message...'
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button
                className='px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-xl text-white transition-colors'
                onClick={handleSend}
            >
                Send
            </button>
        </div>

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

export default CollabVote