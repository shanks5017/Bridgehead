import React from 'react';
import { XIcon, TrashIcon, CheckCircleIcon } from './icons';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    type: 'delete' | 'success';
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    type,
    title,
    message,
    confirmText,
    cancelText = 'ABORT'
}) => {
    if (!isOpen) return null;

    const isDelete = type === 'delete';

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-foundation/90 backdrop-blur-sm animate-fade-in p-6"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-md bg-white border border-ink neo-shadow-lg animate-slide-up overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Visual Indicator Line */}
                <div className={`h-2 w-full ${isDelete ? 'bg-accent-blue' : 'bg-accent-green'} border-b border-ink`} />

                <div className="p-8 space-y-6">
                    {/* Header Area */}
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 border border-ink flex items-center justify-center ${isDelete ? 'bg-accent-blue/10' : 'bg-accent-green/10'}`}>
                            {isDelete ? <TrashIcon className="w-6 h-6 text-accent-blue" /> : <CheckCircleIcon className="w-6 h-6 text-accent-green" />}
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-2xl font-serif-italic font-bold tracking-tight uppercase leading-none">
                                {title}
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${isDelete ? 'bg-accent-blue' : 'bg-accent-green'}`} />
                                <span className="text-[10px] font-mono tracking-widest uppercase opacity-50 font-bold">Protocol Confirmation</span>
                            </div>
                        </div>
                    </div>

                    {/* Message Body */}
                    <p className="text-sm font-medium leading-relaxed opacity-70">
                        {message}
                    </p>

                    {/* Action Block */}
                    <div className="flex gap-3 pt-4 border-t border-ink/5">
                        <button
                            onClick={onClose}
                            className="neo-button flex-1 py-4 text-xs font-bold"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`neo-button flex-1 py-4 text-xs font-bold ${isDelete ? 'bg-accent-blue text-white' : 'bg-accent-green text-white'}`}
                        >
                            {confirmText || (isDelete ? 'CONFIRM DELETE' : 'ACKNOWLEDGE')}
                        </button>
                    </div>
                </div>

                {/* Corner Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 border border-ink flex items-center justify-center hover:bg-foundation transition-all active:translate-y-px"
                >
                    <XIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default ConfirmationModal;
