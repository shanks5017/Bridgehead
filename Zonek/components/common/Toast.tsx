import React from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
    const typeStyles = {
        success: 'bg-gradient-to-br from-green-900/95 to-green-800/95 border-green-600',
        error: 'bg-gradient-to-br from-red-900/95 to-red-800/95 border-red-600',
        warning: 'bg-gradient-to-br from-yellow-900/95 to-yellow-800/95 border-yellow-600',
        info: 'bg-gradient-to-br from-blue-900/95 to-blue-800/95 border-blue-600'
    };

    const icons = {
        success: <CheckCircleIcon className="w-6 h-6 text-green-400" />,
        error: <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />,
        warning: <ExclamationTriangleIcon className="w-6 h-6 text-yellow-400" />,
        info: <InformationCircleIcon className="w-6 h-6 text-blue-400" />
    };

    return (
        <div className="fixed top-4 right-4 z-[9999] animate-slideIn">
            <div className={`${typeStyles[type]} border-2 rounded-lg shadow-2xl backdrop-blur-sm p-4 min-w-[320px] max-w-md`}>
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                        {icons[type]}
                    </div>
                    <div className="flex-1 text-white">
                        <p className="font-medium leading-relaxed">{message}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex-shrink-0 text-white/70 hover:text-white transition-colors"
                        aria-label="Close notification"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Toast;
