
import React, { useState } from 'react';
import { generateBusinessIdeas } from '../services/geminiService';
import { DemandPost } from '../types';
import { LoadingSpinner, LocationPinIcon, SparklesIcon, SearchIcon } from './icons';
import { LoadingState } from './LandingPages';
import { GenerateContentResponse, GroundingChunk } from '@google/genai';

interface AISuggestionsProps {
  demands: DemandPost[];
}

const markdownToHtml = (text: string) => {
    if (!text) return '';
    let html = text;
    // Headings
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-4 mb-2">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-6 mb-3">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>');
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // List items
    html = html.replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc">$1</li>');
    html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal">$1</li>');
    // Group list items
    html = html.replace(/<\/li>\n<li/g, '</li><li');
    html = html.replace(/(<li.*<\/li>)/gs, '<ul>$1</ul>');
    html = html.replace(/<\/ul>\s*<ul>/g, ''); // Fix consecutive lists
    // Paragraphs
    html = html.split('\n').map(line => line.trim() === '' ? '' : (line.startsWith('<') ? line : `<p>${line}</p>`)).join('');
    
    return html;
};

const AISuggestions: React.FC<AISuggestionsProps> = ({ demands }) => {
  const [response, setResponse] = useState<GenerateContentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isDeepDive, setIsDeepDive] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError('');
    
    const getLocation = new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
        if (location) return resolve(location);
        if (!navigator.geolocation) {
          reject(new Error("Geolocation is not supported by your browser."));
          return;
        }
        navigator.geolocation.getCurrentPosition(
          position => {
            const { latitude, longitude } = position.coords;
            setLocation({ latitude, longitude });
            resolve({ latitude, longitude });
          },
          () => {
            reject(new Error("Unable to retrieve your location. Please enable location services."));
          }
        );
    });

    try {
        const userLocation = await getLocation;
        const result = await generateBusinessIdeas(userLocation, demands, isDeepDive);
        setResponse(result);
    } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleRegenerate = () => {
    setResponse(null);
    handleGenerate();
  };

  const GroundingSources: React.FC<{ chunks: GroundingChunk[] | undefined }> = ({ chunks }) => {
    if (!chunks || chunks.length === 0) return null;

    return (
        <div className="mt-8 border-t border-[--border-color] pt-4">
            <h4 className="text-lg font-semibold text-[--text-secondary]">Sources</h4>
            <ul className="mt-2 space-y-2">
                {chunks.map((chunk, index) => {
                    if (chunk.web) {
                        return <li key={index} className="text-sm truncate"><a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-400 hover:underline"><SearchIcon className="w-4 h-4 text-[--text-secondary]"/>{chunk.web.title}</a></li>;
                    }
                    if (chunk.maps) {
                         return <li key={index} className="text-sm truncate"><a href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-green-400 hover:underline"><LocationPinIcon className="w-4 h-4 text-[--text-secondary]"/>{chunk.maps.title}</a></li>;
                    }
                    return null;
                })}
            </ul>
        </div>
    )
  }

  // Initial, pre-generation view
  if (!response && !isLoading) {
    return (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center px-4">
            <SparklesIcon className="w-16 h-16 mx-auto text-[--primary-color] mb-4" />
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-4">AI Business Idea Generator</h1>
            <p className="text-lg text-[--text-secondary] max-w-2xl mx-auto mb-8">
                Leverage AI to discover business opportunities tailored to your area, based on real community demands and live Google Search data.
            </p>
            <div className="flex flex-col items-center gap-4">
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="px-8 py-4 rounded-lg text-lg font-semibold bg-[--primary-color] text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mx-auto"
                >
                    <LocationPinIcon className="w-6 h-6" />
                    Generate Ideas for My Location
                </button>
                <div className="flex items-center space-x-2 text-[--text-secondary]">
                    <input type="checkbox" id="deep-dive" checked={isDeepDive} onChange={() => setIsDeepDive(!isDeepDive)} className="form-checkbox h-5 w-5 rounded bg-transparent border-2 border-[--border-color] text-[--primary-color] focus:ring-[--primary-color]"/>
                    <label htmlFor="deep-dive" className="text-sm">Deep Dive Analysis (Slower, More Detailed)</label>
                </div>
            </div>
            {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
    );
  }

  // Loading and Results View
  return (
    <div className="min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {isLoading && !response ? (
                <LoadingState message={isDeepDive ? "Performing deep dive analysis..." : "Fetching your location and analyzing local demands..."} />
            ) : (
                <div className="w-full max-w-4xl mx-auto bg-[--card-color] border border-[--border-color] rounded-xl p-8">
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={handleRegenerate}
                            disabled={isLoading}
                            className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? <LoadingSpinner className="w-5 h-5" /> : <SparklesIcon className="w-5 h-5" />}
                            {isLoading ? (isDeepDive ? 'Thinking...' : 'Generating...') : 'Regenerate'}
                        </button>
                    </div>
                    <div 
                        className="prose-output" 
                        dangerouslySetInnerHTML={{ __html: markdownToHtml(response?.text || '') }} 
                    />
                    <GroundingSources chunks={response?.candidates?.[0]?.groundingMetadata?.groundingChunks} />
                </div>
            )}
             {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
        </div>
    </div>
  );
};

export default AISuggestions;
