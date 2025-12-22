import React from 'react';
import { XIcon, TrashIcon, SparklesIcon, CheckCircleIcon } from './icons';

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
    cancelText = 'Cancel'
}) => {
    if (!isOpen) return null;

    const isDelete = type === 'delete';
    const isSuccess = type === 'success';

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-md mx-4 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-scale-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`p-6 text-center ${isSuccess ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/30' : ''}`}>
                    {/* Icon */}
                    <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDelete
                            ? 'bg-red-500/10 border-2 border-red-500/30'
                            : 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/30'
                        }`}>
                        {isDelete ? (
                            <TrashIcon className="w-8 h-8 text-red-500" />
                        ) : (
                            <div className="relative">
                                <CheckCircleIcon className="w-8 h-8 text-green-400" />
                                <SparklesIcon className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
                            </div>
                        )}
                    </div>

                    {/* Title */}
                    <h3 className={`text-xl font-bold mb-2 ${isDelete ? 'text-white' : 'text-green-400'}`}>
                        {title}
                    </h3>

                    {/* Message */}
                    <p className="text-gray-400 text-sm leading-relaxed">
                        {message}
                    </p>

                    {/* Celebration particles for success */}
                    {isSuccess && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            <div className="absolute top-4 left-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                            <div className="absolute top-8 right-1/4 w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            <div className="absolute top-6 left-1/3 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                            <div className="absolute top-10 right-1/3 w-1.5 h-1.5 bg-lime-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="p-4 bg-white/5 border-t border-white/10 flex gap-3">
                    {isDelete ? (
                        <>
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-3 rounded-lg font-medium text-gray-300 bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={onConfirm}
                                className="flex-1 px-4 py-3 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <TrashIcon className="w-4 h-4" />
                                {confirmText || 'Delete'}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onConfirm}
                            className="w-full px-4 py-3 rounded-lg font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 transition-all flex items-center justify-center gap-2"
                        >
                            <CheckCircleIcon className="w-5 h-5" />
                            {confirmText || 'Great!'}
                        </button>
                    )}
                </div>

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <XIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default ConfirmationModal;
