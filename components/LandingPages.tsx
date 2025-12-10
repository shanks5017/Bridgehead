
import React from 'react';

export const EmptyState: React.FC<{ title: string; message: string }> = ({ title, message }) => (
  <div className="text-center py-20">
    <h3 className="text-2xl font-semibold text-white mb-2">{title}</h3>
    <p className="text-[--text-secondary]">{message}</p>
  </div>
);

export const LoadingState: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 border-4 border-t-[--primary-color] border-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-lg text-[--text-secondary]">{message}</p>
    </div>
);
