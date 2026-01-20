import React, { useState, useRef, useEffect } from 'react';
import { Conversation, MediaItem } from '../types';
import {
    UserCircleIcon, PaperAirplaneIcon, SparklesIcon,
    SearchIcon, VerifiedIcon, PlusIcon, LinkIcon,
    BuildingOfficeIcon, ImageIcon, VideoCameraIcon, XIcon, ArrowLeftIcon
} from './icons';
import { EmptyState } from './LandingPages';

// --- Utility: Format Timestamp ---
const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

// --- START: Markdown Logic (Kept as is) ---
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
// --- END: Markdown Logic ---

// --- Component: Participant Avatar ---
const ParticipantAvatar: React.FC<{ participantId: string; className: string }> = ({ participantId, className }) => {
    const isAru = participantId === 'aru-bot';

    if (isAru) {
        let iconSize = 'w-6 h-6';
        if (className.includes('w-10')) iconSize = 'w-5 h-5';
        if (className.includes('w-8')) iconSize = 'w-4 h-4';

        return (
            <div className={`${className} flex-shrink-0 rounded-full bg-gradient-to-br from-[#FF3B30] to-orange-600 flex items-center justify-center animate-pulse duration-[3000ms]`}>
                <SparklesIcon className={`${iconSize} text-white`} />
            </div>
        );
    }
    return <UserCircleIcon className={`${className} flex-shrink-0 text-[#888888]`} />;
};

// --- Component: Deal Flow List Item ---
const ConversationListItem: React.FC<{
    conversation: Conversation;
    isSelected: boolean;
    onClick: () => void;
    index: number;
}> = ({ conversation, isSelected, onClick, index }) => {
    const isAru = conversation.participant.id === 'aru-bot';
    const isRead = true; // Mock read status for now

    // Staggered Animation Delay
    const animationDelay = `${index * 50}ms`;

    return (
        <button
            onClick={onClick}
            style={{ animationDelay }}
            className={`w-full text-left p-4 relative group transition-all duration-300 transform hover:scale-[1.02] border-l-2
                ${isSelected
                    ? 'bg-gradient-to-r from-[#FF3B30]/10 to-transparent border-[#FF3B30]'
                    : 'border-transparent hover:bg-white/5'
                } animate-in slide-in-from-left-4 fade-in fill-mode-backwards`}
        >
            <div className="flex items-start gap-3">
                <ParticipantAvatar participantId={conversation.participant.id} className="w-12 h-12" />

                <div className="flex-1 min-w-0">
                    {/* Header: Name + Badge */}
                    <div className="flex justify-between items-center mb-0.5">
                        <div className="flex items-center gap-2">
                            <span className={`font-bold text-sm truncate ${isSelected ? 'text-white' : 'text-[#E0E0E0]'}`}>
                                {conversation.participant.name}
                            </span>
                            {isAru ? (
                                <span className="text-[10px] uppercase tracking-wider text-yellow-500 border border-yellow-500/30 px-1.5 rounded bg-yellow-500/10">AI Agent</span>
                            ) : (
                                <span className="text-[10px] uppercase tracking-wider text-[#FF3B30] border border-[#FF3B30]/30 px-1.5 rounded bg-[#FF3B30]/10">Entrepreneur</span>
                            )}
                        </div>
                        {/* Read Status Icon */}
                        {isRead ? (
                            <div className="w-4 h-4 rounded-full border border-[#444] bg-[#222] flex items-center justify-center">
                                <span className="block w-2 h-1 border-l border-b border-[#666] -rotate-45 mb-0.5" />
                            </div>
                        ) : (
                            <div className="w-2 h-2 rounded-full bg-[#FF3B30] shadow-[0_0_8px_#FF3B30]" />
                        )}
                    </div>

                    {/* Subtitle: Listing Name */}
                    <p className="text-xs text-[#888888] font-medium truncate mb-1">
                        {isAru ? 'Bridgehead Assistant' : conversation.participant.postTitle}
                    </p>

                    {/* Last Message Preview */}
                    <div className="flex justify-between items-end">
                        <p className={`text-xs truncate max-w-[140px] ${isSelected ? 'text-white/70' : 'text-[#666]'}`}>
                            {conversation.messages[conversation.messages.length - 1]?.text}
                        </p>
                        <span className="text-[10px] text-[#444] group-hover:text-[#666] transition-colors">
                            {formatTimestamp(conversation.lastMessageTimestamp)}
                        </span>
                    </div>
                </div>
            </div>
        </button>
    );
};

