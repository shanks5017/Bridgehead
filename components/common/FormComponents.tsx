import React, { useState } from 'react';
import { EyeIcon, EyeSlashIcon, XIcon } from '../icons';

const baseInputStyle = "w-full bg-white border border-ink px-4 py-4 placeholder-ink/30 focus:outline-none focus:border-accent-blue transition-all duration-200 font-medium text-sm";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, type, className = '', ...props }) => {
  const [showPassword, setShowPassword] = useState(false);

  const renderLabel = () => label && (
    <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.4em] opacity-40 mb-2 px-1">
        {label}
    </label>
  );

  if (type !== 'password') {
    return (
      <div className="w-full group">
        {renderLabel()}
        <input {...props} type={type} className={`${baseInputStyle} ${className}`} />
      </div>
    );
  }

  return (
    <div className="w-full group">
      {renderLabel()}
      <div className="relative">
        <input
          {...props}
          type={showPassword ? 'text' : 'password'}
          className={`${baseInputStyle} pr-12 ${className}`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 flex items-center px-4 text-ink opacity-40 hover:opacity-100 transition-opacity"
        >
          {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};


interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, className = '', ...props }) => (
  <div className="w-full group">
    {label && (
        <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.4em] opacity-40 mb-2 px-1">
            {label}
        </label>
    )}
    <textarea {...props} className={`${baseInputStyle} min-h-[120px] resize-none ${className}`} />
  </div>
);

interface FileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  onFilesSelected: (files: File[]) => void;
  imagePreviews: string[];
  onRemoveImage?: (index: number) => void;
}

export const FileInput: React.FC<FileInputProps> = ({ label, onFilesSelected, imagePreviews, onRemoveImage, ...props }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.4em] opacity-40 mb-2 px-1">
            {label}
        </label>
      )}
      <div className="w-full h-40 border border-ink border-dashed bg-foundation/30 flex flex-col items-center justify-center text-ink/40 hover:bg-foundation/50 transition-all relative group cursor-pointer">
        <input type="file" multiple {...props} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} />
        <div className="p-4 border border-ink/20 bg-white mb-2 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
        </div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Deploy Media Assets</span>
      </div>
      
      {imagePreviews.length > 0 && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {imagePreviews.map((src, index) => (
            <div key={index} className="relative aspect-square border border-ink bg-white p-1 neo-shadow-sm group">
              <img
                src={src}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all"
              />
              {onRemoveImage && (
                <button
                  type="button"
                  onClick={() => onRemoveImage(index)}
                  className="absolute top-2 right-2 bg-accent-blue text-white w-8 h-8 border border-ink flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all active:translate-y-px shadow-sm"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              )}
              <div className="absolute bottom-2 left-2 bg-white border border-ink text-[8px] font-mono font-bold px-1.5 py-0.5 uppercase tracking-tighter">
                REF_{index + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};