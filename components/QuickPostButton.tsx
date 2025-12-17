import React, { useState } from 'react';
import { View } from '../types';
import { PlusIcon } from './icons';

interface QuickPostButtonProps {
    setView: (view: View) => void;
    isChatbotOpen: boolean;
}

const QuickPostButton: React.FC<QuickPostButtonProps> = ({ setView, isChatbotOpen }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handlePostDemand = () => {
        setView(View.POST_DEMAND);
        setIsExpanded(false);
    };

    const handlePostRental = () => {
        setView(View.POST_RENTAL);
        setIsExpanded(false);
    };

    // Hide the button when chatbot is open
    if (isChatbotOpen) return null;

    return (
        <div className="fixed bottom-24 right-6 z-[70] flex flex-col-reverse items-end gap-3">
            {/* Expanded Options */}
            {isExpanded && (
                <>
                    <button
                        onClick={handlePostRental}
                        className="flex items-center gap-3 bg-[--card-color] border border-[--border-color] text-white px-5 py-3 rounded-full shadow-lg hover:bg-[--primary-color] transition-all duration-300 animate-scale-in"
                    >
                        <span className="text-2xl">🏢</span>
                        <span className="font-semibold whitespace-nowrap">Post Rental</span>
                    </button>
                    <button
                        onClick={handlePostDemand}
                        className="flex items-center gap-3 bg-[--card-color] border border-[--border-color] text-white px-5 py-3 rounded-full shadow-lg hover:bg-[--primary-color] transition-all duration-300 animate-scale-in"
                    >
                        <span className="text-2xl">📢</span>
                        <span className="font-semibold whitespace-nowrap">Post Demand</span>
                    </button>
                </>
            )}

            {/* Main Toggle Button - Same size as chatbot */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-16 h-16 rounded-full shadow-xl flex items-center justify-center text-white bg-red-500 hover:bg-red-600 transition-all duration-300"
                aria-label="Quick post actions"
            >
                <PlusIcon className={`w-8 h-8 transition-transform duration-300 ${isExpanded ? 'rotate-45' : ''}`} />
            </button>

            {/* Backdrop */}
            {isExpanded && (
                <div
                    className="fixed inset-0 bg-black/20 -z-10"
                    onClick={() => setIsExpanded(false)}
                />
            )}
        </div>
    );
};

export default QuickPostButton;
