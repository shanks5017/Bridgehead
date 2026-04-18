import React, { useState, useEffect, useRef } from 'react';
import { createChatSession } from '../services/groqService';
import { ChatIcon, XIcon, LoadingSpinner, MicrophoneIcon } from './icons';

const parseInline = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return part;
    });
};

const renderModelMessage = (text: string) => {
    const lines = text.split('\n');
    const elements: React.JSX.Element[] = [];
    let listType: 'ul' | 'ol' | null = null;
    let listItems: React.JSX.Element[] = [];

    const closeList = () => {
        if (listItems.length > 0) {
            if (listType === 'ul') {
                elements.push(<ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 pl-4">{listItems}</ul>);
            } else if (listType === 'ol') {
                elements.push(<ol key={`list-${elements.length}`} className="list-decimal list-inside space-y-1">{listItems}</ol>);
            }
            listItems = [];
            listType = null;
        }
    };

    lines.forEach((line, index) => {
        const isUl = line.match(/^\s*[\-\*] /);
        const isOl = line.match(/^\s*\d+\. /);

        if (isUl) {
            if (listType !== 'ul') closeList();
            listType = 'ul';
            const content = line.replace(/^\s*[\-\*] /, '');
            listItems.push(<li key={`${index}-${listItems.length}`}>{parseInline(content)}</li>);
        } else if (isOl) {
            if (listType !== 'ol') closeList();
            listType = 'ol';
            const content = line.replace(/^\s*\d+\. /, '');
            listItems.push(<li key={`${index}-${listItems.length}`}>{parseInline(content)}</li>);
        } else {
            closeList();
            if (line.trim()) {
                elements.push(<p key={index}>{parseInline(line)}</p>);
            }
        }
    });

    closeList();
    return <div className="space-y-2">{elements}</div>;
};

interface ChatbotProps {
    isChatbotOpen?: boolean;
    onChatbotToggle?: (isOpen: boolean) => void;
    userName?: string;
    userId?: string;
}

const Chatbot: React.FC<ChatbotProps> = ({ isChatbotOpen: externalIsOpen, onChatbotToggle, userName = 'Friend', userId = 'anonymous' }) => {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

    const chatRef = useRef<ReturnType<typeof createChatSession> | null>(null);
    const [history, setHistory] = useState<{ role: 'user' | 'model', text: string }[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const initialMessage = `Hey ${userName}! 🚀 I'm ARU, your entrepreneur friend here at ZONEK. What big ideas are we working on today?`;
        chatRef.current = createChatSession('default', userId, userName);
        setHistory([{ role: 'model', text: initialMessage }]);
    }, [userName, userId]);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
        };
        recognitionRef.current = recognition;
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, isLoading]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !chatRef.current || isLoading) return;
        const userMessage = input;
        setInput('');
        setHistory(prev => [...prev, { role: 'user', text: userMessage }]);
        setIsLoading(true);
        try {
            const response = await chatRef.current.sendMessage(userMessage);
            setHistory(prev => [...prev, { role: 'model', text: response }]);
        } catch (error) {
            setHistory(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVoiceInputClick = () => {
        if (!recognitionRef.current) return;
        if (isListening) recognitionRef.current.stop();
        else { setInput(''); recognitionRef.current.start(); }
    };

    const toggleChat = () => {
        const newState = !isOpen;
        if (onChatbotToggle) onChatbotToggle(newState);
        else setInternalIsOpen(newState);
    };

    return (
        <>
            <div className="fixed bottom-6 right-6 z-50">
                <button
                    onClick={toggleChat}
                    className={`
                        w-14 h-14 flex items-center justify-center 
                        transition-all duration-200 shadow-premium-green
                        ${isOpen ? 'bg-[#141414] border-2 border-[#22C55E]' : 'bg-[#141414] border-2 border-[#22C55E]/30'}
                        rounded-none glass-morphic
                        hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[4px_4px_0px_#22C55E]
                    `}
                    aria-label={isOpen ? 'Close Chat' : 'Open Chat'}
                >
                    {isOpen ? (
                        <XIcon className="w-8 h-8 text-[#22C55E]" />
                    ) : (
                        <div className="flex items-center gap-1.5 px-3">
                            <span className="w-1.5 h-6 bg-[#22C55E] rounded-none animate-pulse [animation-delay:0s]" />
                            <span className="w-1.5 h-10 bg-[#22C55E] rounded-none animate-pulse [animation-delay:0.2s]" />
                            <span className="w-1.5 h-6 bg-[#22C55E] rounded-none animate-pulse [animation-delay:0.4s]" />
                        </div>
                    )}
                </button>
            </div>

            {isOpen && (
                <div className="fixed bottom-28 right-6 w-96 max-w-[calc(100vw-3rem)] max-h-[calc(100vh-14rem)] bg-[#141414] border border-[#22C55E]/20 rounded-none shadow-premium-green flex flex-col z-50 overflow-hidden animate-spring">
                    <header className="p-6 border-b border-[#22C55E]/20 flex items-center justify-between bg-[#141414]/80 backdrop-blur-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-none bg-[#22C55E]" />
                            <h3 className="text-sm font-black uppercase tracking-widest text-[#22C55E]">Aru Intelligence</h3>
                        </div>
                        <button onClick={toggleChat} className="opacity-60 hover:opacity-100 transition-opacity"><XIcon className="w-5 h-5 text-white" /></button>
                    </header>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-[#141414]">
                        {history.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] px-5 py-3 rounded-none text-sm font-medium leading-relaxed ${msg.role === 'user' ? 'bg-[#22C55E] text-ink' : 'bg-foundation/10 border border-foundation/20 text-[#E4E3E0]'}`}>
                                    {msg.role === 'user' ? msg.text : renderModelMessage(msg.text)}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="px-5 py-3 rounded-none bg-foundation/5 border border-foundation/20 flex items-center gap-3">
                                    <div className="flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-[#22C55E] rounded-none animate-bounce" />
                                        <span className="w-1.5 h-1.5 bg-[#22C55E] rounded-none animate-bounce [animation-delay:0.2s]" />
                                        <span className="w-1.5 h-1.5 bg-[#22C55E] rounded-none animate-bounce [animation-delay:0.4s]" />
                                    </div>
                                    <span className="text-[10px] uppercase font-bold tracking-tighter opacity-40 italic">Processing...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSend} className="p-6 border-t border-[#22C55E]/20 bg-[#141414]/80 backdrop-blur-xl">
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={isListening ? "Listening..." : "TRANSMIT COMMAND..."}
                                className="w-full bg-foundation/5 border-2 border-foundation/10 rounded-none pl-5 pr-24 py-4 text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-[#22C55E]/50 transition-all text-white"
                                disabled={isLoading}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-3">
                                {recognitionRef.current && (
                                    <button type="button" onClick={handleVoiceInputClick} className="opacity-80 hover:opacity-100 transition-opacity">
                                        <MicrophoneIcon className={`w-5 h-5 ${isListening ? 'text-[#22C55E] scale-125' : 'text-white'}`} />
                                    </button>
                                )}
                                <button type="submit" disabled={isLoading || !input.trim()} className="px-4 py-2 bg-[#22C55E] rounded-none text-ink font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-20">
                                    SEND
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
};

export default Chatbot;