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
            <div className={`${className} flex-shrink-0 border-2 border-white bg-ink flex items-center justify-center`}>
                <SparklesIcon className={`${iconSize} text-accent-green`} />
            </div>
        );
    }
    return <UserCircleIcon className={`${className} flex-shrink-0 text-ink/30 border-2 border-ink/20`} />;
};

// --- Component: Deal Flow List Item ---
const ConversationListItem: React.FC<{
    conversation: Conversation;
    isSelected: boolean;
    onClick: () => void;
    index: number;
}> = ({ conversation, isSelected, onClick, index }) => {
    const isAru = conversation.participant.id === 'aru-bot';

    return (
        <button
            onClick={onClick}
            className={`w-full text-left p-5 relative border-b border-ink/10 transition-all duration-200
                ${isSelected
                    ? 'bg-accent-green text-ink border-2 border-ink'
                    : 'bg-white text-ink hover:bg-foundation'
                }`}
        >
            <div className="flex items-start gap-4">
                <ParticipantAvatar participantId={conversation.participant.id} className="w-12 h-12" />

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                            <span className={`font-serif-italic font-black text-sm uppercase tracking-tight ${isSelected ? 'text-ink' : 'text-ink'}`}>
                                {conversation.participant.name}
                            </span>
                            {isAru ? (
                                <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 border ${isSelected ? 'border-ink text-ink' : 'border-accent-green text-accent-green'}`}>AI_AGENT</span>
                            ) : (
                                <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 border ${isSelected ? 'border-ink/20 text-ink/60' : 'border-ink/10 text-ink/40'}`}>PARTNER</span>
                            )}
                        </div>
                        <span className={`text-[9px] font-mono font-bold opacity-40`}>
                            {formatTimestamp(conversation.lastMessageTimestamp)}
                        </span>
                    </div>

                    <p className={`text-[11px] font-bold uppercase tracking-tight truncate mb-1 opacity-60`}>
                        {isAru ? 'ZONEK Operational Support' : conversation.participant.postTitle}
                    </p>

                    <p className={`text-[11px] truncate max-w-[200px] opacity-40 font-mono italic`}>
                        {conversation.messages[conversation.messages.length - 1]?.text}
                    </p>
                </div>
            </div>
            {isSelected && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="w-2 h-2 bg-ink animate-pulse" />
                </div>
            )}
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
        <div className="flex h-[calc(100vh-5rem)] mt-20 bg-foundation text-ink font-sans overflow-hidden">

            {/* --- 1. Sidebar: Active Deal Flow --- */}
            <aside className={`flex flex-col bg-white z-10 w-full md:w-96 border-r-2 border-ink overflow-hidden ${selectedConversationId ? 'hidden md:flex' : 'flex'}`}>

                {/* Header Section */}
                <div className="p-6 border-b-2 border-ink bg-foundation">
                    {/* Search Bar */}
                    <div className="relative mb-6">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
                        <input
                            type="text"
                            placeholder="SEARCH_SIGNAL..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border-2 border-ink px-4 py-3 pl-11 text-[11px] font-mono font-bold text-ink placeholder-ink/30 focus:outline-none focus:ring-2 focus:ring-accent-green transition-all"
                        />
                    </div>

                    {/* Filter Toggles */}
                    <div className="flex border-2 border-ink bg-white overflow-hidden">
                        <button
                            onClick={() => setFilter('all')}
                            className={`flex-1 py-3 text-[10px] font-mono font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-ink text-white' : 'hover:bg-foundation'}`}
                        >
                            My Demands
                        </button>
                        <button
                            onClick={() => setFilter('opportunities')}
                            className={`flex-1 py-3 text-[10px] font-mono font-black uppercase tracking-widest border-l-2 border-ink transition-all ${filter === 'opportunities' ? 'bg-ink text-white' : 'hover:bg-foundation'}`}
                        >
                            Opportunities
                        </button>
                    </div>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-ink/10 scrollbar-track-transparent">
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
                        <div className="p-12 text-center">
                            <p className="text-[10px] font-mono font-bold uppercase opacity-30 tracking-[0.3em]">No Active Signals Found</p>
                        </div>
                    )}
                </div>
            </aside>


            {/* --- 2. Main Chat Area --- */}
            <main className={`flex-col relative bg-foundation w-full md:flex-1 overflow-hidden ${!selectedConversationId ? 'hidden md:flex' : 'flex'}`}>
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <header className="h-20 shrink-0 border-b-2 border-ink bg-white flex items-center justify-between px-6 md:px-12 z-20 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-full bg-ink/5 skew-x-[-20deg] translate-x-16" />
                            
                            <div className="flex items-center gap-6 relative z-10">
                                {/* Back Button (Mobile Only) */}
                                <button
                                    onClick={() => setSelectedConversationId(null)}
                                    className="md:hidden p-2 -ml-2 text-ink hover:text-accent-green transition-colors"
                                >
                                    <ArrowLeftIcon className="w-5 h-5" />
                                </button>

                                <div className="flex items-center gap-4">
                                    <ParticipantAvatar participantId={selectedConversation.participant.id} className="w-10 h-10 border-2 border-ink" />
                                    <div>
                                        <h1 className="text-lg font-serif-italic font-black text-ink uppercase tracking-tight leading-none flex items-center gap-2">
                                            {selectedConversation.participant.id === 'aru-bot' ? 'ARU' : selectedConversation.participant.postTitle}
                                            {selectedConversation.participant.id === 'aru-bot' && <SparklesIcon className="w-4 h-4 text-accent-green" />}
                                        </h1>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-ink/40">{selectedConversation.participant.name}</span>
                                            {selectedConversation.participant.id !== 'aru-bot' && (
                                                <div className="flex items-center gap-1 text-accent-green">
                                                    <VerifiedIcon className="w-3 h-3" />
                                                    <span className="text-[9px] font-mono font-black uppercase">Verified_Node</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* View Deal Details Action */}
                            <button
                                onClick={() => setDetailsOpen(true)}
                                className="group bg-ink text-foundation px-6 py-3 text-[10px] font-mono font-black uppercase tracking-widest neo-border hover:bg-accent-green hover:text-ink transition-all active:translate-y-px"
                            >
                                View_Intel
                            </button>
                        </header>

                        {/* --- Deal Details Side Panel --- */}
                        {detailsOpen && (
                            <div className="absolute inset-0 z-50 bg-ink/60 backdrop-blur-sm flex justify-end">
                                <div className="w-full md:w-96 bg-white border-l-2 border-ink h-full overflow-y-auto p-10 shadow-[ -10px_0_30px_rgba(0,0,0,0.1)]">
                                    {/* Modal Header */}
                                    <div className="flex items-center justify-between mb-12">
                                        <h3 className="text-[10px] font-mono font-black uppercase tracking-[0.4em] text-ink/30">Deal Intelligence</h3>
                                        <button
                                            onClick={() => setDetailsOpen(false)}
                                            className="p-2 -mr-2 bg-foundation border-2 border-ink hover:bg-accent-green transition-all"
                                        >
                                            <XIcon className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Participant Profile */}
                                    <div className="flex flex-col items-center mb-12">
                                        <div className="relative mb-6">
                                            <ParticipantAvatar participantId={selectedConversation.participant.id} className="w-32 h-32 border-4 border-ink" />
                                            {selectedConversation.participant.id !== 'aru-bot' && (
                                                <div className="absolute bottom-0 right-0 bg-accent-green p-2 border-4 border-ink">
                                                    <VerifiedIcon className="w-8 h-8 text-ink" />
                                                </div>
                                            )}
                                        </div>
                                        <h2 className="text-2xl font-serif-italic font-black text-ink uppercase mb-2">{selectedConversation.participant.name}</h2>
                                        <p className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">
                                            {selectedConversation.participant.id === 'aru-bot' ? 'Operational Assistant' : 'Verified Partner'}
                                        </p>
                                    </div>

                                    {/* Deal Context */}
                                    <div className="space-y-8">
                                        {/* Reference Post */}
                                        <div className="p-6 border-2 border-ink bg-foundation">
                                            <p className="text-[9px] font-mono font-black uppercase tracking-widest text-accent-green mb-3">Target Signal</p>
                                            <h4 className="text-lg font-serif-italic font-black text-ink uppercase leading-tight mb-6">
                                                {selectedConversation.participant.id === 'aru-bot' ? 'System Operational Logic' : selectedConversation.participant.postTitle}
                                            </h4>
                                            {selectedConversation.participant.id !== 'aru-bot' && (
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-mono font-bold uppercase px-3 py-1 bg-ink text-foundation">Demand_Active</span>
                                                    <span className="text-[10px] font-mono font-bold uppercase px-3 py-1 border border-ink/20">Operational</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Status Indicators */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 border-2 border-ink bg-white">
                                                <p className="text-[9px] font-mono font-bold text-ink/30 uppercase mb-1">Contract</p>
                                                <p className="text-xs font-black text-ink uppercase flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 bg-yellow-500" />
                                                    Drafting
                                                </p>
                                            </div>
                                            <div className="p-4 border-2 border-ink bg-white">
                                                <p className="text-[9px] font-mono font-bold text-ink/30 uppercase mb-1">Valuation</p>
                                                <p className="text-xs font-black text-ink uppercase">Negotiating</p>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="space-y-4 pt-4">
                                            <button className="w-full py-4 bg-ink text-foundation font-serif-italic font-black text-lg uppercase neo-border hover:bg-accent-green hover:text-ink transition-all">
                                                View Source Signal
                                            </button>
                                            <button className="w-full py-4 border-2 border-ink text-ink font-mono font-black text-[10px] uppercase tracking-widest hover:bg-foundation transition-all">
                                                Generate Proposal
                                            </button>
                                        </div>

                                        {/* Danger Zone */}
                                        <div className="pt-12 border-t-2 border-ink/5">
                                            <button className="w-full flex items-center justify-center gap-3 py-4 border-2 border-red-500 text-red-500 font-mono font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                                                End Interaction
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- 3. Message Area: The Professional Thread --- */}
                        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-thin scrollbar-thumb-[#222]">
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
                                                    <div className={`relative px-6 py-4 border-2 transition-all duration-200
                                                    ${isMe
                                                            ? 'bg-ink border-ink text-foundation'
                                                            : 'bg-white border-ink text-ink'
                                                        }
                                                `}>
                                                        {isMe && <div className="absolute top-0 right-0 w-2 h-full bg-accent-green opacity-30" />}
                                                        {!isMe && <div className="absolute top-0 left-0 w-2 h-full bg-accent-green opacity-10" />}

                                                        {msg.text === '...' ? (
                                                            <div className="flex gap-2">
                                                                {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 bg-accent-green" style={{ animation: `pulse 1.5s infinite ${i * 0.2}s` }} />)}
                                                            </div>
                                                        ) : isAru ? (
                                                            <div className="text-[13px] leading-relaxed font-bold uppercase tracking-tight markdown-content">
                                                                {renderModelMessage(msg.text)}
                                                            </div>
                                                        ) : (
                                                            <p className="text-[13px] leading-relaxed font-bold uppercase tracking-tight">{msg.text}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Timestamp (Hover Only) */}
                                        <span className={`opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-mono font-bold uppercase text-ink/30 mt-2 ${isMe ? 'text-right' : 'text-left'}`}>
                                            {formatTimestamp(new Date().toISOString())}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* --- 4. Input Bar: The Command Dispatch --- */}
                        <div className="shrink-0 px-6 md:px-12 pb-8 z-30 bg-foundation border-t-2 border-ink">
                            <form onSubmit={handleSend} className="max-w-7xl mx-auto pt-8">

                                {/* Media Preview Area */}
                                {media.length > 0 && (
                                    <div className="flex gap-4 p-4 mb-4 bg-white border-2 border-ink neo-shadow-sm overflow-x-auto">
                                        {media.map((item, index) => (
                                            <div key={index} className="relative shrink-0 w-24 h-24 border-2 border-ink group">
                                                {item.type === 'image' ? (
                                                    <img src={item.url} alt="Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <video src={item.url} className="w-full h-full object-cover" />
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => removeMedia(index)}
                                                    className="absolute -top-2 -right-2 p-1 bg-white border-2 border-ink hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                >
                                                    <XIcon className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center bg-white border-2 border-ink neo-shadow-sm focus-within:ring-2 focus-within:ring-accent-green transition-all">

                                    {/* Utility Menu Button & Inputs */}
                                    <div className="relative border-r-2 border-ink">
                                        <input type="file" ref={imageInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />
                                        <input type="file" ref={videoInputRef} onChange={handleFileChange} accept="video/*" multiple className="hidden" />

                                        <button
                                            type="button"
                                            onClick={() => setMediaOptionsOpen(!mediaOptionsOpen)}
                                            className="p-5 text-ink/30 hover:text-ink hover:bg-foundation transition-all"
                                        >
                                            <PlusIcon className="w-6 h-6" />
                                        </button>

                                        {/* Media Options Popup */}
                                        {mediaOptionsOpen && (
                                            <div className="absolute bottom-full left-0 mb-4 w-56 bg-white border-2 border-ink neo-shadow-md z-50 overflow-hidden">
                                                <button
                                                    type="button"
                                                    onClick={() => { imageInputRef.current?.click(); setMediaOptionsOpen(false); }}
                                                    className="w-full flex items-center gap-4 px-6 py-4 text-[10px] font-mono font-black uppercase tracking-widest text-ink hover:bg-accent-green transition-all"
                                                >
                                                    <ImageIcon className="w-5 h-5" />
                                                    Add_Signal_Images
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => { videoInputRef.current?.click(); setMediaOptionsOpen(false); }}
                                                    className="w-full flex items-center gap-4 px-6 py-4 text-[10px] font-mono font-black uppercase tracking-widest text-ink border-t-2 border-ink hover:bg-accent-green transition-all"
                                                >
                                                    <VideoCameraIcon className="w-5 h-5" />
                                                    Add_Technical_Video
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Input Field */}
                                    <input
                                        type="text"
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        placeholder="DISPATCH_PROPOSAL..."
                                        className="flex-1 bg-transparent border-none text-[12px] font-bold uppercase text-ink placeholder-ink/20 px-6 py-5 focus:ring-0 focus:outline-none min-w-0" // min-w-0 prevents overflow
                                    />

                                    {/* Send Button */}
                                    <button
                                        type="submit"
                                        disabled={!message.trim() && media.length === 0}
                                        className="bg-ink text-foundation p-5 border-l-2 border-ink hover:bg-accent-green hover:text-ink transition-all disabled:opacity-20"
                                    >
                                        <PaperAirplaneIcon className="w-6 h-6 transform -rotate-45" />
                                    </button>
                                </div>

                                {/* Helper Legend Removed */}
                            </form>
                        </div>
                    </>
                ) : (
                    /* --- 5. Empty State: System Briefing --- */
                    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-foundation relative overflow-hidden">
                        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                        
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-24 h-24 mb-10 bg-white border-2 border-ink neo-shadow-md flex items-center justify-center rotate-3">
                                <span className="text-4xl font-serif-italic font-black text-ink tracking-tighter">BH</span>
                            </div>
                            
                            <h2 className="text-3xl font-serif-italic font-black text-ink uppercase mb-3 tracking-tight">Intelligence Dashboard</h2>
                            <p className="text-[10px] font-mono font-bold text-ink/40 max-w-sm uppercase tracking-[0.2em] mb-12">
                                Select an active transaction signal to monitor negotiation progress and execute contract logic.
                            </p>

                            {/* Tactical Metrics */}
                            <div className="grid grid-cols-2 gap-6 w-full max-w-lg">
                                <div className="bg-white p-6 border-2 border-ink neo-shadow-sm">
                                    <p className="text-[9px] font-mono font-black text-ink/30 uppercase tracking-widest mb-2">Total_Active_Streams</p>
                                    <p className="text-3xl font-serif-italic font-black text-ink leading-none">1,248</p>
                                    <div className="mt-4 h-1 bg-foundation relative overflow-hidden">
                                        <div className="absolute inset-y-0 left-0 bg-accent-green w-3/4 animate-loading-slide" />
                                    </div>
                                </div>
                                <div className="bg-white p-6 border-2 border-ink neo-shadow-sm">
                                    <p className="text-[9px] font-mono font-black text-ink/30 uppercase tracking-widest mb-2">Signal_Latency</p>
                                    <p className="text-3xl font-serif-italic font-black text-accent-green leading-none">&lt; 2h</p>
                                    <div className="mt-4 flex gap-1">
                                        {[0, 1, 2, 3, 4].map(i => <div key={i} className={`h-1 flex-1 ${i < 4 ? 'bg-accent-green' : 'bg-foundation'}`} />)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Collaboration;