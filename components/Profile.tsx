
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { Input, TextArea } from './common/FormComponents';
import { UserCircleIcon, VerifiedIcon, PencilIcon, CameraIcon, EnvelopeIcon, PhoneIcon, LoadingSpinner, LinkIcon } from './icons';

interface ProfileProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

type ResendStatus = 'idle' | 'sending' | 'sent';

const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<User>(user);
  const [profilePicPreview, setProfilePicPreview] = useState<string | undefined>(user.profilePicture);
  const [copyLinkText, setCopyLinkText] = useState('Copy Profile Link');
  const [emailResendStatus, setEmailResendStatus] = useState<ResendStatus>('idle');
  const [phoneResendStatus, setPhoneResendStatus] = useState<ResendStatus>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Reset form data if the user prop changes (e.g., on sign out/in)
    setFormData(user);
    setProfilePicPreview(user.profilePicture);
    setEmailResendStatus('idle');
    setPhoneResendStatus('idle');
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfilePicPreview(base64String);
        setFormData(prev => ({ ...prev, profilePicture: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = () => {
    onUpdateUser(formData);
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setFormData(user);
    setProfilePicPreview(user.profilePicture);
    setIsEditing(false);
  };

  const handleResendVerification = (type: 'email' | 'phone') => {
    const setStatus = type === 'email' ? setEmailResendStatus : setPhoneResendStatus;
    setStatus('sending');
    // Simulate API call for sending
    setTimeout(() => {
        setStatus('sent');
        // Revert back to idle after a while to allow another resend
        setTimeout(() => setStatus('idle'), 5000);
    }, 1500);
  };
  
  const handleCopyLink = () => {
    const profileUrl = `${window.location.origin}/profile/${user.id}`;
    navigator.clipboard.writeText(profileUrl).then(() => {
        setCopyLinkText('Copied!');
        setTimeout(() => setCopyLinkText('Copy Profile Link'), 2000);
    });
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="bg-[--card-color] border border-[--border-color] rounded-xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Profile Picture and Name */}
                <div className="md:col-span-1 flex flex-col items-center text-center">
                    <div className="relative w-32 h-32 mb-4 group">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleProfilePicChange}
                            accept="image/*"
                            className="hidden"
                        />
                        {profilePicPreview ? (
                            <img src={profilePicPreview} alt={formData.name} className="w-full h-full object-cover rounded-full border-4 border-[--border-color]" />
                        ) : (
                            <UserCircleIcon className="w-full h-full text-[--text-secondary]" />
                        )}
                        {isEditing && (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Change profile picture"
                            >
                                <CameraIcon className="w-8 h-8" />
                            </button>
                        )}
                    </div>
                    {isEditing ? (
                        <Input
                            label=""
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="text-2xl font-bold text-center bg-transparent border-0 border-b-2 rounded-none"
                        />
                    ) : (
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold">{formData.name}</h1>
                            {(formData.isEmailVerified || formData.isPhoneVerified) && (
                                <VerifiedIcon className="w-6 h-6 text-blue-400" title="Verified User" />
                            )}
                        </div>
                    )}
                    <p className="text-[--text-secondary]">{formData.email}</p>
                </div>

                {/* Right Column: Details and Form */}
                <div className="md:col-span-2 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold mb-2">About Me</h2>
                        {isEditing ? (
                            <TextArea
                                label=""
                                name="bio"
                                value={formData.bio || ''}
                                onChange={handleInputChange}
                                placeholder="Tell us a little about yourself..."
                                rows={4}
                            />
                        ) : (
                            <p className="text-[--text-secondary] italic">
                                {formData.bio || 'No bio provided.'}
                            </p>
                        )}
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
                        <div className="space-y-4">
                             {/* Email Verification */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <EnvelopeIcon className="w-5 h-5 text-[--text-secondary]" />
                                    <span>{formData.email}</span>
                                    {formData.isEmailVerified ? (
                                        <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Verified</span>
                                    ) : (
                                        <span className="text-xs font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full">Not Verified</span>
                                    )}
                                </div>
                                {!formData.isEmailVerified && (
                                    <>
                                        {emailResendStatus === 'idle' && (
                                            <button onClick={() => handleResendVerification('email')} className="text-sm text-blue-400 hover:underline">Resend Verification</button>
                                        )}
                                        {emailResendStatus === 'sending' && (
                                            <span className="text-sm text-yellow-400 flex items-center gap-1"><LoadingSpinner className="w-4 h-4" /> Sending...</span>
                                        )}
                                        {emailResendStatus === 'sent' && (
                                            <span className="text-sm text-green-400">Verification Sent!</span>
                                        )}
                                    </>
                                )}
                            </div>
                            
                            {/* Phone Verification */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <PhoneIcon className="w-5 h-5 text-[--text-secondary]" />
                                    {isEditing ? (
                                        <Input
                                            label=""
                                            name="phone"
                                            value={formData.phone || ''}
                                            onChange={handleInputChange}
                                            placeholder="Add phone number"
                                            className="text-base py-1"
                                        />
                                    ) : (
                                        <span>{formData.phone || 'Not provided'}</span>
                                    )}
                                     {!isEditing && (
                                        formData.isPhoneVerified ? (
                                            <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Verified</span>
                                        ) : formData.phone && (
                                            <span className="text-xs font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full">Not Verified</span>
                                        )
                                    )}
                                </div>
                                {!isEditing && !formData.isPhoneVerified && formData.phone && (
                                    <>
                                        {phoneResendStatus === 'idle' && (
                                            <button onClick={() => handleResendVerification('phone')} className="text-sm text-blue-400 hover:underline">Resend Verification</button>
                                        )}
                                        {phoneResendStatus === 'sending' && (
                                            <span className="text-sm text-yellow-400 flex items-center gap-1"><LoadingSpinner className="w-4 h-4" /> Sending...</span>
                                        )}
                                        {phoneResendStatus === 'sent' && (
                                            <span className="text-sm text-green-400">Verification Sent!</span>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-4 pt-4 border-t border-[--border-color]">
                        {isEditing ? (
                            <>
                                <button onClick={handleCancel} className="px-4 py-2 rounded-md text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-colors">
                                    Cancel
                                </button>
                                <button onClick={handleSaveChanges} className="px-4 py-2 rounded-md text-sm font-medium bg-[--primary-color] text-white hover:opacity-90 transition-opacity">
                                    Save Changes
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={handleCopyLink} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-colors">
                                    <LinkIcon className="w-4 h-4" />
                                    {copyLinkText}
                                </button>
                                <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-colors">
                                    <PencilIcon className="w-4 h-4" />
                                    Edit Profile
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
