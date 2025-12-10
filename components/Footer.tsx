import React from 'react';
import { LinkedInIcon, XSocialIcon, InstagramIcon } from './icons';
import { View } from '../types';

interface FooterProps {
    setView: (view: View) => void;
    onNavigateToAIAssistant: () => void;
}

const FooterLink: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
    <li>
        <button onClick={onClick} className="hover:text-white transition-colors">
            {children}
        </button>
    </li>
);

const Footer: React.FC<FooterProps> = ({ setView, onNavigateToAIAssistant }) => (
    <footer id="page-footer" className="bg-[--bg-color] text-[--text-secondary] py-16 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
                <h3 className="text-white text-2xl font-bold tracking-tighter mb-2">Bridgehead</h3>
                <p className="text-sm">Connecting community needs with entrepreneurial spirit.</p>
            </div>
            <div className="space-y-3">
                <h4 className="font-bold text-white">Navigate</h4>
                <ul className="space-y-2 text-sm">
                    <FooterLink onClick={() => setView(View.HOME)}>Home</FooterLink>
                    <FooterLink onClick={() => setView(View.DEMAND_FEED)}>Demands</FooterLink>
                    <FooterLink onClick={() => setView(View.RENTAL_LISTINGS)}>Rentals</FooterLink>
                    <FooterLink onClick={() => setView(View.COMMUNITY_FEED)}>Community Hub</FooterLink>
                </ul>
            </div>
            <div className="space-y-3">
                <h4 className="font-bold text-white">Tools</h4>
                <ul className="space-y-2 text-sm">
                    <FooterLink onClick={() => setView(View.AI_SUGGESTIONS)}>AI Ideas</FooterLink>
                    <FooterLink onClick={() => setView(View.AI_MATCHES)}>AI Matches</FooterLink>
                    <FooterLink onClick={() => setView(View.SAVED_POSTS)}>Saved Items</FooterLink>
                    <FooterLink onClick={onNavigateToAIAssistant}>AI Assistant</FooterLink>
                </ul>
            </div>
            <div className="space-y-3">
                <h4 className="font-bold text-white">Connect</h4>
                <div className="flex space-x-4">
                    <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="hover:text-white transition-colors"><LinkedInIcon className="w-6 h-6" /></a>
                    <a href="https://www.x.com" target="_blank" rel="noopener noreferrer" aria-label="X" className="hover:text-white transition-colors"><XSocialIcon className="w-6 h-6" /></a>
                    <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-white transition-colors"><InstagramIcon className="w-6 h-6" /></a>
                </div>
            </div>
        </div>
        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-[--border-color] text-center text-sm">
            <p>&copy; {new Date().getFullYear()} Bridgehead by Shanks. All rights reserved. | <a href="#" className="hover:text-white">Terms of Service</a> | <a href="#" className="hover:text-white">Privacy Policy</a></p>
        </div>
    </footer>
);

export default Footer;
