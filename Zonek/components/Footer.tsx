
import React from 'react';
import { LinkedInIcon, XSocialIcon, InstagramIcon } from './icons';
import { View } from '../types';

interface FooterProps {
    setView: (view: View) => void;
    onNavigateToAIAssistant: () => void;
}

const FooterLink: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
    <li>
        <button 
            onClick={onClick} 
            className="text-sm font-bold uppercase tracking-widest text-foundation/40 hover:text-white transition-all text-left"
        >
            {children}
        </button>
    </li>
);

const Footer: React.FC<FooterProps> = ({ setView, onNavigateToAIAssistant }) => (
    <footer id="page-footer" className="bg-ink text-foundation py-32 px-6 md:px-12 border-t-[1px] relative overflow-hidden" style={{ borderTopColor: '#E4E3E0' }}>
        {/* Subtle Brand Watermark */}
        <div className="absolute -bottom-20 -right-20 text-[20rem] font-serif-italic font-black text-white/[0.02] select-none pointer-events-none uppercase">ZK</div>
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 md:gap-24 relative z-10">
            {/* Branding Column */}
            <div className="col-span-1 md:col-span-1 space-y-8">
                <div className="flex items-center gap-3">
                    <h3 className="text-3xl font-serif-italic font-black tracking-tighter uppercase leading-none text-white">ZONEK</h3>
                    <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" title="SYSTEM_OPERATIONAL" />
                </div>
                <p className="text-sm font-bold uppercase tracking-tight leading-relaxed opacity-40 max-w-xs italic">
                    Bridging community signals with entrepreneurial spirit. <br/>
                    The neighborhood marketplace infrastructure.
                </p>
                <div className="pt-4 flex space-x-8 items-center border-t border-foundation/10">
                    <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="opacity-40 hover:opacity-100 transition-opacity"><LinkedInIcon className="w-5 h-5" /></a>
                    <a href="https://www.x.com" target="_blank" rel="noopener noreferrer" aria-label="X" className="opacity-40 hover:opacity-100 transition-opacity"><XSocialIcon className="w-5 h-5" /></a>
                    <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="opacity-40 hover:opacity-100 transition-opacity"><InstagramIcon className="w-5 h-5" /></a>
                </div>
            </div>

            {/* Navigation Column */}
            <div className="space-y-10">
                <h4 className="text-[10px] font-mono font-black text-white/20 uppercase tracking-[0.5em]">Navigation</h4>
                <ul className="space-y-4">
                    <FooterLink onClick={() => setView(View.HOME)}>Home</FooterLink>
                    <FooterLink onClick={() => setView(View.FEED)}>Activity Feed</FooterLink>
                    <FooterLink onClick={() => setView(View.DEMAND_FEED)}>Opportunities</FooterLink>
                    <FooterLink onClick={() => setView(View.COMMUNITY_FEED)}>Signal Hub</FooterLink>
                </ul>
            </div>

            {/* Tools Column */}
            <div className="space-y-10">
                <h4 className="text-[10px] font-mono font-black text-white/20 uppercase tracking-[0.5em]">Operational</h4>
                <ul className="space-y-4">
                    <FooterLink onClick={() => setView(View.AI_SUGGESTIONS)}>Market Intelligence</FooterLink>
                    <FooterLink onClick={() => setView(View.AI_MATCHES)}>Linkage Engine</FooterLink>
                    <FooterLink onClick={() => setView(View.RENTAL_LISTINGS)}>Asset Registry</FooterLink>
                    <FooterLink onClick={onNavigateToAIAssistant}>Tactical Assistant</FooterLink>
                </ul>
            </div>

            {/* Network Column */}
            <div className="space-y-10">
                <h4 className="text-[10px] font-mono font-black text-white/20 uppercase tracking-[0.5em]">Network</h4>
                <ul className="space-y-4">
                    <FooterLink onClick={() => {}}>Support Protocol</FooterLink>
                    <FooterLink onClick={() => {}}>Developer API</FooterLink>
                    <FooterLink onClick={() => {}}>Enterprise Access</FooterLink>
                    <FooterLink onClick={() => {}}>Partner Network</FooterLink>
                </ul>
            </div>
        </div>

        {/* Legal Strip */}
        <div className="max-w-7xl mx-auto mt-32 pt-12 border-t border-foundation/10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] opacity-20">
                &copy; {new Date().getFullYear()} ZONEK NETWORK · SYSTEM OPERATIONAL
            </div>
            <div className="flex items-center gap-12">
                <a href="#" className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-20 hover:opacity-100 transition-opacity">Terms_of_Service</a>
                <a href="#" className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-20 hover:opacity-100 transition-opacity">Privacy_Policy</a>
                <a href="#" className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-20 hover:opacity-100 transition-opacity">Accessibility_Manifest</a>
            </div>
        </div>
    </footer>
);

export default Footer;
