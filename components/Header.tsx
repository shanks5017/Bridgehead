import React, { useState, useEffect, useRef } from 'react';
import { MenuIcon, XIcon, UserCircleIcon, LogoutIcon } from './icons';
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


const Header: React.FC<HeaderProps> = ({ setIsSidebarOpen, isSidebarOpen, currentView, currentUser, onSignOut, setView }) => {
  return (
    <header className={`fixed top-0 right-0 z-40 bg-[--bg-color]/80 backdrop-blur-md h-16 flex items-center px-4 sm:px-6 lg:px-8 border-b border-[--border-color] transition-all duration-300 ease-in-out ${isSidebarOpen ? 'md:left-64' : 'left-0'}`}>
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
            <h2 className="text-xl font-semibold text-[--text-secondary] hidden sm:block">
                {getViewTitle(currentView)}
            </h2>
        </div>
        
        {/* Centered Logo/Title */}
        <h1 className="text-2xl font-bold text-white tracking-tighter">Bridgehead</h1>
        
        {/* Right section (placeholder for balance) */}
        <div className={`absolute right-0 hidden md:block transition-opacity duration-300 ${isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
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