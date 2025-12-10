import React, { useState } from 'react';
import { RentalPost, Location, View } from '../types';
import { Input, TextArea, FileInput } from './common/FormComponents';
import { LocationPinIcon, LoadingSpinner } from './icons';
import { reverseGeocode, geocode } from '../services/geminiService';

interface PostRentalFormProps {
  addRentalPost: (post: Omit<RentalPost, 'id' | 'createdAt'>) => void;
  setView: (view: View) => void;
}

type LocationStatus = 'idle' | 'getting_coords' | 'geocoding' | 'success' | 'error';

const PostRentalForm: React.FC<PostRentalFormProps> = ({ addRentalPost, setView }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [squareFeet, setSquareFeet] = useState('');
  const [location, setLocation] = useState<Location | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [locationError, setLocationError] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [openToCollaboration, setOpenToCollaboration] = useState(true);

  const handleFileSelect = (files: File[]) => {
    const readers = files.map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });
    Promise.all(readers).then(base64Images => {
      setImages(prev => [...prev, ...base64Images]);
    });
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
    const newPost: Omit<RentalPost, 'id' | 'createdAt'> = {
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
    addRentalPost(newPost);
    setView(View.RENTAL_LISTINGS);
  };
  
  const isLocating = locationStatus === 'getting_coords' || locationStatus === 'geocoding';

  return (
    <div className="min-h-screen flex items-center justify-center py-12">
        <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto bg-[--card-color] border border-[--border-color] rounded-xl p-8 space-y-6">
            <h2 className="text-3xl font-bold text-center">List a Commercial Property</h2>
            <p className="text-center text-[--text-secondary]">Connect with entrepreneurs looking for their next location.</p>
            
            <Input label="Property Title" placeholder="e.g., Prime Downtown Retail Space" value={title} onChange={e => setTitle(e.target.value)} required />
            <Input label="Property Type" placeholder="e.g., Retail, Office, Warehouse" value={category} onChange={e => setCategory(e.target.value)} required />
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

            <FileInput label="Upload Images" onFilesSelected={handleFileSelect} imagePreviews={images} accept="image/*" />

            <button type="submit" className="w-full mt-4 px-6 py-4 rounded-lg text-lg font-semibold bg-[--primary-color] text-white hover:opacity-90 transition-opacity">
                List Property
            </button>
        </form>
    </div>
  );
};

export default PostRentalForm;