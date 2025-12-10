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
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-base font-medium transition-colors duration-200 ${
      isActive
        ? 'text-white bg-[--primary-color]'
        : 'text-[--text-secondary] hover:text-white hover:bg-white/10'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ onNavigate, currentView, isSidebarOpen, setIsSidebarOpen, currentUser, onSignOut }) => {
  const [isPostMenuOpen, setIsPostMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
        className={`fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />
      
      <aside 
        onMouseLeave={() => {
            if (window.innerWidth > 768) setIsSidebarOpen(false);
        }}
        className={`fixed top-0 left-0 h-full w-64 bg-[--bg-color] border-r border-[--border-color] z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-end h-16 px-4 border-b border-[--border-color] flex-shrink-0">
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-[--text-secondary] hover:text-white">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
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

        <div className="p-4 border-t border-[--border-color] mt-auto flex-shrink-0">
            {/* Auth Section */}
            <div className="mb-4">
                {currentUser ? (
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 p-2 rounded-md">
                            {currentUser.profilePicture ? (
                                <img src={currentUser.profilePicture} alt={currentUser.name} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                                <UserCircleIcon className="w-10 h-10 text-white flex-shrink-0" />
                            )}
                            <div className="flex-1 truncate">
                                <p className="font-semibold text-sm text-white truncate">{currentUser.name}</p>
                                <p className="text-xs text-[--text-secondary] truncate">{currentUser.email}</p>
                            </div>
                        </div>
                        <NavLink 
                            icon={<UserCircleIcon className="w-5 h-5" />} 
                            label="My Profile" 
                            isActive={currentView === View.PROFILE} 
                            onClick={() => handleNavigation(View.PROFILE)} 
                        />
                        <button
                            onClick={onSignOut}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-base font-medium text-[--text-secondary] hover:text-white hover:bg-[--primary-color]/10"
                        >
                            <LogoutIcon className="w-5 h-5" />
                            <span>Sign Out</span>
                        </button>
                    </div>
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
            
            <div ref={menuRef} className="relative">
                {isPostMenuOpen && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 w-full bg-[--card-color] border border-[--border-color] rounded-md shadow-lg">
                        <a onClick={() => handlePostOptionClick(View.POST_DEMAND)} className="block px-4 py-2 text-sm text-[--text-secondary] hover:bg-white/10 hover:text-white cursor-pointer">Post a Demand</a>
                        <a onClick={() => handlePostOptionClick(View.POST_RENTAL)} className="block px-4 py-2 text-sm text-[--text-secondary] hover:bg-white/10 hover:text-white cursor-pointer">List a Rental</a>
                    </div>
                )}
                <button onClick={() => setIsPostMenuOpen(prev => !prev)} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md text-base font-medium bg-[--primary-color] text-white hover:opacity-90 transition-opacity">
                    <PlusIcon className="w-5 h-5" />
                    Post
                </button>
            </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;