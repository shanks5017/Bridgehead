import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { ChatIcon, XIcon, LoadingSpinner, MicrophoneIcon } from './icons';

// Parses inline markdown elements like **bold**.
const parseInline = (text: string): React.ReactNode => {
    // This regex splits the string by bold tags, keeping the tags for processing
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return part;
    });
};

// Renders the model's text response, parsing basic markdown for lists and bold text.
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

    closeList(); // Close any remaining list
    // Wrap elements in a div to control spacing between paragraphs and lists
    return <div className="space-y-2">{elements}</div>;
};


const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [chat, setChat] = useState<Chat | null>(null);
    const [history, setHistory] = useState<{ role: 'user' | 'model', text: string }[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null); // Using any for browser compatibility (webkitSpeechRecognition)
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!process.env.API_KEY) {
            console.error("API_KEY not found for chatbot.");
            return;
        }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const initialMessage = 'Hello! How can I help you with Bridgehead today?';
        const systemInstruction = "You are a helpful AI assistant for the Bridgehead app. Bridgehead connects community needs (demands) with entrepreneurs. Users can post demands for businesses they want, and entrepreneurs can find rental properties and get business ideas. Keep your answers concise and helpful. When providing instructions or steps, always use a numbered or bulleted list. Do not write steps in a single paragraph.";

        const chatInstance = ai.chats.create({
            model: 'gemini-flash-lite-latest',
            history: [{
                role: 'model',
                parts: [{ text: initialMessage }],
            }],
            config: {
                systemInstruction: systemInstruction,
            },
        });
        setChat(chatInstance);
        setHistory([{ role: 'model', text: initialMessage }]);
    }, []);
    
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech recognition not supported in this browser.");
            return;
        }
    
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
    
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event: any) => {
            console.error("Speech recognition error:", event.error);
            setIsListening(false);
        };
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
        if (!input.trim() || !chat || isLoading) return;

        const userMessage = input;
        setInput('');
        setHistory(prev => [...prev, { role: 'user', text: userMessage }]);
        setIsLoading(true);

        try {
            const result = await chat.sendMessageStream({ message: userMessage });
            
            let modelResponse = '';
            setHistory(prev => [...prev, { role: 'model', text: '' }]); // Add empty model message for streaming

            for await (const chunk of result) {
                modelResponse += chunk.text;
                setHistory(prev => {
                    const newHistory = [...prev];
                    newHistory[newHistory.length - 1].text = modelResponse;
                    return newHistory;
                });
            }
        } catch (error) {
            console.error("Chatbot error:", error);
            setHistory(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleVoiceInputClick = () => {
        if (!recognitionRef.current) return;
    
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            // Clear input before starting a new recording
            setInput('');
            recognitionRef.current.start();
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 w-16 h-16 bg-[--primary-color] rounded-full text-white shadow-lg flex items-center justify-center z-50 transition-transform hover:scale-110"
                aria-label={isOpen ? 'Close Chat' : 'Open Chat'}
            >
                {isOpen ? <XIcon className="w-8 h-8" /> : <ChatIcon className="w-8 h-8" />}
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] max-h-[calc(100vh-11rem)] bg-[--card-color] border border-[--border-color] rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden">
                    <header className="p-4 border-b border-[--border-color] flex items-center justify-between">
                        <h3 className="text-lg font-bold">AI Assistant</h3>
                        <button onClick={() => setIsOpen(false)}><XIcon className="w-5 h-5 text-[--text-secondary] hover:text-white" /></button>
                    </header>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {history.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] px-4 py-2 rounded-xl break-words ${msg.role === 'user' ? 'bg-[--primary-color] text-white' : 'bg-white/10'}`}>
                                    {msg.role === 'user' ? msg.text : renderModelMessage(msg.text)}
                                </div>
                            </div>
                        ))}
                         {isLoading && (
                            <div className="flex justify-start">
                                <div className="max-w-[80%] px-4 py-2 rounded-xl bg-white/10 flex items-center gap-2">
                                    <LoadingSpinner className="w-4 h-4" /> Thinking...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSend} className="p-4 border-t border-[--border-color]">
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={isListening ? "Listening..." : "Ask a question..."}
                                className="w-full bg-transparent border-2 border-[--border-color] rounded-lg pl-4 pr-20 py-3 placeholder-[--text-secondary] focus:outline-none focus:ring-1 focus:ring-[--primary-color]"
                                disabled={isLoading}
                            />
                             <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                                {recognitionRef.current && (
                                    <button type="button" onClick={handleVoiceInputClick} className="text-[--text-secondary] hover:text-white disabled:opacity-50" disabled={isLoading} aria-label={isListening ? 'Stop listening' : 'Start listening'}>
                                        <MicrophoneIcon className={`w-6 h-6 transition-colors ${isListening ? 'text-[--primary-color]' : ''}`} />
                                    </button>
                                )}
                                <button type="submit" className="text-[--primary-color] disabled:opacity-50" disabled={isLoading || !input.trim()} aria-label="Send message">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                    </svg>
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