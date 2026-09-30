import React, { useState, useEffect, useRef } from 'react';
import { MenuIcon, UserCircleIcon, LogoutIcon, PencilIcon, LightBulbIcon, BuildingOfficeIcon } from './icons';
import { View, User } from '../types';

interface HeaderProps {
    setIsSidebarOpen: (isOpen: boolean) => void;
    isSidebarOpen: boolean;
    currentView: View;
    currentUser: User | null;
    onSignOut: () => void;
    setView: (view: View) => void;
}

const getViewTitle = (view: View): string => {
    switch (view) {
        case View.HOME: return 'Home';
        case View.FEED: return 'Activity Feed';
        case View.DEMAND_FEED: return 'Demands';
        case View.POST_DEMAND: return 'Post a Demand';
        case View.RENTAL_LISTINGS: return 'Rentals';
        case View.POST_RENTAL: return 'List a Rental';
        case View.AI_SUGGESTIONS: return 'AI Ideas';
        case View.AI_MATCHES: return 'AI Matches';
        case View.COMMUNITY_FEED: return 'Community Hub';
        case View.DEMAND_DETAIL: return 'Demand Details';
        case View.RENTAL_DETAIL: return 'Rental Details';
        case View.SAVED_POSTS: return 'Saved Items';
        case View.COLLABORATION: return 'Messages';
        case View.SIGN_IN: return 'Sign In';
        case View.SIGN_UP: return 'Sign Up';
        case View.PROFILE: return 'My Profile';
        default: return '';
    }
};

const ProfileDropdown: React.FC<{ user: User; onSignOut: () => void; setView: (view: View) => void }> = ({ user, onSignOut, setView }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 neo-border bg-white flex items-center justify-center hover:neo-shadow-sm transition-all"
            >
                {user.profilePicture ? (
                    <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                    <UserCircleIcon className="w-8 h-8 text-ink" />
                )}
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-foundation border border-ink neo-shadow-md z-[100] animate-slide-up">
                    <div className="px-4 py-3 border-b border-ink/10">
                        <p className="text-[10px] font-mono tracking-widest uppercase opacity-50">Active User</p>
                        <p className="font-bold truncate">{user.name}</p>
                    </div>
                    <button
                        onClick={() => {
                            setView(View.PROFILE);
                            setIsOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-left font-bold hover:bg-ink hover:text-foundation transition-colors uppercase tracking-tight"
                    >
                        Profile
                    </button>
                    <button
                        onClick={() => {
                            onSignOut();
                            setIsOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-left font-bold hover:bg-ink hover:text-foundation transition-colors uppercase tracking-tight border-t border-ink/10"
                    >
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
};

const PostDropdown: React.FC<{ setView: (view: View) => void }> = ({ setView }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="neo-button neo-button-primary"
            >
                <PencilIcon className="w-4 h-4 mr-2" />
                <span>Post</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-ink neo-shadow-md z-[100] animate-slide-up">
                    <button
                        onClick={() => { setView(View.POST_DEMAND); setIsOpen(false); }}
                        className="w-full text-left p-4 hover:bg-ink hover:text-white transition-colors group border-b border-ink/10"
                    >
                        <div className="flex items-center gap-3">
                            <LightBulbIcon className="w-5 h-5" />
                            <div className="font-bold uppercase tracking-tight">Demand Post</div>
                        </div>
                        <p className="text-[10px] font-mono tracking-widest mt-1 opacity-60 group-hover:opacity-100">Request a service or business</p>
                    </button>
                    <button
                        onClick={() => { setView(View.POST_RENTAL); setIsOpen(false); }}
                        className="w-full text-left p-4 hover:bg-ink hover:text-white transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <BuildingOfficeIcon className="w-5 h-5" />
                            <div className="font-bold uppercase tracking-tight">Rental Post</div>
                        </div>
                        <p className="text-[10px] font-mono tracking-widest mt-1 opacity-60 group-hover:opacity-100">List a commercial property</p>
                    </button>
                </div>
            )}
        </div>
    );
};

const Header: React.FC<HeaderProps> = ({ setIsSidebarOpen, isSidebarOpen, currentView, currentUser, onSignOut, setView }) => {
    return (
        <header className="fixed top-0 right-0 left-0 h-20 bg-foundation border-b border-ink z-50 flex items-center px-6 md:px-12">
            <div className="flex items-center justify-between w-full">
                {/* Branding & Navigation Toggle */}
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="md:hidden text-ink"
                    >
                        <MenuIcon className="w-6 h-6" />
                    </button>

                    <div
                        className="hidden md:flex items-center gap-3 cursor-pointer group"
                        onClick={() => setView(View.HOME)}
                    >
                        <img src="/favicon.png" alt="ZONEK Logo" className="w-8 h-8 object-contain transition-transform group-hover:scale-110" />
                        <h1 className="text-2xl font-serif-italic font-black tracking-tighter leading-none text-ink">ZONEK</h1>
                    </div>

                    <div className="h-6 w-px bg-ink/10 hidden md:block" />

                    <div className="font-serif-italic text-lg italic opacity-80">
                        {getViewTitle(currentView)}
                    </div>
                </div>

                {/* Search / Global Actions */}
                <div className="flex items-center gap-4">
                    <PostDropdown setView={setView} />

                    {currentUser ? (
                        <ProfileDropdown user={currentUser} onSignOut={onSignOut} setView={setView} />
                    ) : (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setView(View.SIGN_IN)}
                                className="neo-button text-xs py-2 px-4"
                            >
                                Sign In
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default React.memo(Header);