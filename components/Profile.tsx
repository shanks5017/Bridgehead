import React, { useState, useEffect, useRef } from 'react';
import { User, View, DemandPost, RentalPost, CommunityPost, Conversation } from '../types';
import { compressImage } from '../utils/imageUtils';
import DemandDetailModal from './DemandDetailModal';
import RentalDetailModal from './RentalDetailModal';
import PostDemandForm from './PostDemandForm';
import PostRentalForm from './PostRentalForm';
import ConfirmationModal from './ConfirmationModal';
import { Input, TextArea } from './common/FormComponents';
import {
    UserCircleIcon,
    VerifiedIcon,
    PencilIcon,
    CameraIcon,
    LinkIcon,
    BriefcaseIcon,
    BuildingOfficeIcon,
    ChatBubbleLeftRightIcon,
    SparklesIcon,
    PlusIcon,
    HeartIcon,
    ChatBubbleLeftIcon,
    LocationPinIcon,
    ArrowRightIcon,
    EnvelopeIcon,
    PhoneIcon,
    LightBulbIcon,
    UsersIcon,
    XIcon,
    RotateLeftIcon,
    CheckIcon
} from './icons';

interface ProfileProps {
    user: User;
    onUpdateUser: (user: User) => void;
    setView: (view: View) => void;
    demandPosts: DemandPost[];
    rentalPosts: RentalPost[];
    communityPosts: CommunityPost[];
    conversations: Conversation[];
    updateDemandPost?: (id: string, post: Partial<DemandPost>) => void;
    updateRentalPost?: (id: string, post: Partial<RentalPost>) => void;
    deleteDemandPost?: (id: string) => void;
    deleteRentalPost?: (id: string) => void;
    markDemandSolved?: (id: string) => void;
    markRentalRented?: (id: string) => void;
}

type ResendStatus = 'idle' | 'sending' | 'sent';
type Tab = 'demands' | 'rentals' | 'community' | 'collaborations';

// --- PREMIUM IMAGE EDITOR MODAL ---
interface ImageEditorProps {
    imageSrc: string;
    onSave: (finalBase64: string) => void;
    onClose: () => void;
}

