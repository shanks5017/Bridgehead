import React, { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '../icons';

const baseInputStyle = "w-full bg-transparent border-2 border-[--border-color] rounded-lg px-4 py-3 placeholder-[--text-secondary] focus:outline-none focus:ring-2 focus:ring-[--primary-color] focus:border-transparent transition-all duration-300";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input: React.FC<InputProps> = ({ label, type, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);

  if (type !== 'password') {
    return (
      <div className="w-full">
        <label className="block text-sm font-medium text-[--text-secondary] mb-2">{label}</label>
        <input {...props} type={type} className={baseInputStyle} />
      </div>
    );
  }

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-[--text-secondary] mb-2">{label}</label>
      <div className="relative">
        <input
          {...props}
          type={showPassword ? 'text' : 'password'}
          className={`${baseInputStyle} pr-12`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 flex items-center px-4 text-[--text-secondary] hover:text-white transition-colors"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeSlashIcon className="w-5 h-5" />
          ) : (
            <EyeIcon className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
};


interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, ...props }) => (
  <div className="w-full">
    <label className="block text-sm font-medium text-[--text-secondary] mb-2">{label}</label>
    <textarea {...props} className={`${baseInputStyle} h-32 resize-none`} />
  </div>
);

interface FileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  onFilesSelected: (files: File[]) => void;
  imagePreviews: string[];
  onRemoveImage?: (index: number) => void; // New prop for removing images
}

export const FileInput: React.FC<FileInputProps> = ({ label, onFilesSelected, imagePreviews, onRemoveImage, ...props }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-[--text-secondary] mb-2">{label}</label>
      <div className="w-full h-32 border-2 border-dashed border-[--border-color] rounded-lg flex items-center justify-center text-[--text-secondary] hover:border-[--primary-color] transition-all duration-300 relative">
        <input type="file" multiple {...props} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} />
        <span>Click or drag files to upload</span>
      </div>
      {imagePreviews.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {imagePreviews.map((src, index) => (
            <div key={index} className="relative group">
              <img
                src={src}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border-2 border-[--border-color]"
              />
              {onRemoveImage && (
                <button
                  type="button"
                  onClick={() => onRemoveImage(index)}
                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
                  aria-label={`Remove image ${index + 1}`}
                >
                  ✕
                </button>
              )}
              <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};