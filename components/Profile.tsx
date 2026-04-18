import React, { useState, useEffect, useRef } from 'react';
import { config } from '../src/config';
import { User, View, DemandPost, RentalPost, CommunityPost, Conversation } from '../types';
import DemandDetailModal from './DemandDetailModal';
import RentalDetailModal from './RentalDetailModal';
import PostDemandForm from './PostDemandForm';
import PostRentalForm from './PostRentalForm';
import ConfirmationModal from './ConfirmationModal';
import { Input, TextArea } from './common/FormComponents';
import {
    UserCircleIcon,
    PencilIcon,
    CameraIcon,
    BriefcaseIcon,
    BuildingOfficeIcon,
    ChatBubbleLeftRightIcon,
    LocationPinIcon,
    ArrowRightIcon,
    PlusIcon,
    HeartIcon,
    ChatBubbleLeftIcon,
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

type Tab = 'demands' | 'rentals' | 'community' | 'collaborations';

// --- NEO-BRUTALIST IMAGE EDITOR MODAL ---
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
    const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);

    useEffect(() => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imageSrc;
        img.onload = () => setOriginalImage(img);
    }, [imageSrc]);

    const handleRotate = () => setRotation((prev) => (prev - 90) % 360);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPosition({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
    };

    const handleMouseUp = () => setIsDragging(false);

    const handleSave = () => {
        if (!originalImage) return;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const size = 400;
        const previewSize = 256;
        canvas.width = size;
        canvas.height = size;

        let baseScale = originalImage.width > originalImage.height ? size / originalImage.height : size / originalImage.width;
        ctx.fillStyle = '#E4E3E0';
        ctx.fillRect(0, 0, size, size);
        ctx.translate(size / 2, size / 2);
        const ratio = size / previewSize;
        ctx.translate(position.x * ratio, position.y * ratio);
        ctx.rotate((rotation * Math.PI) / 180);
        const totalScale = baseScale * scale;
        ctx.scale(totalScale, totalScale);
        ctx.drawImage(originalImage, -originalImage.width / 2, -originalImage.height / 2);
        onSave(canvas.toDataURL('image/jpeg', 0.9));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foundation/90 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-md bg-white border border-ink neo-shadow-lg animate-slide-up flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-ink bg-foundation/10">
                    <h3 className="text-sm font-mono font-bold uppercase tracking-widest">Image Modulation</h3>
                    <button onClick={onClose} className="p-2 border border-ink hover:bg-foundation active:translate-y-px">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="bg-foundation/20 p-8 flex items-center justify-center overflow-hidden relative select-none cursor-move"
                    onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                    <div className="relative z-10 w-64 h-64 border-4 border-ink shadow-[0_0_0_9999px_rgba(228,227,224,0.8)] pointer-events-none" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div style={{ width: '256px', height: '256px' }} className="flex items-center justify-center">
                            {originalImage && (
                                <img src={imageSrc} alt="Edit" draggable={false}
                                    style={{
                                        transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${scale})`,
                                        transition: isDragging ? 'none' : 'transform 0.2s',
                                        maxWidth: 'none', maxHeight: 'none',
                                        width: originalImage.width > originalImage.height ? 'auto' : '256px',
                                        height: originalImage.height > originalImage.width ? 'auto' : '256px'
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>
                <div className="p-6 space-y-6 border-t border-ink">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 space-y-1">
                            <label className="text-[10px] font-mono uppercase tracking-widest opacity-40">Magnification</label>
                            <input type="range" min="1" max="3" step="0.1" value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} className="w-full h-2 bg-foundation border border-ink rounded-none appearance-none cursor-pointer" />
                        </div>
                        <button onClick={handleRotate} className="p-4 border border-ink hover:bg-foundation active:translate-y-px"><RotateLeftIcon className="w-5 h-5" /></button>
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-ink/5">
                        <button onClick={onClose} className="neo-button flex-1 py-4 text-xs font-bold">DISCARD</button>
                        <button onClick={handleSave} className="neo-button flex-1 py-4 text-xs font-bold bg-accent-blue text-white">APPLY CHANGES</button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const Profile: React.FC<ProfileProps> = ({
    user, onUpdateUser, setView, demandPosts, rentalPosts, communityPosts, conversations,
    updateDemandPost, updateRentalPost, deleteDemandPost, deleteRentalPost, markDemandSolved, markRentalRented
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<User>(user);
    const [profilePicPreview, setProfilePicPreview] = useState<string | undefined>(user.profilePicture);
    const [activeTab, setActiveTab] = useState<Tab>('demands');
    const [viewedUser, setViewedUser] = useState<User | null>(null);
    const [isImageEditorOpen, setIsImageEditorOpen] = useState(false);
    const [isPhotoOptionsOpen, setIsPhotoOptionsOpen] = useState(false);
    const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [showAllDemands, setShowAllDemands] = useState(false);
    const [showAllRentals, setShowAllRentals] = useState(false);

    const [viewingDemand, setViewingDemand] = useState<DemandPost | null>(null);
    const [viewingRental, setViewingRental] = useState<RentalPost | null>(null);
    const [editingDemand, setEditingDemand] = useState<DemandPost | null>(null);
    const [editingRental, setEditingRental] = useState<RentalPost | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'demand' | 'rental', id: string } | null>(null);
    const [solvedSuccess, setSolvedSuccess] = useState<{ type: 'demand' | 'rental', id: string } | null>(null);

    useEffect(() => {
        const viewingUsername = localStorage.getItem('viewingUsername');
        if (viewingUsername && viewingUsername !== user.username) {
            console.log(`🔍 Fetching profile for username: ${viewingUsername}`);
            fetch(`${config.api.baseUrl}/users/username/${viewingUsername}`)
                .then(res => {
                    if (res.status === 404) {
                        console.warn(`⚠️ Profile for "${viewingUsername}" not found (404).`);
                        return null;
                    }
                    if (!res.ok) throw new Error('Failed to fetch profile');
                    return res.json();
                })
                .then(data => {
                    if (data) {
                        console.log('✅ Profile found:', data.username);
                        setViewedUser(data);
                    } else {
                        setViewedUser(null);
                        localStorage.removeItem('viewingUsername');
                    }
                })
                .catch(err => {
                    console.error('❌ Error fetching profile:', err);
                    setViewedUser(null);
                    localStorage.removeItem('viewingUsername');
                });
        } else {
            setViewedUser(null);
            localStorage.removeItem('viewingUsername');
        }
    }, [user.username]);

    const displayedUser = viewedUser || user;
    const isOwnProfile = !viewedUser;
    const myCommunityPosts = communityPosts.filter(post => post.author === user.name || post.username === user.name);

    const metrics = {
        activePosts: demandPosts.length + rentalPosts.length,
        impact: myCommunityPosts.reduce((acc, curr) => acc + (curr.likes || 0), 0),
        network: conversations.length
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleProfilePicSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setTempImageSrc(objectUrl);
            setFormData(prev => ({ ...prev, originalProfilePictureFile: file }));
            setIsImageEditorOpen(true);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleImageSave = async (finalBase64: string) => {
        const croppedBlob = await fetch(finalBase64).then(r => r.blob());
        const croppedFile = new File([croppedBlob], 'profile_cropped.jpg', { type: 'image/jpeg' });
        setProfilePicPreview(URL.createObjectURL(croppedBlob));
        setFormData(prev => ({ ...prev, profilePictureFile: croppedFile }));
        setIsImageEditorOpen(false);
    };

    const handleSaveChanges = () => {
        onUpdateUser(formData);
        setIsEditing(false);
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(`${window.location.origin}/profile/${displayedUser.username}`).then(() => alert('Profile Link Copied'));
    };

    const displayedDemands = showAllDemands ? demandPosts : demandPosts.slice(0, 10);
    const displayedRentals = showAllRentals ? rentalPosts : rentalPosts.slice(0, 10);

    return (
        <div className="min-h-screen bg-foundation pb-20 overflow-x-hidden">
            {/* HERO SECTION */}
            <div className="relative h-60 md:h-80 bg-white border-b border-ink overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#141414 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-foundation/50 to-transparent pointer-events-none" />
                {isOwnProfile && (
                    <button onClick={() => setIsEditing(!isEditing)} className="absolute top-6 right-6 neo-button py-2 px-6 text-xs font-bold z-10">
                        {isEditing ? 'ABORT' : 'MODIFY IDENTITY'}
                    </button>
                )}
            </div>

            {/* PROFILE HEADER CONTENT */}
            <div className="container mx-auto max-w-5xl px-6 relative -mt-32 md:-mt-40 z-10">
                <div className="flex flex-col md:flex-row items-end gap-8 mb-12">
                    <div className="relative group self-center md:self-auto">
                        <div className="w-48 h-48 md:w-56 md:h-56 bg-white border-2 border-ink p-1 neo-shadow-md">
                            <div className="w-full h-full relative overflow-hidden bg-foundation border border-ink">
                                <input type="file" ref={fileInputRef} onChange={handleProfilePicSelect} accept="image/*" className="hidden" />
                                {profilePicPreview ? (
                                    <img src={profilePicPreview} alt={formData.name} className="w-full h-full object-cover grayscale-[0.2]" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center"><UserCircleIcon className="w-24 h-24 opacity-10" /></div>
                                )}
                                {isEditing && (
                                    <button onClick={() => setIsPhotoOptionsOpen(true)} className="absolute inset-0 bg-white/80 border border-ink flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <CameraIcon className="w-8 h-8" />
                                        <span className="text-[10px] font-mono font-bold mt-2">UPLOAD</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 pb-4 space-y-4 text-center md:text-left w-full">
                        <div className="space-y-1">
                            {isEditing ? (
                                <Input name="name" value={formData.name} onChange={handleInputChange} className="text-4xl font-serif-italic font-bold bg-white border border-ink p-2 w-full uppercase" />
                            ) : (
                                <h1 className="text-5xl md:text-7xl font-serif-italic font-bold tracking-tighter uppercase leading-none">{displayedUser.name}</h1>
                            )}
                            <div className="flex items-center justify-center md:justify-start gap-2">
                                <span className="w-1.5 h-1.5 bg-accent-blue rounded-full" />
                                <span className="text-sm font-mono font-bold tracking-widest uppercase opacity-40">@{displayedUser.username}</span>
                            </div>
                        </div>

                        {isEditing ? (
                            <TextArea name="bio" value={formData.bio || ''} onChange={handleInputChange} className="neo-input min-h-[80px]" placeholder="Update your frequency..." />
                        ) : (
                            <p className="text-lg font-medium opacity-70 max-w-2xl">{displayedUser.bio || "No transmission data found."}</p>
                        )}
                        
                        {isEditing && (
                            <button onClick={handleSaveChanges} className="neo-button neo-button-primary py-3 px-10 text-sm font-bold">SAVE IDENTITY CHANGES</button>
                        )}
                    </div>
                </div>

                {/* METRICS GRID */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-ink border border-ink neo-shadow-sm mb-16">
                    {[
                        { label: 'Active Signals', val: metrics.activePosts },
                        { label: 'Network Reach', val: metrics.network },
                        { label: 'Social Impact', val: metrics.impact },
                        { label: 'System Auth', val: 'Level-A+', status: true }
                    ].map((m, i) => (
                        <div key={i} className="bg-white p-8 space-y-1">
                            <p className="text-[10px] font-mono opacity-40 uppercase tracking-widest leading-none">{m.label}</p>
                            <p className={`text-4xl font-serif-italic font-bold leading-none ${m.status ? 'text-accent-blue' : ''}`}>{m.val}</p>
                        </div>
                    ))}
                </div>

                {/* TABS NAVIGATION */}
                <div className="sticky top-20 z-20 bg-foundation border border-ink p-2 flex gap-2 mb-8 neo-shadow-sm overflow-x-auto">
                    {[
                        { id: 'demands', label: 'DEMAND LOG', total: demandPosts.length },
                        { id: 'rentals', label: 'ASSET LOG', total: rentalPosts.length },
                        { id: 'collaborations', label: 'NETWORK', total: metrics.network } 
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)}
                            className={`flex-1 py-4 px-6 text-xs font-bold tracking-widest uppercase transition-all border border-transparent ${activeTab === tab.id ? 'bg-ink text-white border-ink' : 'hover:bg-white hover:border-ink opacity-40 hover:opacity-100'}`}>
                            {tab.label} <span className="opacity-40 ml-2">[{tab.total || 0}]</span>
                        </button>
                    ))}
                </div>

                {/* TAB CONTENT */}
                <div className="space-y-8 animate-slide-up">
                    {/* DEMANDS TAB */}
                    {activeTab === 'demands' && (
                        <div className="space-y-4">
                            {displayedDemands.map(post => (
                                <div key={post.id} className="bg-white border border-ink p-6 md:p-8 flex flex-col md:flex-row gap-8 neo-shadow-sm hover:neo-shadow-md transition-all">
                                    <div className="w-full md:w-64 h-48 border border-ink bg-foundation p-1">
                                        {post.images?.[0] ? <img src={post.images[0]} alt={post.title} className="w-full h-full object-cover grayscale-[0.2]" /> : <div className="w-full h-full flex items-center justify-center opacity-10"><BriefcaseIcon className="w-16 h-16" /></div>}
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-mono tracking-widest uppercase text-accent-blue font-bold">{post.category}</div>
                                            <h3 className="text-3xl font-serif-italic font-bold tracking-tight uppercase">{post.title}</h3>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-2"><LocationPinIcon className="w-4 h-4 opacity-40" /><span className="text-[10px] font-mono uppercase font-bold">{post.location.address}</span></div>
                                            <div className="flex items-center gap-2"><HeartIcon className="w-4 h-4 text-accent-blue" /><span className="text-[10px] font-mono font-bold">{post.upvotes} UPVOTES</span></div>
                                        </div>
                                        <div className="flex gap-4 pt-4 border-t border-ink/5">
                                            <button onClick={() => setViewingDemand(post)} className="neo-button text-[10px] font-bold py-2 px-6">VIEW</button>
                                            <button onClick={() => setEditingDemand(post)} className="neo-button text-[10px] font-bold py-2 px-6">MODIFY</button>
                                            <button onClick={() => setDeleteConfirm({ type: 'demand', id: post.id })} className="neo-button text-[10px] font-bold py-2 px-6 bg-accent-blue/10 border-accent-blue text-accent-blue">DELETE</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {demandPosts.length === 0 && <div className="p-20 text-center border-2 border-dashed border-ink opacity-20 text-4xl font-serif-italic italic">No Signals Emitted</div>}
                            {demandPosts.length > 10 && !showAllDemands && (
                                <button onClick={() => setShowAllDemands(true)} className="neo-button w-full py-4 mt-4 font-bold tracking-widest uppercase bg-white">
                                    LOAD ALL SIGNALS ({demandPosts.length - 10} MORE)
                                </button>
                            )}
                        </div>
                    )}

                    {/* RENTALS TAB */}
                    {activeTab === 'rentals' && (
                        <div className="space-y-4">
                            {displayedRentals.map(post => (
                                <div key={post.id} className="bg-white border border-ink p-6 md:p-8 flex flex-col md:flex-row gap-8 neo-shadow-sm hover:neo-shadow-md transition-all">
                                    <div className="w-full md:w-64 h-48 border border-ink bg-foundation p-1">
                                        {post.images?.[0] ? <img src={post.images[0]} alt={post.title} className="w-full h-full object-cover grayscale-[0.2]" /> : <div className="w-full h-full flex items-center justify-center opacity-10"><BuildingOfficeIcon className="w-16 h-16" /></div>}
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <div className="text-[10px] font-mono tracking-widest uppercase text-accent-green font-bold">{post.category}</div>
                                                <h3 className="text-3xl font-serif-italic font-bold tracking-tight uppercase">{post.title}</h3>
                                            </div>
                                            <div className="text-2xl font-serif-italic font-bold text-accent-green">₹{post.price}/MO</div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-2"><LocationPinIcon className="w-4 h-4 opacity-40" /><span className="text-[10px] font-mono uppercase font-bold">{post.location.address}</span></div>
                                            <div className="flex items-center gap-2"><span className="text-[10px] font-mono font-bold tracking-widest opacity-40 uppercase">{post.squareFeet} SQFT</span></div>
                                        </div>
                                        <div className="flex gap-4 pt-4 border-t border-ink/5">
                                            <button onClick={() => setViewingRental(post)} className="neo-button text-[10px] font-bold py-2 px-6">VIEW</button>
                                            <button onClick={() => setEditingRental(post)} className="neo-button text-[10px] font-bold py-2 px-6">MODIFY</button>
                                            <button onClick={() => setDeleteConfirm({ type: 'rental', id: post.id })} className="neo-button text-[10px] font-bold py-2 px-6 bg-accent-blue/10 border-accent-blue text-accent-blue">DELETE</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {rentalPosts.length === 0 && <div className="p-20 text-center border-2 border-dashed border-ink opacity-20 text-4xl font-serif-italic italic">No Assets Registered</div>}
                            {rentalPosts.length > 10 && !showAllRentals && (
                                <button onClick={() => setShowAllRentals(true)} className="neo-button w-full py-4 mt-4 font-bold tracking-widest uppercase bg-white">
                                    LOAD ALL ASSETS ({rentalPosts.length - 10} MORE)
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* MODALS */}
            {isImageEditorOpen && tempImageSrc && <ImageEditorModal imageSrc={tempImageSrc} onSave={handleImageSave} onClose={() => setIsImageEditorOpen(false)} />}
            {viewingDemand && <DemandDetailModal post={viewingDemand} onClose={() => setViewingDemand(null)} onEdit={() => { setEditingDemand(viewingDemand); setViewingDemand(null); }} isOwner={true} setView={setView} />}
            {editingDemand && <div className="fixed inset-0 z-[60] bg-white overflow-y-auto"><PostDemandForm addDemandPost={() => {}} setView={setView} editingPost={editingDemand} updateDemandPost={updateDemandPost} onCancelEdit={() => setEditingDemand(null)} /></div>}
            {viewingRental && <RentalDetailModal post={viewingRental} onClose={() => setViewingRental(null)} onEdit={() => { setEditingRental(viewingRental); setViewingRental(null); }} isOwner={true} setView={setView} />}
            {editingRental && <div className="fixed inset-0 z-[60] bg-white overflow-y-auto"><PostRentalForm addRentalPost={() => {}} setView={setView} editingPost={editingRental} updateRentalPost={updateRentalPost} onCancelEdit={() => setEditingRental(null)} /></div>}
            <ConfirmationModal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={() => { if (deleteConfirm) { deleteConfirm.type === 'demand' ? deleteDemandPost!(deleteConfirm.id) : deleteRentalPost!(deleteConfirm.id); setDeleteConfirm(null); }}} type="delete" title="Verify Purge?" message="Permanent erasure of this signal data cannot be reversed. Proceed?" confirmText="WIPE DATA" />
        </div>
    );
};

export default Profile;
