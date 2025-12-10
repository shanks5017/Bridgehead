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
}

export const FileInput: React.FC<FileInputProps> = ({ label, onFilesSelected, imagePreviews, ...props }) => {
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
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {imagePreviews.map((src, index) => (
            <img key={index} src={src} alt={`Preview ${index}`} className="w-full h-24 object-cover rounded-lg" />
          ))}
        </div>
      )}
    </div>
  );
};