// --- Main Component ---
interface CollaborationProps {
    conversations: Conversation[];
    onSendMessage: (conversationId: string, text: string, media?: MediaItem[]) => void;
    selectedConversationId: string | null;
    setSelectedConversationId: (id: string | null) => void;
}

const Collaboration: React.FC<CollaborationProps> = ({ conversations, onSendMessage, selectedConversationId, setSelectedConversationId }) => {
    const [message, setMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'opportunities'>('all');
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Media State
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [mediaOptionsOpen, setMediaOptionsOpen] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false); // Modal State
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    const selectedConversation = conversations.find(c => c.id === selectedConversationId);

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
                top: scrollContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [selectedConversation?.messages, selectedConversationId]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        Array.from(files).forEach((file: File) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const url = e.target?.result as string;
                const type = file.type.startsWith('image/') ? 'image' : 'video';
                if (type === 'image' || type === 'video') {
                    setMedia(prev => [...prev, { type, url }]);
                }
            };
            reader.readAsDataURL(file);
        });
        if (imageInputRef.current) imageInputRef.current.value = "";
        if (videoInputRef.current) videoInputRef.current.value = "";
        setMediaOptionsOpen(false);
    };

    const removeMedia = (index: number) => {
        setMedia(prev => prev.filter((_, i) => i !== index));
    };

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if ((message.trim() || media.length > 0) && selectedConversationId) {
            onSendMessage(selectedConversationId, message, media);
            setMessage('');
            setMedia([]);
        }
    };

    const filteredConversations = conversations.filter(c => {
        const matchesSearch = c.participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.participant.postTitle.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filter === 'all'
            ? c.role === 'owner' // My Demands
            : c.role === 'seeker'; // Opportunities

        return matchesSearch && matchesFilter;
    });

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-[#050505] text-white font-sans overflow-hidden">

            {/* --- 1. Sidebar: Active Deal Flow --- */}
            {/* Mobile: Hidden if chat open. Desktop: Always visible (w-96) */}
            <aside className={`border-r border-[#1A1A1A] flex flex-col bg-[#050505] z-10 w-full md:w-96 ${selectedConversationId ? 'hidden md:flex' : 'flex'}`}>

                {/* Header Section */}
                <div className="p-5 border-b border-[#1A1A1A]">
                    <h2 className="text-xs font-bold tracking-[0.2em] text-[#888] uppercase mb-4">Active Deal Flow</h2>

                    {/* Search Bar */}
                    <div className="relative mb-4">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444]" />
                        <input
                            type="text"
                            placeholder="Search deals, leads..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#121212] border border-[#222] rounded-lg py-2 pl-9 pr-3 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#FF3B30] transition-colors"
                        />
                    </div>

                    {/* Filter Toggles */}
                    <div className="flex p-0.5 bg-[#121212] rounded-lg border border-[#222]">
                        <button
                            onClick={() => setFilter('all')}
                            className={`flex-1 py-1.5 text-[11px] font-semibold uppercase tracking-wide rounded-md transition-all ${filter === 'all' ? 'bg-[#FF3B30] text-white shadow-lg' : 'text-[#666] hover:text-white'}`}
                        >
                            My Demands
                        </button>
                        <button
                            onClick={() => setFilter('opportunities')}
                            className={`flex-1 py-1.5 text-[11px] font-semibold uppercase tracking-wide rounded-md transition-all ${filter === 'opportunities' ? 'bg-[#FF3B30] text-white shadow-lg' : 'text-[#666] hover:text-white'}`}
                        >
                            Opportunities
                        </button>
                    </div>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-thin scrollbar-thumb-[#222] scrollbar-track-transparent">
                    {filteredConversations.map((convo, index) => (
                        <ConversationListItem
                            key={convo.id}
                            conversation={convo}
                            isSelected={convo.id === selectedConversationId}
                            onClick={() => setSelectedConversationId(convo.id)}
                            index={index}
                        />
                    ))}
                    {filteredConversations.length === 0 && (
                        <div className="p-8 text-center text-[#444]">
                            <p className="text-sm">No active deals found.</p>
                        </div>
                    )}
                </div>
            </aside>


            {/* --- 2. Main Chat: The Context Hub --- */}
            {/* Mobile: Hidden if no chat. Desktop: Always visible (flex-1) */}
            <main className={`flex-col relative bg-[#000000] w-full md:flex-1 ${!selectedConversationId ? 'hidden md:flex' : 'flex'}`}>
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <header className="h-20 shrink-0 border-b border-[#1A1A1A] bg-[#050505]/95 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 z-20">
                            <div className="flex items-center gap-4">
                                {/* Back Button (Mobile Only) */}
                                <button
                                    onClick={() => setSelectedConversationId(null)}
                                    className="md:hidden p-2 -ml-2 text-[#888] hover:text-white transition-colors"
                                >
                                    <ArrowLeftIcon className="w-5 h-5" />
                                </button>

                                <ParticipantAvatar participantId={selectedConversation.participant.id} className="w-10 h-10" />
                                <div>
                                    {/* Listing Title Prominently */}
                                    <h1 className="text-sm md:text-lg font-bold text-white leading-tight flex items-center gap-2 line-clamp-1">
                                        {selectedConversation.participant.id === 'aru-bot' ? 'BridgeHead Assistant' : selectedConversation.participant.postTitle}
                                        {selectedConversation.participant.id === 'aru-bot' && <SparklesIcon className="w-4 h-4 text-[#FF3B30]" />}
                                    </h1>
                                    {/* User Name + Verified Badge */}
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-xs text-[#888] font-medium tracking-wide">{selectedConversation.participant.name}</span>
                                        {selectedConversation.participant.id !== 'aru-bot' && (
                                            <div className="flex items-center gap-0.5 text-[#FF3B30]">
                                                <VerifiedIcon className="w-3 h-3" />
                                                <span className="text-[10px] font-bold uppercase hidden sm:inline">Verified Lead</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* View Deal Details Action */}
                            <button
                                onClick={() => setDetailsOpen(true)}
                                className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-full border border-[#333] hover:border-[#FF3B30] text-[#888] hover:text-[#FF3B30] transition-colors group bg-transparent whitespace-nowrap"
                            >
                                <span className="text-xs font-semibold uppercase tracking-wider hidden sm:inline">View Details</span>
                                <LinkIcon className="w-3.5 h-3.5" />
                            </button>
                        </header>

                        {/* --- Deal Details Modal / Slide-over --- */}
                        {detailsOpen && (
                            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
                                <div className="w-full md:w-96 bg-[#0A0A0A] border-l border-[#1A1A1A] h-full overflow-y-auto p-6 animate-in slide-in-from-right duration-300 shadow-2xl">
                                    {/* Modal Header */}
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-[#666]">Deal Intelligence</h3>
                                        <button
                                            onClick={() => setDetailsOpen(false)}
                                            className="p-2 -mr-2 text-[#888] hover:text-white hover:bg-white/10 rounded-full transition-all"
                                        >
                                            <XIcon className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Participant Profile */}
                                    <div className="flex flex-col items-center mb-8">
                                        <div className="relative mb-4">
                                            <ParticipantAvatar participantId={selectedConversation.participant.id} className="w-24 h-24 text-[#333]" />
                                            {selectedConversation.participant.id !== 'aru-bot' && (
                                                <div className="absolute bottom-0 right-0 bg-[#0A0A0A] p-1 rounded-full border border-[#1A1A1A]">
                                                    <VerifiedIcon className="w-6 h-6 text-[#FF3B30]" />
                                                </div>
                                            )}
                                        </div>
                                        <h2 className="text-xl font-bold text-white mb-1">{selectedConversation.participant.name}</h2>
                                        <p className="text-sm text-[#666]">
                                            {selectedConversation.participant.id === 'aru-bot' ? 'Bridgehead AI' : 'Verified Entrepreneur'}
                                        </p>
                                    </div>

                                    {/* Deal Context */}
                                    <div className="space-y-6">
                                        {/* Reference Post */}
                                        <div className="p-4 rounded-xl bg-[#121212] border border-[#222]">
                                            <p className="text-[10px] uppercase tracking-wide text-[#FF3B30] mb-2 font-bold">Subject of Negotiation</p>
                                            <h4 className="text-sm font-semibold text-[#E0E0E0] leading-snug mb-3">
                                                {selectedConversation.participant.id === 'aru-bot' ? 'Your Personal Assistant' : selectedConversation.participant.postTitle}
                                            </h4>
                                            {selectedConversation.participant.id !== 'aru-bot' && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-[#666] bg-[#1A1A1A] px-2 py-1 rounded border border-[#333]">Demand</span>
                                                    <span className="text-xs text-[#666] bg-[#1A1A1A] px-2 py-1 rounded border border-[#333]">Active</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Status Indicators */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 rounded-lg bg-[#121212] border border-[#222]">
                                                <p className="text-[10px] text-[#666] uppercase mb-1">Contract Status</p>
                                                <p className="text-xs font-bold text-white flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                                                    Drafting
                                                </p>
                                            </div>
                                            <div className="p-3 rounded-lg bg-[#121212] border border-[#222]">
                                                <p className="text-[10px] text-[#666] uppercase mb-1">Deal Value</p>
                                                <p className="text-xs font-bold text-white">Negotiating</p>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="space-y-2 pt-4">
                                            <button className="w-full py-3 rounded-lg bg-white text-black font-bold text-sm hover:bg-gray-200 transition-colors">
                                                View Original Post
                                            </button>
                                            <button className="w-full py-3 rounded-lg border border-[#333] text-[#E0E0E0] font-medium text-sm hover:border-[#FF3B30] hover:text-[#FF3B30] transition-colors">
                                                Generate Contract
                                            </button>
                                        </div>

                                        {/* Danger Zone */}
                                        <div className="pt-8 border-t border-[#1A1A1A]">
                                            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-red-900/30 bg-red-900/10 text-red-500 font-medium text-sm hover:bg-red-900/20 transition-colors">
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                                End Negotiation
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- 3. Message Area: The Professional Thread --- */}
                        {/* Added pb-32 to fix overlap with input bar */}
                        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 space-y-6 scrollbar-thin scrollbar-thumb-[#222]">
                            {selectedConversation.messages.map(msg => {
                                const isMe = msg.senderId === 'currentUser';
                                const isAru = msg.senderId === 'aru-bot';

                                return (
                                    <div key={msg.id} className={`flex flex-col gap-2 ${isMe ? 'items-end' : 'items-start'} group w-full`}>
                                        <div className={`flex items-end gap-3 max-w-[85%] md:max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                            {!isMe && <ParticipantAvatar participantId={selectedConversation.participant.id} className="w-8 h-8 mb-1 flex-shrink-0" />}

                                            <div className="flex flex-col gap-2 min-w-0">
                                                {/* Media Display */}
                                                {msg.media && msg.media.length > 0 && (
                                                    <div className={`grid gap-1 ${msg.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                                        {msg.media.map((item, idx) => (
                                                            <div key={idx} className="relative rounded-lg overflow-hidden border border-[#333]">
                                                                {item.type === 'image' ? (
                                                                    <img src={item.url} alt="Attachment" className="max-w-full h-auto object-cover max-h-60" />
                                                                ) : (
                                                                    <video src={item.url} controls className="max-w-full h-auto max-h-60" />
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Text Message Bubble */}
                                                {msg.text && (
                                                    <div className={`relative px-4 py-3 md:px-5 md:py-3 shadow-lg break-words transition-all duration-200
                                                    ${isMe
                                                            ? 'bg-gradient-to-b from-[#FF3B30] to-[#D32F2F] text-white rounded-2xl rounded-tr-sm'
                                                            : 'bg-[#1A1A1A] border border-[#333] text-[#E0E0E0] rounded-2xl rounded-tl-sm'
                                                        }
                                                `}>
                                                        {msg.text === '...' ? (
                                                            <div className="flex gap-1.5 px-1 py-1">
                                                                {[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />)}
                                                            </div>
                                                        ) : isAru ? (
                                                            <div className="text-sm leading-relaxed text-gray-200 markdown-content">
                                                                {renderModelMessage(msg.text)}
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm leading-relaxed">{msg.text}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Timestamp (Hover Only) */}
                                        <span className={`opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-[#666] px-12 ${isMe ? 'text-right' : 'text-left'}`}>
                                            {formatTimestamp(new Date().toISOString())}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* --- 4. Input Bar: The Deal-Making Console --- */}
                        <div className="absolute bottom-4 left-0 right-0 px-4 md:bottom-8 md:px-8 pointer-events-none z-30">
                            <form onSubmit={handleSend} className="max-w-4xl mx-auto pointer-events-auto">

                                {/* Media Preview Area */}
                                {media.length > 0 && (
                                    <div className="flex gap-4 p-4 mb-2 bg-[#121212]/90 backdrop-blur-md rounded-2xl border border-[#333] overflow-x-auto">
                                        {media.map((item, index) => (
                                            <div key={index} className="relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-[#555] group">
                                                {item.type === 'image' ? (
                                                    <img src={item.url} alt="Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <video src={item.url} className="w-full h-full object-cover" />
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => removeMedia(index)}
                                                    className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <XIcon className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="relative flex items-center bg-[#121212]/80 backdrop-blur-md border border-[#333] rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all focus-within:border-[#FF3B30]/50 focus-within:shadow-[0_8px_32px_rgba(255,59,48,0.1)]">

                                    {/* Utility Menu Button & Inputs */}
                                    <div className="relative">
                                        <input type="file" ref={imageInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />
                                        <input type="file" ref={videoInputRef} onChange={handleFileChange} accept="video/*" multiple className="hidden" />

                                        <button
                                            type="button"
                                            onClick={() => setMediaOptionsOpen(!mediaOptionsOpen)}
                                            className="p-3 ml-1 text-[#666] hover:text-white transition-colors rounded-full hover:bg-white/5"
                                        >
                                            <PlusIcon className="w-6 h-6" />
                                        </button>

                                        {/* Media Options Popup */}
                                        {mediaOptionsOpen && (
                                            <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#1A1A1A] border border-[#333] rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 z-50">
                                                <button
                                                    type="button"
                                                    onClick={() => { imageInputRef.current?.click(); setMediaOptionsOpen(false); }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-[#E0E0E0] hover:bg-[#FF3B30]/10 hover:text-[#FF3B30] transition-colors"
                                                >
                                                    <ImageIcon className="w-5 h-5" />
                                                    <span className="text-sm font-medium">Add Photos</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => { videoInputRef.current?.click(); setMediaOptionsOpen(false); }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-[#E0E0E0] hover:bg-[#FF3B30]/10 hover:text-[#FF3B30] transition-colors border-t border-[#333]"
                                                >
                                                    <VideoCameraIcon className="w-5 h-5" />
                                                    <span className="text-sm font-medium">Add Video</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Input Field */}
                                    <input
                                        type="text"
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        placeholder="Type your proposal..."
                                        className="flex-1 bg-transparent border-none text-white placeholder-[#555] px-4 py-4 focus:ring-0 focus:outline-none text-sm min-w-0" // min-w-0 prevents overflow
                                    />

                                    {/* Send Button */}
                                    <button
                                        type="submit"
                                        disabled={!message.trim() && media.length === 0}
                                        className="p-2 mr-2 rounded-full bg-[#FF3B30] text-white hover:bg-[#D32F2F] disabled:opacity-50 disabled:bg-[#333] transition-all shadow-md group shrink-0"
                                    >
                                        <PaperAirplaneIcon className="w-5 h-5 -ml-0.5 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                    </button>
                                </div>

                                {/* Helper Legend */}
                                <div className="text-center mt-3 opacity-0 hover:opacity-100 transition-opacity duration-500 hidden md:block">
                                    <p className="text-[10px] text-[#444] tracking-widest uppercase">Press Enter to Send • Deal Responsibly</p>
                                </div>
                            </form>
                        </div>
                    </>
                ) : (
                    /* --- Empty State --- */
                    /* Hidden on mobile if no chat (actually parent hides it), but simpler to just leave it flex */
                    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#000000]">
                        <div className="w-24 h-24 mb-6 rounded-3xl bg-gradient-to-tr from-[#111] to-[#222] border border-[#333] shadow-[0_0_50px_rgba(255,59,48,0.1)] flex items-center justify-center rotate-3 hover:rotate-0 transition-all duration-500">
                            <span className="text-4xl font-black text-white tracking-tighter">BH</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight text-center">Marketplace Insights</h2>
                        <p className="text-[#666] max-w-md text-center text-sm">
                            Select a deal from the flow to view details, negotiate terms, or finalize contracts.
                        </p>

                        {/* Mock Widget */}
                        <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-md">
                            <div className="bg-[#121212] p-4 rounded-xl border border-[#222]">
                                <p className="text-[10px] text-[#666] uppercase tracking-wide mb-1">Total Deals</p>
                                <p className="text-xl font-bold text-white">1,248</p>
                            </div>
                            <div className="bg-[#121212] p-4 rounded-xl border border-[#222]">
                                <p className="text-[10px] text-[#666] uppercase tracking-wide mb-1">Avg. Response</p>
                                <p className="text-xl font-bold text-[#FF3B30]">&lt; 2h</p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Collaboration;