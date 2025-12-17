import React, { useState, useEffect, useRef } from 'react';
import { MenuIcon, XIcon, UserCircleIcon, LogoutIcon, PencilIcon, LightBulbIcon, BuildingOfficeIcon } from './icons';
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

    const ProfileAvatar: React.FC<{ user: User, className: string }> = ({ user, className }) => {
        if (user.profilePicture) {
            return <img src={user.profilePicture} alt={user.name} className={`${className} rounded-full object-cover`} />;
        }
        return <UserCircleIcon className={`${className} text-white`} />;
    };

    return (
        <div ref={dropdownRef} className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                <ProfileAvatar user={user} className="w-10 h-10" />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[--card-color] border border-[--border-color] rounded-md shadow-lg z-50">
                    <div className="px-4 py-3 border-b border-[--border-color]">
                        <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                        <p className="text-xs text-[--text-secondary] truncate">{user.email}</p>
                    </div>
                    <button
                        onClick={() => {
                            setView(View.PROFILE);
                            setIsOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-left text-[--text-secondary] hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <UserCircleIcon className="w-5 h-5" />
                        My Profile
                    </button>
                    <button
                        onClick={() => {
                            onSignOut();
                            setIsOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-left text-[--text-secondary] hover:bg-[--primary-color]/20 hover:text-[--primary-color] transition-colors"
                    >
                        <LogoutIcon className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
};

const PostDropdown: React.FC<{ setView: (view: View) => void }> = ({ setView }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsOpen(false);
            setIsClosing(false);
        }, 200); // Match animation duration
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                if (isOpen && !isClosing) {
                    handleClose();
                }
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, isClosing]);

    const handleToggle = () => {
        if (isOpen) {
            handleClose();
        } else {
            setIsOpen(true);
        }
    };

    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={handleToggle}
                className="group relative px-4 py-2 rounded-full text-sm font-semibold overflow-hidden bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/50 transition-all duration-300"
                style={{
                    background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #dc2626 100%)',
                    backgroundSize: '200% 200%',
                }}
            >
                {/* Animated shimmer on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-white/30 to-red-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full"
                    style={{
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 2s infinite linear'
                    }}
                />
                <span className="relative z-10 flex items-center gap-2">
                    <PencilIcon className="w-4 h-4" />
                    <span>Post</span>
                    <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                </span>
            </button>

            {isOpen && (
                <div
                    className="absolute right-0 mt-2 w-64 bg-[--card-color] border border-[--border-color] rounded-2xl shadow-xl z-50 overflow-hidden"
                    style={{
                        animation: isClosing ? 'dropdownClose 0.2s ease-in forwards' : 'dropdownOpen 0.2s ease-out forwards'
                    }}
                >
                    <button
                        onClick={() => {
                            setView(View.POST_DEMAND);
                            handleClose();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left text-[--text-secondary] hover:bg-gradient-to-r hover:from-red-600/20 hover:via-red-500/20 hover:to-red-600/20 hover:text-white transition-all duration-300 group"
                    >
                        <LightBulbIcon className="w-6 h-6 group-hover:scale-110 transition-transform duration-300 text-yellow-400" />
                        <div>
                            <div className="font-semibold">Post a Demand</div>
                            <div className="text-xs opacity-70">What's your community missing?</div>
                        </div>
                    </button>
                    <button
                        onClick={() => {
                            setView(View.POST_RENTAL);
                            handleClose();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left text-[--text-secondary] hover:bg-gradient-to-r hover:from-red-600/20 hover:via-red-500/20 hover:to-red-600/20 hover:text-white transition-all duration-300 group"
                    >
                        <BuildingOfficeIcon className="w-6 h-6 group-hover:scale-110 transition-transform duration-300 text-blue-400" />
                        <div>
                            <div className="font-semibold">Post a Rental</div>
                            <div className="text-xs opacity-70">List your commercial space</div>
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
};


const Header: React.FC<HeaderProps> = ({ setIsSidebarOpen, isSidebarOpen, currentView, currentUser, onSignOut, setView }) => {
    return (
        <header
            style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
            className={`fixed top-0 right-0 z-40 bg-[--bg-color]/80 backdrop-blur-md h-16 flex items-center px-4 sm:px-6 lg:px-8 border-b border-[--border-color] transition-all duration-300 left-0 w-full ${isSidebarOpen ? 'md:left-64 md:w-[calc(100%-16rem)]' : ''}`}
        >
            <div className="flex items-center justify-center w-full relative">
                {/* Left aligned content */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-4">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`md:hidden text-white transition-opacity duration-300 ${isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                        aria-label="Toggle sidebar"
                    >
                        <MenuIcon className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`text-xl font-semibold text-[--text-secondary] hover:text-white hidden sm:block transition-all duration-300 ${isSidebarOpen ? 'ml-4' : 'ml-0'}`}
                        aria-label="Toggle sidebar"
                    >
                        {getViewTitle(currentView)}
                    </button>
                </div>

                {/* Centered Logo/Title */}
                <h1 className="text-2xl font-bold text-white tracking-tighter">Bridgehead</h1>

                {/* Right section (placeholder for balance) */}
                <div className={`absolute right-0 hidden md:flex items-center gap-3 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    {/* Post Button - Always Visible */}
                    <PostDropdown setView={setView} />

                    {/* Profile or Auth Buttons */}
                    {currentUser ? (
                        <ProfileDropdown user={currentUser} onSignOut={onSignOut} setView={setView} />
                    ) : (
                        <div className="flex items-center gap-1 md:gap-2">
                            <button
                                onClick={() => setView(View.SIGN_IN)}
                                className="px-2 py-1 md:px-4 md:py-2 rounded-md text-xs md:text-sm font-medium bg-transparent text-white hover:bg-white/10 transition-colors"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => setView(View.SIGN_UP)}
                                className="px-2 py-1 md:px-4 md:py-2 rounded-md text-xs md:text-sm font-medium bg-[--primary-color] text-white hover:opacity-90 transition-opacity"
                            >
                                Sign Up
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;