const ImageEditorModal: React.FC<ImageEditorProps> = ({ imageSrc, onSave, onClose }) => {
    const [rotation, setRotation] = useState(0);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [showDiscardAlert, setShowDiscardAlert] = useState(false);

    // Canvas & Image Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);

    // Initial Load
    useEffect(() => {
        const img = new Image();
        // Allow cross-origin access for canvas operations
        img.crossOrigin = 'anonymous';
        img.src = imageSrc;
        img.onload = () => setOriginalImage(img);
        img.onerror = (err) => console.error('Image load error:', err);
    }, [imageSrc]);

    const handleRotate = () => {
        setRotation((prev) => (prev - 90) % 360);
    };

    // --- DRAG LOGIC ---
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - startPos.x,
            y: e.clientY - startPos.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Also handle touch for mobile "10/10" experience
    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        setStartPos({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        setPosition({
            x: e.touches[0].clientX - startPos.x,
            y: e.touches[0].clientY - startPos.y
        });
    };

    const handleSave = () => {
        if (!originalImage) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Output size (Resolution of the saved image)
        const size = 400;
        canvas.width = size;
        canvas.height = size;

        // Preview Settings (Must match CSS)
        const previewSize = 256;

        // 1. Calculate Base Scale (How much the image is 'fitted' in the preview initially)
        // In CSS we set:
        // width: w > h ? 'auto' : '256px' -> means height = 256 (if w > h)
        // height: h > w ? 'auto' : '256px' -> means width = 256 (if h > w)
        // So the "smaller dimension" matches the previewSize.
        let baseScale = 1;
        if (originalImage.width > originalImage.height) {
            // Landscape: Height matches box (256), Width is auto
            // Visual Height = 256. Native Height = originalImage.height
            // Scale = 256 / originalImage.height.
            // But we want to map this to our Target "size" (400).
            // So we want Visual Height on Canvas = 400.
            baseScale = size / originalImage.height;
        } else {
            // Portrait/Square: Width matches box
            baseScale = size / originalImage.width;
        }

        // 2. Clear & Background
        ctx.fillStyle = '#000'; // Default bg
        ctx.fillRect(0, 0, size, size);

        // 3. Setup Coordinate System
        // Move to Center
        ctx.translate(size / 2, size / 2);

        // 4. Transform Matching (Order is Critical: Translate -> Rotate -> Scale)

        // TRANSLATION:
        // The 'position' state is in Preview Pixels (relative to the 256px box).
        // We need to scale this translation to our Output Pixels (400px box).
        const ratio = size / previewSize;
        ctx.translate(position.x * ratio, position.y * ratio);

        // ROTATION:
        ctx.rotate((rotation * Math.PI) / 180);

        // SCALE:
        // Combined Scale = Base Scale (fitting to box) * User Scale (slider)
        const totalScale = baseScale * scale;
        ctx.scale(totalScale, totalScale);

        // 5. Draw Image Centered
        // Since we are now in the transformed coordinate space where 1 unit = 1 pixel of the image (scaled),
        // we just draw the image centered.
        ctx.drawImage(originalImage, -originalImage.width / 2, -originalImage.height / 2);

        const base64 = canvas.toDataURL('image/jpeg', 0.9);
        onSave(base64);
    };

    const handleCloseAttempt = () => {
        if (rotation !== 0 || scale !== 1 || position.x !== 0 || position.y !== 0) {
            setShowDiscardAlert(true);
        } else {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            {/* Main Editor Card */}
            <div className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                    <h3 className="text-lg font-bold text-white tracking-wide">Edit Profile Picture</h3>
                    <button onClick={handleCloseAttempt} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Preview Area (Interactive) */}
                <div className="flex-1 bg-[#1a1a1a] p-8 flex items-center justify-center overflow-hidden relative select-none"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleMouseUp}
                >
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                    {/* Image Layer (Bottom) */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div style={{ width: '256px', height: '256px' }} className="flex items-center justify-center">
                            {originalImage && (
                                <img
                                    src={imageSrc}
                                    alt="Edit"
                                    draggable={false}
                                    style={{
                                        transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${scale})`,
                                        transition: isDragging ? 'none' : 'transform 0.2s',
                                        maxWidth: 'none',
                                        maxHeight: 'none',
                                        // Initial sizing
                                        width: originalImage.width > originalImage.height ? 'auto' : '256px',
                                        height: originalImage.height > originalImage.width ? 'auto' : '256px'
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    {/* Viewport Mask (Overlay - Top) */}
                    {/* Removed bg-black, kept border and shadow for the focus effect */}
                    <div className="relative z-10 w-64 h-64 rounded-full border-4 border-white/20 shadow-[0_0_0_9999px_rgba(0,0,0,0.8)] pointer-events-none"></div>
                </div>

                {/* Controls */}
                <div className="p-6 bg-[#0a0a0a] border-t border-white/10 space-y-6 shrink-0 z-20">

                    {/* Sliders & Tools */}
                    <div className="flex items-center justify-between gap-6">
                        {/* Zoom Slider */}
                        <div className="flex-1 flex items-center gap-3">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Zoom</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="3"
                                step="0.1"
                                value={scale}
                                onChange={(e) => setScale(parseFloat(e.target.value))}
                                className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer hover:bg-white/20 accent-[--primary-color]"
                            />
                        </div>

                        <div className="w-px h-8 bg-white/10"></div>

                        {/* Rotate Button */}
                        <button
                            onClick={handleRotate}
                            className="flex flex-col items-center gap-1 group"
                            title="Rotate 90°"
                        >
                            <div className="p-2 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 group-hover:border-white/30 transition-all text-gray-300 group-hover:text-white">
                                <RotateLeftIcon className="w-5 h-5 transform group-hover:-rotate-90 transition-transform duration-300" />
                            </div>
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleCloseAttempt}
                            className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white transition-all border border-transparent hover:border-white/10"
                        >
                            Discard
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-lg shadow-red-900/20 hover:shadow-red-900/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                        >
                            <CheckIcon className="w-5 h-5" /> Save
                        </button>
                    </div>
                </div>

                {/* Discard Alert Popup (Nested) */}
                {showDiscardAlert && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-6">
                        <div className="bg-[#151515] border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center animate-scale-up">
                            <h4 className="text-lg font-bold text-white mb-2">Discard Changes?</h4>
                            <p className="text-gray-400 text-sm mb-6">You have unsaved changes. Are you sure you want to discard them?</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDiscardAlert(false)}
                                    className="flex-1 py-2 rounded-lg text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-colors"
                                >
                                    Keep Editing
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-2 rounded-lg text-sm font-bold bg-red-600/10 text-red-500 border border-red-600/20 hover:bg-red-600 hover:text-white transition-all"
                                >
                                    Discard
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


const Profile: React.FC<ProfileProps> = ({
    user,
    onUpdateUser,
    setView,
    demandPosts,
    rentalPosts,
    communityPosts,
    conversations,
    updateDemandPost,
    updateRentalPost,
    deleteDemandPost,
    deleteRentalPost,
    markDemandSolved,
    markRentalRented
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<User>(user);
    const [profilePicPreview, setProfilePicPreview] = useState<string | undefined>(user.profilePicture);
    const [copyLinkText, setCopyLinkText] = useState('Copy Profile Link');
    const [activeTab, setActiveTab] = useState<Tab>('demands');

    // Image Editor State
    const [isImageEditorOpen, setIsImageEditorOpen] = useState(false);
    const [isPhotoOptionsOpen, setIsPhotoOptionsOpen] = useState(false);
    const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // View/Edit Demand Modal State
    const [viewingDemand, setViewingDemand] = useState<DemandPost | null>(null);
    const [viewingRental, setViewingRental] = useState<RentalPost | null>(null);
    const [editingDemand, setEditingDemand] = useState<DemandPost | null>(null);
    const [editingRental, setEditingRental] = useState<RentalPost | null>(null);

    // Confirmation Modal State
    const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'demand' | 'rental', id: string } | null>(null);
    const [solvedSuccess, setSolvedSuccess] = useState<{ type: 'demand' | 'rental', id: string } | null>(null);

    // --- REAL DATA FILTERING ---
    const myCommunityPosts = communityPosts.filter(post =>
        post.author === user.name || post.username === user.name ||
        post.username === `@${user.name.replace(/\s+/g, '').toLowerCase()} `
    );
    const myDemands = demandPosts;

    // Aggregating Metrics
    const metrics = {
        activePosts: myDemands.length + rentalPosts.length,
        communityImpact: myCommunityPosts.reduce((acc, curr) => acc + (curr.likes || 0), 0),
        connections: conversations.length
    };

    useEffect(() => {
        setFormData(user);
        setProfilePicPreview(user.profilePicture);
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 1. Triggered by "Upload Image" choice
    const handleUploadClick = () => {
        setIsPhotoOptionsOpen(false);
        fileInputRef.current?.click();
    };

    // 2. Triggered by "Edit Image" choice
    const handleEditCurrentClick = () => {
        setIsPhotoOptionsOpen(false);
        // Prefer original full image if available, else fallback to current display
        const imageToEdit = user.originalProfilePicture || profilePicPreview;

        if (imageToEdit) {
            setTempImageSrc(imageToEdit);
            setIsImageEditorOpen(true);
        }
    };

    // 3. File Selected -> Open Editor
    const handleProfilePicSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Create Object URL for preview (much faster than base64)
            const objectUrl = URL.createObjectURL(file);
            setTempImageSrc(objectUrl);

            // Store the original file for later upload
            setFormData(prev => ({
                ...prev,
                originalProfilePictureFile: file // Store the original file
            }));

            setIsImageEditorOpen(true);

            // Clear input so selecting same file works again
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleImageSave = async (finalBase64: string) => {
        try {
            // Convert cropped base64 to File object
            const croppedBlob = await fetch(finalBase64).then(r => r.blob());
            const croppedFile = new File([croppedBlob], 'profile_cropped.jpg', { type: 'image/jpeg' });

            // Create preview URL for display
            const previewUrl = URL.createObjectURL(croppedBlob);
            setProfilePicPreview(previewUrl);

            // Store BOTH files for upload - cropped and original
            setFormData(prev => ({
                ...prev,
                profilePictureFile: croppedFile, // Cropped version for display
                // originalProfilePictureFile is already set in handleProfilePicSelect
            }));

            // Cleanup
            setIsImageEditorOpen(false);
            if (tempImageSrc?.startsWith('blob:')) {
                URL.revokeObjectURL(tempImageSrc); // Free memory
            }
            setTempImageSrc(null);
        } catch (error) {
            console.error('Error saving image:', error);
        }
    };

    const handleImageDiscard = () => {
        setIsImageEditorOpen(false);
        // Cleanup object URL to prevent memory leaks
        if (tempImageSrc?.startsWith('blob:')) {
            URL.revokeObjectURL(tempImageSrc);
        }
        setTempImageSrc(null);
    };

    const handleSaveChanges = () => {
        onUpdateUser(formData);
        setIsEditing(false);
    };

    const handleCopyLink = () => {
        const profileUrl = `${window.location.origin} /profile/${user.id} `;
        navigator.clipboard.writeText(profileUrl).then(() => {
            setCopyLinkText('Copied!');
            setTimeout(() => setCopyLinkText('Copy Profile Link'), 2000);
        });
    };

    const EmptyState = ({ category, action }: { category: string, action: () => void }) => (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 bg-[--card-color] rounded-full mb-4 border border-[--border-color] shadow-lg">
                <PlusIcon className="w-8 h-8 text-[--text-secondary]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No {category} Yet</h3>
            <p className="text-[--text-secondary] mb-6 max-w-xs mx-auto">Share your needs or properties with the community.</p>
            <button
                onClick={action}
                className="px-6 py-2.5 bg-[--primary-color] text-white font-medium rounded-full hover:bg-red-600 transition-all shadow-[0_4px_14px_rgba(239,68,68,0.4)] hover:scale-105"
            >
                Post Your First {category}
            </button>
        </div>
    );

    return (
        <div className="min-h-screen pb-24 bg-black">

            {/* --- HERO SECTION (Minimalist & Premium) --- */}
            <div className="relative pt-12 pb-8 px-4 border-b border-white/10 bg-gradient-to-b from-[--card-color] to-black">
                <div className="container mx-auto max-w-4xl">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">

                        {/* Profile Picture */}
                        <div className="relative group shrink-0">
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-tr from-red-600 to-red-500 shadow-[0_0_20px_rgba(220,38,38,0.5)]">
                                <div className="w-full h-full rounded-full border-4 border-black overflow-hidden relative bg-gray-900 shadow-2xl">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleProfilePicSelect}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                    {profilePicPreview ? (
                                        <img src={profilePicPreview} alt={formData.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                            <UserCircleIcon className="w-20 h-20 text-gray-600" />
                                        </div>
                                    )}
                                    {isEditing && (
                                        <div
                                            onClick={() => setIsPhotoOptionsOpen(true)}
                                            className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm"
                                        >
                                            <CameraIcon className="w-8 h-8 text-white mb-1" />
                                            <span className="text-xs font-bold text-white tracking-wider">CHANGE</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Info Section */}
                        <div className="flex-1 text-center md:text-left w-full">

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                {isEditing ? (
                                    <Input
                                        label=""
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="text-2xl font-bold bg-white/5 border border-white/20 rounded-md px-3 py-1 text-white w-full md:w-auto"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center md:justify-start gap-2">
                                        <h1 className="text-2xl md:text-3xl font-bold text-white">{formData.name}</h1>
                                        {user.isEmailVerified && <VerifiedIcon className="w-5 h-5 text-blue-400" />}
                                    </div>
                                )}

                                <div className="flex items-center justify-center gap-3">
                                    {isEditing ? (
                                        <>
                                            <button onClick={() => { setIsEditing(false); setFormData(user); }} className="px-5 py-1.5 text-sm font-semibold text-white/70 hover:text-white transition-colors">
                                                Cancel
                                            </button>
                                            <button onClick={handleSaveChanges} className="px-5 py-1.5 text-sm font-semibold bg-white text-black rounded-lg hover:bg-gray-200 transition-colors shadow-lg hover:shadow-white/20">
                                                Save Profile
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => setIsEditing(true)} className="px-5 py-1.5 text-sm font-semibold bg-[--card-color] border border-[--border-color] text-white rounded-lg hover:bg-white/10 transition-colors">
                                                Edit Profile
                                            </button>
                                            <button onClick={handleCopyLink} className="p-2 bg-[--card-color] border border-[--border-color] text-white rounded-lg hover:bg-white/10 transition-colors">
                                                <LinkIcon className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center justify-center md:justify-start gap-8 md:gap-12 mb-6">
                                <div className="text-center md:text-left">
                                    <span className="font-bold text-white text-lg block">{metrics.activePosts}</span>
                                    <span className="text-sm text-gray-400">Posts</span>
                                </div>
                                <div className="text-center md:text-left">
                                    <span className="font-bold text-white text-lg block">{metrics.connections}</span>
                                    <span className="text-sm text-gray-400">Collaborations</span>
                                </div>
                                <div className="text-center md:text-left">
                                    <span className="font-bold text-white text-lg block">{metrics.communityImpact}</span>
                                    <span className="text-sm text-gray-400">Impact</span>
                                </div>
                            </div>

                            {/* Bio */}
                            {isEditing ? (
                                <TextArea
                                    label="Bio"
                                    name="bio"
                                    value={formData.bio || ''}
                                    onChange={handleInputChange}
                                    placeholder="Tell the community about yourself..."
                                    rows={3}
                                    className="bg-white/5 border border-white/20 rounded-md text-sm"
                                />
                            ) : (
                                <p className="text-sm md:text-base text-gray-200 leading-relaxed max-w-xl">
                                    {formData.bio || "No bio yet."}
                                    <span className="block mt-2 text-xs text-blue-400">{formData.email}</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- CONTENT NAVIGATION TABS --- */}
            <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-white/10">
                <div className="container mx-auto max-w-4xl px-4 py-2">
                    <div className="flex items-center justify-between md:justify-center overflow-x-auto gap-2 md:gap-4 hide-scrollbar">
                        {[
                            { id: 'demands', icon: LightBulbIcon, label: 'DEMANDS' },
                            { id: 'rentals', icon: BuildingOfficeIcon, label: 'RENTALS' },
                            { id: 'community', icon: UsersIcon, label: 'COMMUNITY' },
                            { id: 'collaborations', icon: ChatBubbleLeftRightIcon, label: 'COLLABS' },
                        ].map((item) => {
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id as Tab)}
                                    className={`group relative flex items-center gap-2 md:gap-3 px-4 py-2.5 rounded-full text-xs md:text-sm font-medium transition-all duration-300 overflow-hidden flex-1 md:flex-none justify-center
                                    ${isActive
                                            ? 'text-white bg-gradient-to-r from-red-600 via-red-500 to-red-600 shadow-lg shadow-red-500/50'
                                            : 'text-[--text-secondary] hover:text-white bg-white/5 hover:bg-white/10'
                                        }`}
                                    style={{
                                        background: isActive
                                            ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #dc2626 100%)'
                                            : undefined,
                                    }}
                                >
                                    {!isActive && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-500/20 to-red-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full"
                                            style={{
                                                backgroundSize: '200% 100%',
                                                animation: 'shimmer 2s infinite linear'
                                            }}
                                        />
                                    )}
                                    <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl bg-red-500/30" />
                                    <div className="relative z-10 transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                                        <item.icon className={`w-4 h-4 md:w-5 md:h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                                    </div>
                                    <span className="relative z-10 transform transition-all duration-300 group-hover:translate-x-1 whitespace-nowrap hidden md:inline">{item.label}</span>
                                    <span className="relative z-10 transform transition-all duration-300 md:hidden">{item.label}</span>
                                    {isActive && (
                                        <div className="absolute inset-0 opacity-30">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-shine" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* --- CONTENT GRID --- */}
            <div className="container mx-auto max-w-4xl px-4 py-8">

                {/* 1. DEMANDS TAB (List Style) */}
                {activeTab === 'demands' && (
                    <div className="animate-fade-in-up space-y-4">
                        {myDemands.length > 0 ? (
                            myDemands.map((post) => (
                                <div key={post.id} className="flex flex-col md:flex-row bg-[--card-color] border border-[--border-color] rounded-xl overflow-hidden hover:border-gray-500 transition-all cursor-pointer group">
                                    <div className="w-full md:w-48 h-48 md:h-auto bg-gray-800 shrink-0 relative overflow-hidden">
                                        {post.images && post.images.length > 0 ? (
                                            <img src={post.images[0]} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-600">
                                                <BriefcaseIcon className="w-12 h-12" />
                                            </div>
                                        )}
                                        <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded shadow">
                                            DEMAND
                                        </div>
                                    </div>

                                    <div className="p-5 flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="text-lg font-bold text-white group-hover:text-[--primary-color] transition-colors">{post.title}</h3>
                                                <div className="bg-blue-500/10 text-blue-400 text-xs font-bold px-2 py-1 rounded border border-blue-500/20">
                                                    {post.category}
                                                </div>
                                            </div>
                                            <p className="text-gray-400 text-sm line-clamp-2 mb-4">{post.description}</p>

                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <LocationPinIcon className="w-4 h-4" />
                                                    {post.location.address}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <HeartIcon className="w-4 h-4" />
                                                    {post.upvotes} Upvotes
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap justify-between items-center gap-2">
                                            <div className="flex gap-2">
                                                {post.status !== 'solved' && (
                                                    <button
                                                        onClick={() => setSolvedSuccess({ type: 'demand', id: post.id })}
                                                        className="px-3 py-1.5 text-xs font-medium text-green-400 bg-green-500/10 border border-green-500/20 rounded hover:bg-green-500/20 transition-colors"
                                                    >
                                                        🎉 Mark Solved
                                                    </button>
                                                )}
                                                {post.status === 'solved' && (
                                                    <span className="px-3 py-1.5 text-xs font-medium text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded">
                                                        ✓ Solved
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setEditingDemand(post)}
                                                    className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-white/5 rounded hover:bg-white/10"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => setViewingDemand(post)}
                                                    className="px-3 py-1.5 text-xs font-medium text-white bg-[--primary-color] rounded hover:opacity-90"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm({ type: 'demand', id: post.id })}
                                                    className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 rounded hover:bg-red-500/20 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <EmptyState category="Demand" action={() => setView(View.POST_DEMAND)} />
                        )}
                        <button
                            onClick={() => setView(View.POST_DEMAND)}
                            className="w-full py-4 border-2 border-dashed border-gray-800 rounded-xl text-gray-500 hover:text-[--primary-color] hover:border-[--primary-color] hover:bg-white/5 transition-all flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-sm"
                        >
                            <PlusIcon className="w-5 h-5" /> Post New Demand
                        </button>
                    </div>
                )}

                {/* 2. RENTALS TAB (OLX List Style) */}
                {activeTab === 'rentals' && (
                    <div className="animate-fade-in-up space-y-4">
                        {rentalPosts.length > 0 ? (
                            rentalPosts.map((post) => (
                                <div key={post.id} className="flex flex-col md:flex-row bg-[--card-color] border border-[--border-color] rounded-xl overflow-hidden hover:border-gray-500 transition-all cursor-pointer group">
                                    <div className="w-full md:w-48 h-48 md:h-auto bg-gray-800 shrink-0 relative overflow-hidden">
                                        {post.images && post.images.length > 0 ? (
                                            <img src={post.images[0]} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-600">
                                                <BuildingOfficeIcon className="w-12 h-12" />
                                            </div>
                                        )}
                                        <div className="absolute top-2 left-2 bg-[--primary-color] text-white text-xs font-bold px-2 py-0.5 rounded shadow">
                                            RENTAL
                                        </div>
                                    </div>

                                    <div className="p-5 flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="text-lg font-bold text-white group-hover:text-[--primary-color] transition-colors">{post.title}</h3>
                                                <div className="bg-green-500/10 text-green-400 text-xs font-bold px-2 py-1 rounded border border-green-500/20">
                                                    LIVE
                                                </div>
                                            </div>
                                            <p className="text-[--primary-color] font-bold text-xl mb-2">${post.price}/mo</p>
                                            <p className="text-gray-400 text-sm line-clamp-2 mb-4">{post.description}</p>

                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <LocationPinIcon className="w-4 h-4" />
                                                    {post.location.address}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <BriefcaseIcon className="w-4 h-4" />
                                                    {post.squareFeet} sq ft
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap justify-between items-center gap-2">
                                            <div className="flex gap-2">
                                                {post.status !== 'rented' && (
                                                    <button
                                                        onClick={() => setSolvedSuccess({ type: 'rental', id: post.id })}
                                                        className="px-3 py-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded hover:bg-blue-500/20 transition-colors"
                                                    >
                                                        ✓ Mark Rented
                                                    </button>
                                                )}
                                                {post.status === 'rented' && (
                                                    <span className="px-3 py-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded">
                                                        ✓ Rented
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setEditingRental(post)}
                                                    className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-white/5 rounded hover:bg-white/10"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => setViewingRental(post)}
                                                    className="px-3 py-1.5 text-xs font-medium text-white bg-[--primary-color] rounded hover:opacity-90"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm({ type: 'rental', id: post.id })}
                                                    className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 rounded hover:bg-red-500/20 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <EmptyState category="Rental" action={() => setView(View.POST_RENTAL)} />
                        )}
                        <button
                            onClick={() => setView(View.POST_RENTAL)}
                            className="w-full py-4 border-2 border-dashed border-gray-800 rounded-xl text-gray-500 hover:text-[--primary-color] hover:border-[--primary-color] hover:bg-white/5 transition-all flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-sm"
                        >
                            <PlusIcon className="w-5 h-5" /> List New Property
                        </button>
                    </div>
                )}

                {/* 3. COMMUNITY TAB */}
                {activeTab === 'community' && (
                    <div className="animate-fade-in-up space-y-4">
                        {myCommunityPosts.length > 0 ? (
                            myCommunityPosts.map(post => (
                                <div key={post.id} className="bg-[--card-color] p-6 rounded-xl border border-[--border-color] hover:border-gray-500 transition-all cursor-pointer">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                                                {/* Use avatar or initials */}
                                                {post.avatar ? <img src={post.avatar} alt={post.author} className="w-full h-full object-cover" /> : post.author[0]}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-white">{post.author}</h4>
                                                <p className="text-xs text-gray-500">2 hours ago</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-medium px-2 py-1 rounded bg-white/5 text-gray-300">Discussion</span>
                                    </div>
                                    <p className="text-gray-200 text-sm mb-4 leading-relaxed">{post.content}</p>
                                    <div className="flex items-center gap-6 text-sm text-gray-500">
                                        <div className="flex items-center gap-2 hover:text-white transition-colors">
                                            <HeartIcon className="w-5 h-5" isFilled={post.isLiked} />
                                            <span>{post.likes}</span>
                                        </div>
                                        <div className="flex items-center gap-2 hover:text-white transition-colors">
                                            <ChatBubbleLeftIcon className="w-5 h-5" />
                                            <span>{post.replies} Replies</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <EmptyState category="Discussion" action={() => setView(View.COMMUNITY_FEED)} />
                        )}
                        <button
                            onClick={() => setView(View.COMMUNITY_FEED)}
                            className="w-full py-4 border-2 border-dashed border-gray-800 rounded-xl text-gray-500 hover:text-[--primary-color] hover:border-[--primary-color] hover:bg-white/5 transition-all flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-sm"
                        >
                            <ChatBubbleLeftRightIcon className="w-5 h-5" /> Start Discussion
                        </button>
                    </div>
                )}

                {/* 4. COLLABORATIONS TAB */}
                {activeTab === 'collaborations' && (
                    <div className="animate-fade-in-up space-y-4">
                        {conversations.length > 0 ? (
                            conversations.map(convo => (
                                <div key={convo.id} className="flex bg-[--card-color] border border-[--border-color] rounded-xl p-4 hover:bg-white/5 cursor-pointer transition-colors" onClick={() => { /* Navigate to chat */ }}>
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 shrink-0 mr-4"></div>
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-1">
                                            <h4 className="font-bold text-white">{convo.participant.name}</h4>
                                            <span className="text-xs text-gray-500">Just now</span>
                                        </div>
                                        <p className="text-sm text-gray-400 line-clamp-1">{convo.messages[convo.messages.length - 1]?.text || "Started a conversation"}</p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-gray-300">
                                                Re: {convo.participant.postTitle}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="self-center ml-4">
                                        <ArrowRightIcon className="w-5 h-5 text-gray-500" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center border bg-white/5 rounded-xl border-dashed border-gray-700">
                                <SparklesIcon className="w-12 h-12 text-gray-600 mb-4" />
                                <h3 className="text-lg font-bold text-white mb-2">No Collaborations Yet</h3>
                                <p className="text-gray-500 text-sm mb-6">Connect with landlords or entrepreneurs to start deals.</p>
                                <button
                                    onClick={() => setView(View.AI_MATCHES)}
                                    className="px-5 py-2 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-all"
                                >
                                    Find Matches
                                </button>
                            </div>
                        )}
                    </div>
                )}

            </div>

            {/* Image Editor Modal Portal */}
            {isImageEditorOpen && tempImageSrc && (
                <ImageEditorModal
                    imageSrc={tempImageSrc}
                    onSave={handleImageSave}
                    onClose={handleImageDiscard}
                />
            )}

            {/* Photo Choice Modal */}
            {isPhotoOptionsOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4" onClick={() => setIsPhotoOptionsOpen(false)}>
                    <div className="bg-[#151515] border border-white/10 p-6 rounded-2xl shadow-2xl max-w-xs w-full text-center animate-scale-up space-y-3" onClick={e => e.stopPropagation()}>
                        <h4 className="text-lg font-bold text-white mb-4">Profile Photo</h4>

                        <button
                            onClick={handleEditCurrentClick}
                            disabled={!profilePicPreview}
                            className={`w-full py-3 px-4 rounded-xl font-bold text-sm border transition-all flex items-center justify-center gap-2 ${profilePicPreview ? 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30 text-white' : 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed text-gray-500'}`}
                        >
                            <PencilIcon className="w-4 h-4" /> Edit Current Photo
                        </button>

                        <button
                            onClick={handleUploadClick}
                            className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-[--primary-color] hover:bg-red-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/20"
                        >
                            <CameraIcon className="w-4 h-4" /> Upload New Photo
                        </button>

                        <button
                            onClick={() => setIsPhotoOptionsOpen(false)}
                            className="w-full py-2 text-xs font-medium text-gray-500 hover:text-white mt-2"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Demand Detail Modal */}
            {viewingDemand && (
                <DemandDetailModal
                    post={viewingDemand}
                    onClose={() => setViewingDemand(null)}
                    onEdit={() => {
                        setEditingDemand(viewingDemand);
                        setViewingDemand(null);
                    }}
                    isOwner={true}
                />
            )}

            {/* Edit Demand Form Modal */}
            {editingDemand && (
                <div className="fixed top-16 left-0 right-0 bottom-0 z-40 bg-black/95 backdrop-blur-sm overflow-y-auto">
                    <PostDemandForm
                        addDemandPost={() => { }}
                        setView={setView}
                        editingPost={editingDemand}
                        updateDemandPost={updateDemandPost}
                        onCancelEdit={() => setEditingDemand(null)}
                    />
                </div>
            )}

            {/* Rental Detail Modal */}
            {viewingRental && (
                <RentalDetailModal
                    post={viewingRental}
                    onClose={() => setViewingRental(null)}
                    onEdit={() => {
                        setEditingRental(viewingRental);
                        setViewingRental(null);
                    }}
                    isOwner={true}
                />
            )}

            {/* Edit Rental Form Modal */}
            {editingRental && (
                <div className="fixed top-16 left-0 right-0 bottom-0 z-40 bg-black/95 backdrop-blur-sm overflow-y-auto">
                    <PostRentalForm
                        addRentalPost={() => { }}
                        setView={setView}
                        editingPost={editingRental}
                        updateRentalPost={updateRentalPost}
                        onCancelEdit={() => setEditingRental(null)}
                    />
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={() => {
                    if (deleteConfirm) {
                        if (deleteConfirm.type === 'demand' && deleteDemandPost) {
                            deleteDemandPost(deleteConfirm.id);
                        } else if (deleteConfirm.type === 'rental' && deleteRentalPost) {
                            deleteRentalPost(deleteConfirm.id);
                        }
                        setDeleteConfirm(null);
                    }
                }}
                type="delete"
                title="Delete Post?"
                message="This action cannot be undone. Are you sure you want to permanently delete this post?"
                confirmText="Delete"
                cancelText="Cancel"
            />

            {/* Mark as Solved/Rented Success Modal */}
            <ConfirmationModal
                isOpen={!!solvedSuccess}
                onClose={() => setSolvedSuccess(null)}
                onConfirm={() => {
                    if (solvedSuccess) {
                        if (solvedSuccess.type === 'demand' && markDemandSolved) {
                            markDemandSolved(solvedSuccess.id);
                        } else if (solvedSuccess.type === 'rental' && markRentalRented) {
                            markRentalRented(solvedSuccess.id);
                        }
                        setSolvedSuccess(null);
                    }
                }}
                type="success"
                title={solvedSuccess?.type === 'demand' ? '🎉 Congratulations!' : '🎉 Property Rented!'}
                message={solvedSuccess?.type === 'demand'
                    ? 'Your demand has helped a business get started! This is a success story for the community.'
                    : 'Your property has found a tenant! This listing will be marked as rented.'
                }
                confirmText={solvedSuccess?.type === 'demand' ? 'Mark as Solved' : 'Mark as Rented'}
            />

        </div>
    );
};

export default Profile;
