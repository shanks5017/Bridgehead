import React, { useState } from 'react';
import { DemandPost, Location, View } from '../types';
import { Input, TextArea, FileInput } from './common/FormComponents';
import { LocationPinIcon, LoadingSpinner, ArrowLeftIcon } from './icons';
import { reverseGeocode, geocode } from '../services/groqService';
import { compressImage } from '../utils/imageUtils';
import CategoryAutocomplete from './CategoryAutocomplete';
import { DEMAND_CATEGORIES } from '../constants/categories';

interface PostDemandFormProps {
  addDemandPost: (post: Omit<DemandPost, 'id' | 'createdAt' | 'upvotes'>) => void;
  setView: (view: View) => void;
  editingPost?: DemandPost;
  updateDemandPost?: (id: string, post: Partial<DemandPost>) => void;
  onCancelEdit?: () => void;
}

type LocationStatus = 'idle' | 'getting_coords' | 'geocoding' | 'success' | 'error';

const PostDemandForm: React.FC<PostDemandFormProps> = ({
  addDemandPost,
  setView,
  editingPost,
  updateDemandPost,
  onCancelEdit
}) => {
  const isEditMode = !!editingPost;

  const [title, setTitle] = useState(editingPost?.title || '');
  const [category, setCategory] = useState(editingPost?.category || '');
  const [description, setDescription] = useState(editingPost?.description || '');
  const [location, setLocation] = useState<Location | null>(editingPost?.location || null);
  const [images, setImages] = useState<string[]>(editingPost?.images || []);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>(editingPost?.location ? 'success' : 'idle');
  const [locationError, setLocationError] = useState('');
  const [addressInput, setAddressInput] = useState(editingPost?.location?.address || '');
  const [phone, setPhone] = useState(editingPost?.phone || '');
  const [email, setEmail] = useState(editingPost?.email || '');
  const [openToCollaboration, setOpenToCollaboration] = useState(editingPost?.openToCollaboration ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileSelect = async (files: File[]) => {
    try {
      const compressedImages = await Promise.all(
        files.map(file => compressImage(file))
      );
      setImages(prev => [...prev, ...compressedImages]);
    } catch (error) {
      console.error('Error compressing images:', error);
    }
  }

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleGetLocation = () => {
    setLocationStatus('getting_coords');
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      async position => {
        const { latitude, longitude } = position.coords;
        setLocationStatus('geocoding');
        try {
          const address = await reverseGeocode({ latitude, longitude });
          setLocation({ latitude, longitude, address });
          setAddressInput(address);
          setLocationStatus('success');
        } catch (error: any) {
          setLocationError(`Error getting address: ${error.message}`);
          setLocation({ latitude, longitude, address: `Near ${latitude.toFixed(4)}, ${longitude.toFixed(4)}` });
          setAddressInput(`Near ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          setLocationStatus('error');
        }
      },
      error => {
        setLocationError(`Error getting location: ${error.message}`);
        setLocationStatus('error');
      }
    );
  };

  const handleAddressBlur = async () => {
    if (!addressInput.trim() || addressInput === location?.address) return;
    setLocationStatus('geocoding');
    setLocationError('');
    try {
      const { latitude, longitude } = await geocode(addressInput);
      setLocation({ latitude, longitude, address: addressInput });
      setLocationStatus('success');
    } catch (error: any) {
      setLocationError(error.message);
      setLocationStatus('error');
      setLocation(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.length < 20 || !title || !category || !location || images.length === 0) return;

    setIsSubmitting(true);
    const postData: Omit<DemandPost, 'id' | 'createdAt' | 'upvotes'> = {
      title,
      category,
      description,
      location,
      images,
      phone: phone || undefined,
      email: email || undefined,
      openToCollaboration,
    };

    try {
        if (isEditMode && editingPost && updateDemandPost) {
          updateDemandPost(editingPost.id, postData);
          if (onCancelEdit) onCancelEdit();
        } else {
          addDemandPost(postData);
          setView(View.DEMAND_FEED);
        }
    } finally {
        setIsSubmitting(false);
    }
  };

  const isLocating = locationStatus === 'getting_coords' || locationStatus === 'geocoding';

  return (
    <div className="min-h-screen bg-foundation py-20 px-6 md:px-12">
      <div className="max-w-3xl mx-auto space-y-8 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink pb-8">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 bg-accent-blue rounded-full" />
                    <span className="text-[10px] font-mono tracking-widest uppercase opacity-50">Signal Initiation</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-serif-italic font-bold tracking-tight uppercase leading-none">
                    {isEditMode ? 'Modify Demand' : 'Voice a Need'}
                </h1>
            </div>
            <button 
                onClick={() => setView(View.DEMAND_FEED)}
                className="p-3 border border-ink hover:bg-white transition-all group"
            >
                <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
            <section className="bg-white border border-ink p-8 neo-shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-mono tracking-widest uppercase opacity-50 block px-1">Demand Title</label>
                        <Input 
                            placeholder="e.g., A 24/7 Soda Shop" 
                            value={title} 
                            onChange={e => setTitle(e.target.value)} 
                            required 
                            className="neo-input"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-mono tracking-widest uppercase opacity-50 block px-1">Category</label>
                        <CategoryAutocomplete
                            value={category}
                            onChange={setCategory}
                            categories={DEMAND_CATEGORIES}
                            placeholder="e.g., Gaming Lounge, Cafe..."
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-mono tracking-widest uppercase opacity-50 block px-1">Detailed Description</label>
                    <TextArea
                        placeholder="Describe the business or service you'd like to see..."
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        required
                        className="neo-input min-h-[150px]"
                    />
                    <div className="flex justify-between items-center px-1">
                        <span className={`text-[10px] font-mono uppercase tracking-widest ${description.length < 20 ? 'text-accent-blue' : 'opacity-40'}`}>
                            {description.length < 20 ? `Need ${20 - description.length} more characters` : 'Verified Length'}
                        </span>
                        <span className="text-[10px] font-mono opacity-40">{description.length}/2000</span>
                    </div>
                </div>
            </section>

            <section className="bg-white border border-ink p-8 neo-shadow-sm space-y-6">
                <div className="space-y-1">
                    <label className="text-[10px] font-mono tracking-widest uppercase opacity-50 block px-1">Deployment Location</label>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Street, City, or Landmark"
                            value={addressInput}
                            onChange={e => setAddressInput(e.target.value)}
                            onBlur={handleAddressBlur}
                            className="neo-input flex-1"
                        />
                        <button
                            type="button"
                            onClick={handleGetLocation}
                            disabled={isLocating}
                            className={`p-3 border border-ink transition-all ${isLocating ? 'bg-foundation opacity-50' : 'bg-white hover:bg-foundation'}`}
                        >
                            {isLocating ? <LoadingSpinner className="w-5 h-5" /> : <LocationPinIcon className="w-5 h-5" />}
                        </button>
                    </div>
                    {locationStatus === 'success' && <p className="text-[10px] font-mono text-accent-green uppercase tracking-widest px-1 mt-1">✓ Coordinates Locked</p>}
                    {locationError && <p className="text-[10px] font-mono text-accent-blue uppercase tracking-widest px-1 mt-1">! {locationError}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-ink/10">
                    <div className="space-y-1">
                        <label className="text-[10px] font-mono tracking-widest uppercase opacity-50 block px-1">Contact Phone (Optional)</label>
                        <Input type="tel" placeholder="(123) 456-7890" value={phone} onChange={e => setPhone(e.target.value)} className="neo-input" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-mono tracking-widest uppercase opacity-50 block px-1">Contact Email (Optional)</label>
                        <Input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className="neo-input" />
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-foundation/30 border border-ink/10">
                    <div>
                        <p className="font-bold text-sm uppercase tracking-tight">Open to Collaboration</p>
                        <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest">Allow direct network messaging</p>
                    </div>
                    <button 
                        type="button"
                        onClick={() => setOpenToCollaboration(!openToCollaboration)}
                        className={`w-12 h-6 border border-ink relative transition-all ${openToCollaboration ? 'bg-accent-green' : 'bg-white'}`}
                    >
                        <div className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 border border-ink bg-white transition-all ${openToCollaboration ? 'right-1' : 'left-1'}`} />
                    </button>
                </div>
            </section>

            <section className="bg-white border border-ink p-8 neo-shadow-sm space-y-6">
                <label className="text-[10px] font-mono tracking-widest uppercase opacity-50 block px-1">Visual Documentation (1-5 Required)</label>
                <FileInput
                    onFilesSelected={handleFileSelect}
                    imagePreviews={images}
                    onRemoveImage={handleRemoveImage}
                    accept="image/*"
                />
                <div className="flex justify-between items-center px-1">
                    <span className={`text-[10px] font-mono uppercase tracking-widest ${images.length === 0 ? 'text-accent-blue' : 'text-accent-green'}`}>
                        {images.length === 0 ? 'Documentation Required' : 'Documentation Ready'}
                    </span>
                    <span className="text-[10px] font-mono opacity-40">{images.length}/5</span>
                </div>
            </section>

            <div className="flex gap-4 pt-4">
                <button 
                    type="submit" 
                    disabled={isSubmitting || images.length === 0 || description.length < 20}
                    className="neo-button neo-button-primary flex-1 py-6 text-lg font-bold"
                >
                    {isSubmitting ? 'TRANSMITTING...' : isEditMode ? 'UPDATE SIGNAL' : 'EMIT SIGNAL'}
                </button>
                {isEditMode && onCancelEdit && (
                    <button 
                        type="button" 
                        onClick={onCancelEdit}
                        className="neo-button flex-1 py-6 text-lg font-bold"
                    >
                        ABORT
                    </button>
                )}
            </div>
        </form>
      </div>
    </div>
  );
};

export default PostDemandForm;