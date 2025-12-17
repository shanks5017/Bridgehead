import React, { useState, useRef, useEffect } from 'react';
import { View, User } from '../types';
import {
  SparklesIcon, PlusIcon, BookmarkIcon, LinkIcon, XIcon, HomeIcon,
  LightBulbIcon, BuildingOfficeIcon, UsersIcon, FeedIcon, ChatBubbleLeftRightIcon,
  UserCircleIcon, LogoutIcon
} from './icons';

interface SidebarProps {
  onNavigate: (view: View) => void;
  currentView: View;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  currentUser: User | null;
  onSignOut: () => void;
}

const NavLink: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`group relative w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-base font-medium transition-all duration-300 overflow-hidden ${isActive
      ? 'text-white bg-gradient-to-r from-red-600 via-red-500 to-red-600 shadow-xl shadow-red-500/50'
      : 'text-[--text-secondary] hover:text-white'
      }`}
    style={{
      background: isActive
        ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #dc2626 100%)'
        : 'transparent',
    }}
  >
    {/* Animated gradient background on hover */}
    {!isActive && (
      <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-500/20 to-red-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full"
        style={{
          backgroundSize: '200% 100%',
          animation: 'shimmer 2s infinite linear'
        }}
      />
    )}

    {/* Glow effect on hover */}
    <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl bg-red-500/30" />

    {/* Icon with premium animation */}
    <div className="relative z-10 transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
      {icon}
    </div>

    {/* Text with smooth transition */}
    <span className="relative z-10 transform transition-all duration-300 group-hover:translate-x-1">{label}</span>

    {/* Shine effect on active */}
    {isActive && (
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-shine" />
      </div>
    )}
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ onNavigate, currentView, isSidebarOpen, setIsSidebarOpen, currentUser, onSignOut }) => {
  const [isPostMenuOpen, setIsPostMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Custom Red Scrollbar Logic
  const [scrollProgress, setScrollProgress] = useState(0);
  const navRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (navRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = navRef.current;
      const height = scrollHeight - clientHeight;
      if (height > 0) {
        setScrollProgress((scrollTop / height) * 100);
      } else {
        setScrollProgress(0);
      }
    }
  };

  const handleNavigation = (view: View) => {
    onNavigate(view);
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false); // Close sidebar on mobile navigation
    }
  };

  const handlePostOptionClick = (view: View) => {
    handleNavigation(view);
    setIsPostMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsPostMenuOpen(false);
      }
    };

    if (isPostMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPostMenuOpen]);

  return (
    <>
      {/* Overlay for mobile */}
      <div
        style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
        className={`fixed inset-0 bg-black/70 backdrop-blur-md z-40 md:hidden transition-all duration-500 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside
        onMouseLeave={() => {
          if (window.innerWidth > 768) setIsSidebarOpen(false);
        }}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: isSidebarOpen ? 'transform' : 'auto',
          transform: isSidebarOpen ? 'translateX(0) scale(1)' : 'translateX(-100%) scale(0.95)',
          transformOrigin: 'left center',
        }}
        className={`fixed top-0 left-0 h-full w-72 bg-[--bg-color]/95 backdrop-blur-xl border-r border-[--border-color] shadow-2xl shadow-red-500/10 z-50 transition-all duration-500 flex flex-col`}
      >
        {/* Red Slidebar for Sidebar */}
        <div
          className="absolute top-0 right-0 z-[60] w-[2px] bg-[#FF0000] transition-all duration-150 ease-out shadow-[0_0_10px_rgba(255,0,0,0.5)]"
          style={{ height: `${scrollProgress}%` }}
        />

        <div className="flex items-center justify-end h-16 px-4 border-b border-[--border-color] flex-shrink-0">
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-[--text-secondary] hover:text-white">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div
          ref={navRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto hide-scrollbar"
        >
          <div >
            <nav className="p-4 space-y-2">
              <NavLink icon={<HomeIcon className="w-5 h-5" />} label="Home" isActive={currentView === View.HOME} onClick={() => handleNavigation(View.HOME)} />
              <NavLink icon={<FeedIcon className="w-5 h-5" />} label="Feed" isActive={currentView === View.FEED} onClick={() => handleNavigation(View.FEED)} />
              <NavLink icon={<LightBulbIcon className="w-5 h-5" />} label="Demands" isActive={currentView === View.DEMAND_FEED} onClick={() => handleNavigation(View.DEMAND_FEED)} />
              <NavLink icon={<BuildingOfficeIcon className="w-5 h-5" />} label="Rentals" isActive={currentView === View.RENTAL_LISTINGS} onClick={() => handleNavigation(View.RENTAL_LISTINGS)} />
              <NavLink icon={<UsersIcon className="w-5 h-5" />} label="Community" isActive={currentView === View.COMMUNITY_FEED} onClick={() => handleNavigation(View.COMMUNITY_FEED)} />
              <NavLink icon={<ChatBubbleLeftRightIcon className="w-5 h-5" />} label="Messages" isActive={currentView === View.COLLABORATION} onClick={() => handleNavigation(View.COLLABORATION)} />
            </nav>

            <div className="p-4">
              <div className="border-t border-[--border-color] pt-4 space-y-2">
                <h3 className="px-3 text-xs font-semibold text-[--text-secondary] uppercase tracking-wider">Tools</h3>
                <NavLink icon={<BookmarkIcon className="w-5 h-5" />} label="Saved" isActive={currentView === View.SAVED_POSTS} onClick={() => handleNavigation(View.SAVED_POSTS)} />
                <NavLink icon={<LinkIcon className="w-5 h-5" />} label="AI Matches" isActive={currentView === View.AI_MATCHES} onClick={() => handleNavigation(View.AI_MATCHES)} />
                <NavLink icon={<SparklesIcon className="w-5 h-5" />} label="AI Ideas" isActive={currentView === View.AI_SUGGESTIONS} onClick={() => handleNavigation(View.AI_SUGGESTIONS)} />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[--border-color] mt-auto flex-shrink-0">
          {/* Auth Section */}
          {currentUser ? (
            <button
              onClick={() => handleNavigation(View.PROFILE)}
              className="w-full flex items-center gap-3 p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              {currentUser.profilePicture ? (
                <img src={currentUser.profilePicture} alt={currentUser.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <UserCircleIcon className="w-10 h-10 text-white flex-shrink-0" />
              )}
              <div className="flex-1 truncate text-left">
                <p className="font-semibold text-sm text-white truncate">{currentUser.name}</p>
                <p className="text-xs text-[--text-secondary] truncate">{currentUser.email}</p>
              </div>
            </button>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => handleNavigation(View.SIGN_IN)}
                className="w-full px-4 py-2 rounded-md text-sm font-medium bg-transparent text-white hover:bg-white/10 border border-[--border-color] transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => handleNavigation(View.SIGN_UP)}
                className="w-full px-4 py-2 rounded-md text-sm font-medium bg-[--primary-color] text-white hover:opacity-90 transition-opacity"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;