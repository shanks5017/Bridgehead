import React, { useState } from 'react';
import { RentalPost, Location, View } from '../types';
import { Input, TextArea, FileInput } from './common/FormComponents';
import { LocationPinIcon, LoadingSpinner } from './icons';
import { reverseGeocode, geocode } from '../services/geminiService';
import { compressImage } from '../utils/imageUtils';
import CategoryAutocomplete from './CategoryAutocomplete';
import { RENTAL_CATEGORIES } from '../constants/categories';

interface PostRentalFormProps {
  addRentalPost: (post: Omit<RentalPost, 'id' | 'createdAt'>) => void;
  setView: (view: View) => void;
  // Edit mode props
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
  const [showPreview, setShowPreview] = useState(false);


  const handleFileSelect = async (files: File[]) => {
    try {
      const compressedImages = await Promise.all(
        files.map(file => compressImage(file))
      );
      setImages(prev => [...prev, ...compressedImages]);
    } catch (error) {
      console.error('Error compressing images:', error);
      alert('Failed to process images. Please try again.');
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
    if (!addressInput.trim() || addressInput === location?.address) {
      return;
    }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !category || !description || !location || !price || !squareFeet) {
      alert('Please fill all fields and ensure the location is verified.');
      return;
    }

    // Image validation
    if (images.length === 0) {
      alert('📸 Please add at least 1 image! \n\nProperty photos help tenants make decisions and get 5x more interest. It only takes a moment! 😊');
      return;
    }

    if (images.length > 5) {
      alert('You can upload a maximum of 5 images. Please remove some images and try again.');
      return;
    }

    const postData: Omit<RentalPost, 'id' | 'createdAt'> = {
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

    if (isEditMode && editingPost && updateRentalPost) {
      // Update existing post
      updateRentalPost(editingPost.id, postData);
      if (onCancelEdit) onCancelEdit();
    } else {
      // Create new post
      addRentalPost(postData);
      setView(View.RENTAL_LISTINGS);
    }
  };

  const isLocating = locationStatus === 'getting_coords' || locationStatus === 'geocoding';

  return (
    <div className="min-h-screen flex items-center justify-center py-12 relative overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 animate-gradient-shift"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>

      <form onSubmit={handleSubmit} className="relative w-full max-w-2xl mx-auto bg-[--card-color] border border-[--border-color] rounded-xl p-8 space-y-6 backdrop-blur-sm shadow-2xl">
        <h2 className="text-3xl font-bold text-center">
          {isEditMode ? 'Edit Your Property Listing' : 'List a Commercial Property'}
        </h2>
        <p className="text-center text-[--text-secondary]">
          {isEditMode
            ? 'Update your property details below.'
            : 'Connect with entrepreneurs looking for their next location.'
          }
        </p>

        <Input label="Property Title" placeholder="e.g., Prime Downtown Retail Space" value={title} onChange={e => setTitle(e.target.value)} required />
        <CategoryAutocomplete
          label="Property Type"
          value={category}
          onChange={setCategory}
          categories={RENTAL_CATEGORIES}
          placeholder="e.g., Retail Space, Office Space, Restaurant Space..."
          required
        />
        <div className="flex gap-4">
          <Input label="Price ($/month)" type="number" placeholder="2500" value={price} onChange={e => setPrice(e.target.value)} required />
          <Input label="Square Feet" type="number" placeholder="1200" value={squareFeet} onChange={e => setSquareFeet(e.target.value)} required />
        </div>
        <TextArea label="Description" placeholder="Describe the property, its features, and nearby attractions..." value={description} onChange={e => setDescription(e.target.value)} required />

        <div className="w-full space-y-2">
          <div className="flex items-end gap-2">
            <div className="flex-grow">
              <Input
                label="Location"
                placeholder="Enter property address"
                value={addressInput}
                onChange={e => {
                  setAddressInput(e.target.value);
                  if (locationStatus === 'success' || locationStatus === 'error') {
                    setLocationStatus('idle');
                    setLocation(null);
                    setLocationError('');
                  }
                }}
                onBlur={handleAddressBlur}
              />
            </div>
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={isLocating}
              className="flex-shrink-0 h-[50px] flex items-center justify-center gap-2 px-4 rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-50"
              aria-label="Use current location"
            >
              {isLocating ? <LoadingSpinner className="w-5 h-5" /> : <LocationPinIcon className="w-5 h-5" />}
            </button>
          </div>
          {locationStatus === 'geocoding' && <p className="text-sm text-[--text-secondary] flex items-center gap-2"><LoadingSpinner className="w-4 h-4" /> Verifying address...</p>}
          {locationStatus === 'getting_coords' && <p className="text-sm text-[--text-secondary] flex items-center gap-2"><LoadingSpinner className="w-4 h-4" /> Getting coordinates...</p>}
          {locationStatus === 'success' && location && <p className="text-sm text-green-400">✓ Location verified</p>}
          {locationError && <p className="text-red-500 text-sm mt-2">{locationError}</p>}
        </div>

        <div className="border-t border-[--border-color] pt-6 space-y-6">
          <h3 className="text-xl font-bold text-center">Optional Information</h3>
          <p className="text-center text-sm text-[--text-secondary] -mt-4">Provide contact details for potential tenants or collaborators.</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Input label="Contact Phone (Optional)" type="tel" placeholder="(123) 456-7890" value={phone} onChange={e => setPhone(e.target.value)} />
            <Input label="Contact Email (Optional)" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          <div className="flex items-center justify-between bg-white/5 p-4 rounded-lg">
            <div>
              <label htmlFor="collaboration-toggle" className="font-medium text-white">Open to Collaboration</label>
              <p className="text-sm text-[--text-secondary]">Allow other users to message you about this property.</p>
            </div>
            <label htmlFor="collaboration-toggle" className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="collaboration-toggle" className="sr-only peer" checked={openToCollaboration} onChange={() => setOpenToCollaboration(!openToCollaboration)} />
              <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-[--primary-color] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[--primary-color]"></div>
            </label>
          </div>
        </div>

        {/* Image Upload with Validation */}
        <div className="space-y-2">
          <FileInput
            label="Upload Property Images (1-5 required)"
            onFilesSelected={handleFileSelect}
            imagePreviews={images}
            onRemoveImage={handleRemoveImage}
            accept="image/*"
          />

          {/* Image Upload Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Visual Indicator */}
              <div className={`w-3 h-3 rounded-full transition-colors ${images.length >= 1 && images.length <= 5 ? 'bg-green-500' : 'bg-yellow-500'
                }`} />

              {/* Image Count */}
              <span className={`text-xs font-medium transition-colors ${images.length >= 1 && images.length <= 5 ? 'text-green-400' : 'text-yellow-400'
                }`}>
                {images.length} / 5 images
              </span>
            </div>
          </div>

          {/* Friendly Validation Message */}
          {images.length === 0 ? (
            <p className="text-xs text-yellow-400 flex items-start gap-1.5">
              <span className="mt-0.5">📸</span>
              <span>
                Please add at least 1 image! Property photos help tenants visualize the space and get 5x more inquiries.
                Great photos attract quality tenants! 😊
              </span>
            </p>
          ) : images.length > 5 ? (
            <p className="text-xs text-red-400 flex items-start gap-1.5">
              <span className="mt-0.5">⚠️</span>
              <span>
                Please remove {images.length - 5} image{images.length - 5 !== 1 ? 's' : ''}. Maximum is 5 images to keep loading fast!
              </span>
            </p>
          ) : (
            <p className="text-xs text-green-400 flex items-center gap-1.5">
              <span>✓</span>
              <span>Excellent! Your property photos look professional. This will attract serious tenants! 🏢</span>
            </p>
          )}
        </div>


        <div className="flex gap-3">
          {isEditMode && onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="flex-1 mt-4 px-6 py-4 rounded-lg text-lg font-semibold border-2 border-gray-600 text-gray-400 hover:bg-gray-600/20 transition-all"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="flex-1 mt-4 px-6 py-4 rounded-lg text-lg font-semibold border-2 border-[--primary-color] text-[--primary-color] hover:bg-[--primary-color]/10 transition-all"
          >
            👁️ Preview
          </button>
          <button
            type="submit"
            className="flex-1 mt-4 px-6 py-4 rounded-lg text-lg font-semibold bg-[--primary-color] text-white hover:opacity-90 transition-opacity"
          >
            {isEditMode ? '✓ Update Listing' : 'List Property'}
          </button>
        </div>

        {/* Property Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
            <div className="bg-[--card-color] rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold">Preview Your Listing</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-2xl hover:text-[--primary-color] transition-colors"
                >
                  ✕
                </button>
              </div>

              <p className="text-sm text-[--text-secondary] mb-4">This is how your property listing will appear to tenants:</p>

              {/* Preview Card */}
              <div className="bg-[--background-color] rounded-lg overflow-hidden border border-[--border-color]">
                {/* Images Preview */}
                {images.length > 0 ? (
                  <div className="relative h-64 bg-gray-800">
                    <img src={images[0]} alt="Preview" className="w-full h-full object-cover" />
                    {images.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-sm px-3 py-1 rounded-full">
                        1 / {images.length}
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 bg-[--primary-color] text-white text-xs font-semibold px-3 py-1.5 rounded-md">
                      {category || 'Property Type'}
                    </div>
                  </div>
                ) : (
                  <div className="h-64 bg-gray-800 flex items-center justify-center text-[--text-secondary]">
                    📸 Add images to see them here
                  </div>
                )}

                {/* Content Preview */}
                <div className="p-5">
                  <h4 className="text-xl font-bold mb-2">{title || 'Your Property Title'}</h4>
                  <p className="text-sm text-[--text-secondary] mb-3">
                    📍 {location?.address || addressInput || 'Location will appear here'}
                  </p>

                  <div className="flex gap-4 mb-3">
                    <div className="bg-white/5 px-3 py-1.5 rounded-lg">
                      <span className="text-lg font-bold text-[--primary-color]">
                        ${price || '0'}<span className="text-sm text-[--text-secondary]">/mo</span>
                      </span>
                    </div>
                    <div className="bg-white/5 px-3 py-1.5 rounded-lg">
                      <span className="text-sm text-[--text-secondary]">
                        {squareFeet || '0'} sq ft
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-[--text-secondary] line-clamp-3">
                    {description || 'Your description will appear here...'}
                  </p>

                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-[--border-color]">
                    <span className="text-xs text-[--text-secondary]">Just now</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowPreview(false)}
                className="w-full mt-4 px-6 py-3 rounded-lg font-semibold bg-[--primary-color] text-white hover:opacity-90 transition-opacity"
              >
                Close Preview
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default PostRentalForm;