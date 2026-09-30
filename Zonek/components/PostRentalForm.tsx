import React, { useState } from 'react';
import { RentalPost, Location, View } from '../types';
import { Input, TextArea, FileInput } from './common/FormComponents';
import { LocationPinIcon, LoadingSpinner, ArrowLeftIcon } from './icons';
import { reverseGeocode, geocode } from '../services/groqService';
import { compressImage } from '../utils/imageUtils';
import CategoryAutocomplete from './CategoryAutocomplete';
import { RENTAL_CATEGORIES } from '../constants/categories';

interface PostRentalFormProps {
  addRentalPost: (post: Omit<RentalPost, 'id' | 'createdAt' | 'upvotes'>) => void;
  setView: (view: View) => void;
  editingPost?: RentalPost;
  updateRentalPost?: (id: string, post: Partial<RentalPost>) => void;
  onCancelEdit?: () => void;
}

type LocationStatus = 'idle' | 'getting_coords' | 'geocoding' | 'success' | 'error';

const PostRentalForm: React.FC<PostRentalFormProps> = ({
  addRentalPost,
  setView,
  editingPost,
  updateRentalPost,
  onCancelEdit
}) => {
  const isEditMode = !!editingPost;

  const [title, setTitle] = useState(editingPost?.title || '');
  const [category, setCategory] = useState(editingPost?.category || '');
  const [description, setDescription] = useState(editingPost?.description || '');
  const [price, setPrice] = useState(editingPost?.price?.toString() || '');
  const [squareFeet, setSquareFeet] = useState(editingPost?.squareFeet?.toString() || '');
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
          setLocationError(`Error: ${error.message}`);
          setLocation({ latitude, longitude, address: `Near ${latitude.toFixed(4)}, ${longitude.toFixed(4)}` });
          setAddressInput(`Near ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          setLocationStatus('error');
        }
      },
      error => {
        setLocationError(`Error: ${error.message}`);
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
    if (!title || !category || !description || !location || !price || !squareFeet || images.length === 0) return;

    setIsSubmitting(true);
    const postData: Omit<RentalPost, 'id' | 'createdAt' | 'upvotes'> = {
      title,
      category,
      description,
      location,
      images,
      price: parseFloat(price),
      squareFeet: parseInt(squareFeet, 10),
      phone: phone || undefined,
      email: email || undefined,
      openToCollaboration,
    };

    try {
        if (isEditMode && editingPost && updateRentalPost) {
          updateRentalPost(editingPost.id, postData);
          if (onCancelEdit) onCancelEdit();
        } else {
          addRentalPost(postData);
          setView(View.RENTAL_LISTINGS);
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
                    <span className="w-2 h-2 bg-accent-green rounded-full" />
                    <span className="text-[10px] font-mono tracking-widest uppercase opacity-50">Property Registration</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-serif-italic font-bold tracking-tight uppercase leading-none">
                    {isEditMode ? 'Modify Listing' : 'List Property'}
                </h1>
            </div>
            <button 
                onClick={() => setView(View.RENTAL_LISTINGS)}
                className="p-3 border border-ink hover:bg-white transition-all group"
            >
                <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
            <section className="bg-white border border-ink p-8 neo-shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-mono tracking-widest uppercase opacity-50 block px-1">Property Title</label>
                        <Input 
                            placeholder="e.g., Prime Downtown Retail Space" 
                            value={title} 
                            onChange={e => setTitle(e.target.value)} 
                            required 
                            className="neo-input"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-mono tracking-widest uppercase opacity-50 block px-1">Property Type</label>
                        <CategoryAutocomplete
                            value={category}
                            onChange={setCategory}
                            categories={RENTAL_CATEGORIES}
                            placeholder="e.g., Retail Space, Office..."
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-mono tracking-widest uppercase opacity-50 block px-1">Price ($/MO)</label>
                        <Input type="number" placeholder="2500" value={price} onChange={e => setPrice(e.target.value)} required className="neo-input" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-mono tracking-widest uppercase opacity-50 block px-1">Square Footage (SQFT)</label>
                        <Input type="number" placeholder="1200" value={squareFeet} onChange={e => setSquareFeet(e.target.value)} required className="neo-input" />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-mono tracking-widest uppercase opacity-50 block px-1">Property Description</label>
                    <TextArea
                        placeholder="Describe the property, features, and target tenant..."
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        required
                        className="neo-input min-h-[120px]"
                    />
                    <div className="flex justify-end px-1">
                        <span className="text-[10px] font-mono opacity-40">{description.length}/2000</span>
                    </div>
                </div>
            </section>

            <section className="bg-white border border-ink p-8 neo-shadow-sm space-y-6">
                <div className="space-y-1">
                    <label className="text-[10px] font-mono tracking-widest uppercase opacity-50 block px-1">Property Location</label>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Full Address or Plot Coordinates"
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
                    {locationStatus === 'success' && <p className="text-[10px] font-mono text-accent-green uppercase tracking-widest px-1 mt-1">✓ Geodata Verified</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-ink/10">
                    <div className="space-y-1">
                        <label className="text-[10px] font-mono tracking-widest uppercase opacity-50 block px-1">Contact Phone (Optional)</label>
                        <Input type="tel" placeholder="(123) 456-7890" value={phone} onChange={e => setPhone(e.target.value)} className="neo-input" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-mono tracking-widest uppercase opacity-50 block px-1">Contact Email (Optional)</label>
                        <Input type="email" placeholder="owner@example.com" value={email} onChange={e => setEmail(e.target.value)} className="neo-input" />
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-foundation/30 border border-ink/10">
                    <div>
                        <p className="font-bold text-sm uppercase tracking-tight">Direct Engagement</p>
                        <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest">Allow tenant collaboration requests</p>
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
                <label className="text-[10px] font-mono tracking-widest uppercase opacity-50 block px-1">High-Res Documentation (1-5 Required)</label>
                <FileInput
                    onFilesSelected={handleFileSelect}
                    imagePreviews={images}
                    onRemoveImage={handleRemoveImage}
                    accept="image/*"
                />
                <div className="flex justify-between items-center px-1">
                    <span className={`text-[10px] font-mono uppercase tracking-widest ${images.length === 0 ? 'text-accent-blue' : 'text-accent-green'}`}>
                        {images.length === 0 ? 'Media Required' : 'Media Processed'}
                    </span>
                    <span className="text-[10px] font-mono opacity-40">{images.length}/5</span>
                </div>
            </section>

            <div className="flex gap-4 pt-4">
                <button 
                    type="submit" 
                    disabled={isSubmitting || images.length === 0}
                    className="neo-button neo-button-primary flex-1 py-6 text-lg font-bold"
                >
                    {isSubmitting ? 'UPLOADING...' : isEditMode ? 'UPDATE LISTING' : 'PUBLISH LISTING'}
                </button>
                {isEditMode && onCancelEdit && (
                    <button 
                        type="button" 
                        onClick={onCancelEdit}
                        className="neo-button flex-1 py-6 text-lg font-bold"
                    >
                        CANCEL
                    </button>
                )}
            </div>
        </form>
      </div>
    </div>
  );
};

export default PostRentalForm;