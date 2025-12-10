import React, { useState, useRef, useEffect } from 'react';
import { Conversation } from '../types';
import { UserCircleIcon, PaperAirplaneIcon, SparklesIcon } from './icons';
import { EmptyState } from './LandingPages';

// Utility to format timestamp
const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

// --- START: Markdown Rendering Logic (from Chatbot.tsx) ---
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
// --- END: Markdown Rendering Logic ---

const ParticipantAvatar: React.FC<{ participantId: string; className: string }> = ({ participantId, className }) => {
    const isAru = participantId === 'aru-bot';

    if (isAru) {
        let iconSize = 'w-6 h-6';
        if (className.includes('w-10')) iconSize = 'w-5 h-5';
        if (className.includes('w-8')) iconSize = 'w-4 h-4';
        
        return (
            <div className={`${className} flex-shrink-0 rounded-full bg-gradient-to-br from-[--primary-color] to-yellow-500 flex items-center justify-center`}>
                <SparklesIcon className={`${iconSize} text-white`} />
            </div>
        );
    }
    return <UserCircleIcon className={`${className} flex-shrink-0 text-[--text-secondary]`} />;
};

// Component for a single conversation in the sidebar list
const ConversationListItem: React.FC<{
    conversation: Conversation;
    isSelected: boolean;
    onClick: () => void;
}> = ({ conversation, isSelected, onClick }) => {
    const isAru = conversation.participant.id === 'aru-bot';
    return (
        <button
            onClick={onClick}
            className={`w-full text-left p-3 rounded-lg flex items-start space-x-3 transition-colors ${
                isSelected ? 'bg-[--primary-color]' : 'hover:bg-white/10'
            }`}
        >
            <ParticipantAvatar participantId={conversation.participant.id} className="w-12 h-12" />
            <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-baseline">
                    <p className={`font-bold truncate flex items-center gap-1.5 ${isSelected ? 'text-white' : 'text-[--text-primary]'}`}>
                        {conversation.participant.name}
                        {isAru && <SparklesIcon className="w-4 h-4 text-yellow-400 flex-shrink-0" />}
                    </p>
                    <p className={`text-xs flex-shrink-0 ${isSelected ? 'text-white/80' : 'text-[--text-secondary]'}`}>{formatTimestamp(conversation.lastMessageTimestamp)}</p>
                </div>
                <p className={`text-sm truncate ${isSelected ? 'text-white/90' : 'text-[--text-secondary]'}`}>{conversation.participant.postTitle}</p>
                <p className={`text-sm truncate ${isSelected ? 'text-white/80' : 'text-[--text-secondary]'}`}>{conversation.messages[conversation.messages.length - 1]?.text}</p>
            </div>
        </button>
    );
};

// Main Chat Component
interface CollaborationProps {
  conversations: Conversation[];
  onSendMessage: (conversationId: string, text: string) => void;
  selectedConversationId: string | null;
  setSelectedConversationId: (id: string | null) => void;
}

const Collaboration: React.FC<CollaborationProps> = ({ conversations, onSendMessage, selectedConversationId, setSelectedConversationId }) => {
    const [message, setMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const selectedConversation = conversations.find(c => c.id === selectedConversationId);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedConversation?.messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() && selectedConversationId) {
            onSendMessage(selectedConversationId, message);
            setMessage('');
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)]">
            {/* Conversation List Sidebar */}
            <aside className="w-96 bg-[--card-color] border-r border-[--border-color] flex flex-col">
                <div className="p-4 border-b border-[--border-color]">
                    <h2 className="text-xl font-bold">All Conversations</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {conversations.map(convo => (
                        <ConversationListItem 
                            key={convo.id}
                            conversation={convo}
                            isSelected={convo.id === selectedConversationId}
                            onClick={() => setSelectedConversationId(convo.id)}
                        />
                    ))}
                </div>
            </aside>

            {/* Main Chat Window */}
            <main className="flex-1 flex flex-col bg-[--bg-color]">
                {selectedConversation ? (
                    <>
                        <header className="p-4 border-b border-[--border-color] flex items-center space-x-3">
                            <ParticipantAvatar participantId={selectedConversation.participant.id} className="w-10 h-10" />
                            <div>
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    {selectedConversation.participant.name}
                                    {selectedConversation.participant.id === 'aru-bot' && <SparklesIcon className="w-4 h-4 text-yellow-400" />}
                                </h3>
                                <p className="text-sm text-[--text-secondary]">
                                    {selectedConversation.participant.id === 'aru-bot'
                                        ? 'Online'
                                        : `Regarding: ${selectedConversation.participant.postTitle}`
                                    }
                                </p>
                            </div>
                        </header>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {selectedConversation.messages.map(msg => (
                                <div key={msg.id} className={`flex items-end gap-2 ${msg.senderId === 'currentUser' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.senderId !== 'currentUser' && <ParticipantAvatar participantId={selectedConversation.participant.id} className="w-8 h-8" />}
                                    <div className={`max-w-xl px-4 py-2 rounded-xl break-words ${msg.senderId === 'currentUser' ? 'bg-[--primary-color] text-white' : 'bg-white/10'}`}>
                                        {msg.text === '...' ? (
                                            <div className="flex items-center gap-2 px-2">
                                                <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                                                <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                                <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                                            </div>
                                        ) : msg.senderId === 'aru-bot' ? (
                                            renderModelMessage(msg.text)
                                        ) : (
                                            <p>{msg.text}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <footer className="p-4 border-t border-[--border-color]">
                            <form onSubmit={handleSend} className="relative">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="w-full bg-white/5 border-2 border-transparent rounded-lg pl-4 pr-12 py-3 placeholder-[--text-secondary] focus:outline-none focus:ring-1 focus:ring-[--primary-color] focus:border-[--primary-color]"
                                />
                                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-[--primary-color] disabled:opacity-50" disabled={!message.trim()}>
                                    <PaperAirplaneIcon className="w-6 h-6"/>
                                </button>
                            </form>
                        </footer>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <EmptyState title="Select a Conversation" message="Choose a conversation from the left to start chatting." />
                    </div>
                )}
            </main>
        </div>
    );
};

export default Collaboration;