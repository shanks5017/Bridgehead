import React, { useState } from 'react';
import { View, User } from '../types';
import {
  SparklesIcon, BookmarkIcon, LinkIcon, HomeIcon,
  LightBulbIcon, BuildingOfficeIcon, UsersIcon, FeedIcon, ChatBubbleLeftRightIcon,
  UserCircleIcon
} from './icons';

interface SidebarProps {
  onNavigate: (view: View) => void;
  currentView: View;
  isSidebarOpen: boolean; // Mobile toggle state
  setIsSidebarOpen: (isOpen: boolean) => void;
  currentUser: User | null;
  onSignOut: () => void;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isExpanded: boolean;
  onClick: () => void;
}

const NavItem = React.memo(({ icon, label, isActive, isExpanded, onClick }: NavItemProps) => (
  <button
    onClick={onClick}
    className={`w-full group relative flex items-center transition-all duration-200 ease-in-out px-4 py-4 h-14 overflow-hidden border-l-4
      ${isActive
        ? 'text-foundation bg-ink border-accent-green'
        : 'text-ink/40 border-transparent hover:text-foundation hover:bg-ink hover:border-accent-green'}
    `}
  >
    {/* Icon Container - Dynamic Scaling */}
    <div className={`shrink-0 flex items-center justify-center w-12 transform transition-all duration-300
      ${isActive ? 'scale-110 rotate-3' : 'group-hover:scale-125 group-hover:-rotate-3'}
    `}>
      {icon}
    </div>

    {/* Label - High-Contrast Typography */}
    <span className={`ml-4 text-[11px] font-mono font-bold tracking-[0.2em] uppercase whitespace-nowrap transition-all duration-300 delay-75
      ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8 pointer-events-none w-0'}
    `}>
      {label}
    </span>

    {/* Tooltip on Hover (Only when NOT expanded) */}
    {!isExpanded && (
      <div className="absolute left-full ml-4 px-3 py-1 bg-ink text-foundation text-[10px] font-mono tracking-widest uppercase opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[100] neo-shadow-sm border border-ink">
        {label}
      </div>
    )}

    {/* Active Indicator Line */}
    {isActive && (
      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-ink" />
    )}
  </button>
));

const Sidebar: React.FC<SidebarProps> = ({ onNavigate, currentView, isSidebarOpen, setIsSidebarOpen, currentUser }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleNavigation = (view: View) => {
    onNavigate(view);
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  // Determine if sidebar is currently in expanded state (Desktop hover OR Mobile open)
  const isExpanded = isHovered;

  return (
    <>
      {/* Mobile Overlay - Only visible when mobile sidebar is open */}
      <div
        className={`fixed inset-0 bg-ink/20 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed top-0 left-0 h-full bg-foundation border-r border-ink flex flex-col pt-24 pb-6 gap-8 z-40 transition-all duration-300 ease-out shadow-none
          ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
          ${isExpanded ? 'md:w-64 md:neo-shadow-lg' : 'md:w-20'}
        `}
      >

        {/* Primary Navigation Section */}
        <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar">
          <div className="px-5 mb-2 h-4 flex items-center">
            <div className={`text-[8px] font-mono tracking-[0.3em] uppercase opacity-30 transition-opacity duration-300 ${isExpanded ? 'opacity-30' : 'opacity-0'}`}>
              Directory
            </div>
          </div>
          <nav className="flex flex-col w-full">
            <NavItem icon={<HomeIcon className="w-6 h-6" />} label="Home" isActive={currentView === View.HOME} isExpanded={isExpanded} onClick={() => handleNavigation(View.HOME)} />
            <NavItem icon={<FeedIcon className="w-6 h-6" />} label="Activity" isActive={currentView === View.FEED} isExpanded={isExpanded} onClick={() => handleNavigation(View.FEED)} />
            <NavItem icon={<LightBulbIcon className="w-6 h-6" />} label="Demands" isActive={currentView === View.DEMAND_FEED} isExpanded={isExpanded} onClick={() => handleNavigation(View.DEMAND_FEED)} />
            <NavItem icon={<BuildingOfficeIcon className="w-6 h-6" />} label="Assets" isActive={currentView === View.RENTAL_LISTINGS} isExpanded={isExpanded} onClick={() => handleNavigation(View.RENTAL_LISTINGS)} />
            <NavItem icon={<UsersIcon className="w-6 h-6" />} label="Community" isActive={currentView === View.COMMUNITY_FEED} isExpanded={isExpanded} onClick={() => handleNavigation(View.COMMUNITY_FEED)} />
          </nav>

          <div className={`px-5 my-4 h-px bg-ink/5 transition-all duration-300 ${isExpanded ? 'mx-5' : 'mx-auto w-10'}`} />

          <div className="px-5 mb-2 h-4 flex items-center">
            <div className={`text-[8px] font-mono tracking-[0.3em] uppercase opacity-30 transition-opacity duration-300 ${isExpanded ? 'opacity-30' : 'opacity-0'}`}>
              Tools
            </div>
          </div>
          <nav className="flex flex-col w-full">
            <NavItem icon={<BookmarkIcon className="w-6 h-6" />} label="Archives" isActive={currentView === View.SAVED_POSTS} isExpanded={isExpanded} onClick={() => handleNavigation(View.SAVED_POSTS)} />
            <NavItem icon={<LinkIcon className="w-6 h-6" />} label="AI Signals" isActive={currentView === View.AI_MATCHES} isExpanded={isExpanded} onClick={() => handleNavigation(View.AI_MATCHES)} />
            <NavItem icon={<SparklesIcon className="w-6 h-6" />} label="Ideas" isActive={currentView === View.AI_SUGGESTIONS} isExpanded={isExpanded} onClick={() => handleNavigation(View.AI_SUGGESTIONS)} />
            <NavItem icon={<ChatBubbleLeftRightIcon className="w-6 h-6" />} label="Network" isActive={currentView === View.COLLABORATION} isExpanded={isExpanded} onClick={() => handleNavigation(View.COLLABORATION)} />
          </nav>
        </div>

        {/* User Auth Strip */}
        <div className="mt-auto px-4">
          <div
            onClick={() => handleNavigation(currentUser ? View.PROFILE : View.SIGN_IN)}
            className={`flex items-center w-full p-2 border-l-4 border-transparent transition-all duration-300 cursor-pointer overflow-hidden
              ${isExpanded ? 'hover:bg-ink hover:text-foundation hover:border-accent-green group' : 'justify-center'}
            `}
          >
            <div className="shrink-0 w-10 h-10 neo-border overflow-hidden bg-white">
              {currentUser?.profilePicture ? (
                <img src={currentUser.profilePicture} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                <UserCircleIcon className="w-full h-full text-ink" />
              )}
            </div>

            <div className={`ml-4 transition-all duration-300 ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none w-0'}`}>
              <div className="text-[10px] font-bold uppercase truncate max-w-[120px]">
                {currentUser?.name || 'Sign In'}
              </div>
              <div className="text-[8px] font-mono opacity-50 group-hover:opacity-80">
                {currentUser ? 'Agent ID: ' + (currentUser.id.substring(0, 8)) : 'Awaiting Access'}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default React.memo(Sidebar);