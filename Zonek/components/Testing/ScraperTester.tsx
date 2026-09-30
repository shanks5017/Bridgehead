import React, { useState, useEffect, useRef } from 'react';
import indianCities from '../../constants/indian_cities.json';

interface ScrapedListing {
    title: string;
    description: string;
    images: string[];
    listing_url: string;
    rent_per_month: number;
    area_sqft: number;
    locality: string;
    property_type: string;
}

interface ScraperTesterProps {
    platformId: string;
    platformName: string;
}

const ScraperTester: React.FC<ScraperTesterProps> = ({ platformId, platformName }) => {
    const [city, setCity] = useState('Bangalore');
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<ScrapedListing[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<any>(null);

    const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
    const [showCitySuggestions, setShowCitySuggestions] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowCitySuggestions(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setCity(val);
        if (val.trim().length >= 3) {
            const filtered = (indianCities as string[]).filter(c => 
                c.toLowerCase().startsWith(val.trim().toLowerCase())
            ).slice(0, 8);
            setCitySuggestions(filtered);
            setShowCitySuggestions(true);
        } else {
            setShowCitySuggestions(false);
        }
    };

    const handleCitySelect = (selectedCity: string) => {
        setCity(selectedCity);
        setShowCitySuggestions(false);
    };

    const handleRunScraper = async () => {
        setIsLoading(true);
        setError(null);
        setResults(null);
        setStats(null);

        try {
            const response = await fetch('http://localhost:8001/api/v1/rentals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    location: `${city}`,
                    platforms: [platformId],
                    use_fast_geocode: true,
                    limit: 100
                }),
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.detail || 'Failed to fetch from scraper API');
            }

            // Find the correct key since it might be uppercase or lowercase
            const listingsPlatformKey = Object.keys(data.listings_by_platform || {}).find(
                key => key.toLowerCase() === platformId.toLowerCase()
            );
            const statsPlatformKey = Object.keys(data.platforms || {}).find(
                key => key.toLowerCase() === platformId.toLowerCase()
            );

            setResults(listingsPlatformKey ? data.listings_by_platform[listingsPlatformKey] : []);
            setStats(statsPlatformKey ? data.platforms[statsPlatformKey] : {});
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div className="mb-6">
                <div ref={wrapperRef} className="relative">
                    <label className="block text-xs font-mono uppercase tracking-widest text-ink/70 mb-2">City</label>
                    <input
                        type="text"
                        value={city}
                        onChange={handleCityChange}
                        onFocus={() => { if (city.length >= 3) setShowCitySuggestions(true); }}
                        className="w-full p-3 bg-white neo-border font-mono text-sm focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green"
                    />
                    {showCitySuggestions && citySuggestions.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white neo-border mt-1 max-h-60 overflow-auto shadow-lg">
                            {citySuggestions.map((suggestion, idx) => (
                                <li
                                    key={idx}
                                    className="p-3 hover:bg-accent-green hover:text-ink cursor-pointer font-mono text-sm transition-colors border-b border-ink/10 last:border-b-0"
                                    onClick={() => handleCitySelect(suggestion)}
                                >
                                    {suggestion}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <button
                onClick={handleRunScraper}
                disabled={isLoading || !city}
                className="mb-8 bg-accent-green text-foundation neo-border px-8 py-3 font-mono font-bold uppercase tracking-widest hover:bg-ink hover:text-accent-green transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? `Running ${platformName} Scraper...` : `Run ${platformName} Scraper`}
            </button>

            {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 font-mono text-sm mb-8">
                    Error: {error}
                </div>
            )}

            {stats && (
                <div className="mb-6 p-4 bg-ink/5 border border-ink/10 font-mono text-sm">
                    <strong>Status:</strong> {stats.status} | <strong>Found:</strong> {stats.count} listings | <strong>Time:</strong> {stats.elapsed_s}s
                </div>
            )}

            {results && results.length === 0 && (
                <p className="font-mono text-ink/50 text-center py-8">No listings found for this exact locality on {platformName}.</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results?.map((listing, index) => (
                    <div key={index} className="flex flex-col neo-border bg-white overflow-hidden group">
                        <div className="h-48 bg-ink/5 relative border-b border-ink">
                            {listing.images && listing.images.length > 0 ? (
                                <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full font-mono text-ink/30 text-xs uppercase tracking-widest">No Image</div>
                            )}
                            <div className="absolute top-2 right-2 bg-accent-green text-ink font-bold font-mono text-xs px-2 py-1 uppercase tracking-widest border border-ink">
                                {platformName}
                            </div>
                        </div>
                        <div className="p-4 flex flex-col flex-grow">
                            <h3 className="font-bold font-mono text-sm line-clamp-2 mb-2 group-hover:text-accent-green transition-colors">{listing.title}</h3>
                            <p className="text-xs text-ink/70 font-mono line-clamp-2 mb-4 flex-grow">{listing.description}</p>
                            
                            <div className="flex justify-between items-end mt-auto pt-4 border-t border-ink/10">
                                <div>
                                    <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Rent</div>
                                    <div className="font-bold">₹{listing.rent_per_month?.toLocaleString() || 'N/A'}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Area</div>
                                    <div className="font-bold font-mono">{listing.area_sqft || 'N/A'} sqft</div>
                                </div>
                            </div>
                            <a 
                                href={listing.listing_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="mt-4 block text-center py-2 bg-ink text-foundation font-mono text-xs uppercase tracking-widest hover:bg-accent-green hover:text-ink neo-border transition-colors"
                            >
                                View on {platformName}
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ScraperTester;
