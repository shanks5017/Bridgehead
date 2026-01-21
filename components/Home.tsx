import React, { useRef, useEffect, useState } from 'react';
import { View } from '../types';
import { ArrowRightIcon, PlusIcon, SparklesIcon, LocationPinIcon, SearchIcon, RocketIcon, LightBulbIcon, BuildingOfficeIcon, QuoteIcon } from './icons';
import HeroAnimation from './HeroAnimation';

interface HomeProps {
    setView: (view: View) => void;
}

const FeatureCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    buttonText: string;
    onClick: () => void;
}> = ({ icon, title, description, buttonText, onClick }) => (
    <div className="bg-[--card-color] border border-[--border-color] rounded-[2.5rem] p-8 flex flex-col items-start h-full feature-card group relative overflow-hidden transition-all duration-300 hover:border-red-500/50 hover:shadow-2xl hover:shadow-red-500/10 hover:scale-[1.02]">

        {/* Glow effect on hover (Card) */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <div className="w-14 h-14 rounded-2xl bg-[--bg-color] border border-[--border-color] flex items-center justify-center mb-6 relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:border-red-500/30 group-hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]">
            <div className="transform transition-transform duration-300 group-hover:scale-110">
                {icon}
            </div>
        </div>

        <h3 className="text-2xl font-bold mb-3 relative z-10">{title}</h3>
        <p className="text-[--text-secondary] flex-grow mb-8 relative z-10 leading-relaxed">{description}</p>

        <button
            onClick={onClick}
            className="w-full mt-auto relative z-10 flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-base font-bold text-white transition-all duration-300 overflow-hidden group/btn bg-gradient-to-r from-red-600 via-red-500 to-red-600 shadow-lg shadow-red-500/20 hover:shadow-red-500/40"
            style={{
                backgroundSize: '200% 100%',
                backgroundImage: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #dc2626 100%)'
            }}
        >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-white/20 to-red-600/0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"
                style={{
                    animation: 'shimmer 2s infinite linear'
                }}
            />

            <span className="relative z-10">{buttonText}</span>
            <ArrowRightIcon className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover/btn:translate-x-1" />
        </button>
    </div>
);


// Section: How It Works
const HowItWorks = React.forwardRef<HTMLDivElement>((props, ref) => (
    <div ref={ref} className="py-20 px-4 bg-[--card-color]/30">
        <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-4">How Bridgehead Works</h2>
            <p className="text-lg text-[--text-secondary] max-w-3xl mx-auto mb-16">In just three simple steps, turn community needs into real opportunities.</p>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-16 gap-y-12">
                <div className="flex flex-col items-center text-center how-it-works-step">
                    <div className="w-24 h-24 rounded-full border-2 border-[--border-color] bg-[--bg-color] flex items-center justify-center mb-4 how-it-works-icon"><PlusIcon className="w-10 h-10 text-[--primary-color]" /></div>
                    <h3 className="text-2xl font-bold mb-2">1. Voice a Need</h3>
                    <p className="text-[--text-secondary]">Share what your area is missing. From a cozy bookstore to a public park, your ideas matter.</p>
                </div>
                <div className="flex flex-col items-center text-center how-it-works-step">
                    <div className="w-24 h-24 rounded-full border-2 border-[--border-color] bg-[--bg-color] flex items-center justify-center mb-4 how-it-works-icon"><SearchIcon className="w-10 h-10 text-[--primary-color]" /></div>
                    <h3 className="text-2xl font-bold mb-2">2. Discover Opportunities</h3>
                    <p className="text-[--text-secondary]">Browse ideas and get matched with real, available commercial properties in promising locations.</p>
                </div>
                <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-full border-2 border-[--border-color] bg-[--bg-color] flex items-center justify-center mb-4 how-it-works-icon"><RocketIcon className="w-10 h-10 text-[--primary-color]" /></div>
                    <h3 className="text-2xl font-bold mb-2">3. Launch Your Venture</h3>
                    <p className="text-[--text-secondary]">Turn those community-backed ideas into successful businesses with our data and support tools.</p>
                </div>
            </div>
        </div>
    </div>
));

// Section: Success Stories
const SuccessStories = () => (
    <div className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-4">From Idea to Impact</h2>
            <p className="text-lg text-[--text-secondary] max-w-3xl mx-auto mb-16">See how communities and entrepreneurs are shaping the future together.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                    { img: 'https://picsum.photos/seed/cafe/600/400', title: 'A Café That Changed Main Street', description: 'A community demand for a local coffee shop sparked an entrepreneur to open "The Daily Grind," now a beloved neighborhood hub.' },
                    { img: 'https://picsum.photos/seed/bookstore/600/400', title: 'The Bookstore That Reading Built', description: 'After dozens of upvotes, a vacant storefront was transformed into a thriving independent bookstore, thanks to a passionate founder.' },
                    { img: 'https://picsum.photos/seed/park/600/400', title: 'From Vacant Lot to Vibrant Park', description: 'Bridgehead helped organize community interest, leading to a partnership that created a new public green space for everyone to enjoy.' },
                ].map(story => (
                    <div key={story.title} className="bg-[--card-color] rounded-[2.5rem] overflow-hidden group relative border-2 border-[--border-color] transition-all duration-300 hover:border-red-600 hover:shadow-2xl hover:shadow-red-900/50 hover:scale-[1.02]">

                        <div className="overflow-hidden h-56 relative z-0">
                            <img src={story.img} alt={story.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <div className="p-6 text-left relative z-20">
                            <h3 className="text-xl font-bold mb-2">{story.title}</h3>
                            <p className="text-[--text-secondary]">{story.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// Custom hook for animating numbers
const useAnimatedCounter = (targetValue: number, duration: number = 2000) => {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const element = ref.current;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    let startTimestamp: number | null = null;
                    const step = (timestamp: number) => {
                        if (!startTimestamp) startTimestamp = timestamp;
                        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                        setCount(Math.floor(progress * targetValue));
                        if (progress < 1) {
                            window.requestAnimationFrame(step);
                        }
                    };
                    window.requestAnimationFrame(step);
                    if (element) observer.unobserve(element);
                }
            },
            { threshold: 0.5 }
        );

        if (element) {
            observer.observe(element);
        }

        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
    }, [targetValue, duration]);

    return { count, ref };
};

// Section: Community Insights
const CommunityInsights = () => {
    const ideas = useAnimatedCounter(1200);
    const opportunities = useAnimatedCounter(300);
    const properties = useAnimatedCounter(85);

    return (
        <div className="py-20 px-4 bg-[--card-color]/30">
            <div className="max-w-6xl mx-auto text-center">
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-16">Bridgehead in Action</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-[--card-color] border-2 border-[--border-color] rounded-[2.5rem] p-8 stat-card transition-all duration-300 hover:border-red-600 hover:shadow-2xl hover:shadow-red-900/50 hover:scale-[1.02]">
                        <LightBulbIcon className="w-12 h-12 text-[--primary-color] mx-auto mb-4" />
                        <span ref={ideas.ref} className="block text-5xl font-bold text-[--primary-color]">{ideas.count.toLocaleString()}+</span>
                        <p className="text-[--text-secondary] mt-2">Community Ideas Shared</p>
                    </div>
                    <div className="bg-[--card-color] border-2 border-[--border-color] rounded-[2.5rem] p-8 stat-card transition-all duration-300 hover:border-red-600 hover:shadow-2xl hover:shadow-red-900/50 hover:scale-[1.02]">
                        <SparklesIcon className="w-12 h-12 text-[--primary-color] mx-auto mb-4" />
                        <span ref={opportunities.ref} className="block text-5xl font-bold text-[--primary-color]">{opportunities.count.toLocaleString()}+</span>
                        <p className="text-[--text-secondary] mt-2">Opportunities Explored</p>
                    </div>
                    <div className="bg-[--card-color] border-2 border-[--border-color] rounded-[2.5rem] p-8 stat-card transition-all duration-300 hover:border-red-600 hover:shadow-2xl hover:shadow-red-900/50 hover:scale-[1.02]">
                        <BuildingOfficeIcon className="w-12 h-12 text-[--primary-color] mx-auto mb-4" />
                        <span ref={properties.ref} className="block text-5xl font-bold text-[--primary-color]">{properties.count.toLocaleString()}+</span>
                        <p className="text-[--text-secondary] mt-2">Properties Listed</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Section: AI Generator CTA
const AIGeneratorCTA: React.FC<{ setView: (view: View) => void }> = ({ setView }) => (
    <div className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center bg-[--card-color] border border-[--border-color] rounded-[2.5rem] p-12 relative overflow-hidden group hover:border-red-500/30 transition-all duration-300">
            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tighter mb-4 relative z-10">Got an Area in Mind?<br />Let Our AI Suggest Businesses.</h2>
            <p className="text-lg text-[--text-secondary] max-w-2xl mx-auto mb-8 relative z-10">Enter your location and discover tailored business ideas in seconds, powered by real-world data.</p>
            <button
                onClick={() => setView(View.AI_SUGGESTIONS)}
                className="relative group/btn flex items-center justify-center gap-3 px-8 py-4 rounded-full text-lg font-bold text-white transition-all duration-300 overflow-hidden bg-gradient-to-r from-red-600 via-red-500 to-red-600 shadow-lg shadow-red-500/20 hover:shadow-red-500/40 mx-auto"
                style={{
                    backgroundSize: '200% 100%',
                    backgroundImage: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #dc2626 100%)'
                }}
            >
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-white/20 to-red-600/0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"
                    style={{
                        animation: 'shimmer 2s infinite linear'
                    }}
                />

                <SparklesIcon className="w-6 h-6 relative z-10 transition-transform duration-300 group-hover/btn:scale-110 group-hover/btn:rotate-12" />
                <span className="relative z-10">Generate Ideas Now</span>
            </button>
        </div>
    </div>
);

// Section: Testimonials
const Testimonials = () => (
    <div className="py-20 px-4 bg-[--card-color]/30">
        <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-4">What Our Users Say</h2>
            <p className="text-lg text-[--text-secondary] max-w-3xl mx-auto mb-16">Real feedback from entrepreneurs and residents.</p>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {[
                    { name: 'Ritu Sharma', role: 'Local Entrepreneur', quote: 'Bridgehead gave me the confidence to launch my cafe. Seeing the community demand firsthand was a game-changer.' },
                    { name: 'David Chen', role: 'Community Member', quote: 'I never thought my idea for a tool library would go anywhere. Now it\'s a real place people use every day. It\'s incredible.' },
                    { name: 'Maria Garcia', role: 'Property Owner', quote: 'Listing my vacant property was simple, and I found the perfect tenant who is truly invested in our neighborhood\'s success.' },
                ].map(testimonial => (
                    <div key={testimonial.name} className="bg-[--card-color] border border-[--border-color] rounded-[2.5rem] p-8 text-left testimonial-card">
                        <QuoteIcon className="quote-icon" />
                        <p className="text-lg text-white mb-6 relative z-10">"{testimonial.quote}"</p>
                        <div className="flex items-center">
                            <img src={`https://i.pravatar.cc/48?u=${testimonial.name}`} alt={testimonial.name} className="w-12 h-12 rounded-full mr-4" />
                            <div>
                                <p className="font-bold text-white">{testimonial.name}</p>
                                <p className="text-[--text-secondary]">{testimonial.role}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);


// Section: Join The Movement CTA
const JoinTheMovementCTA: React.FC<{ onLearnMoreClick: () => void }> = ({ onLearnMoreClick }) => (
    <div className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-4">Be Part of the Change</h2>
            <p className="text-lg text-[--text-secondary] max-w-2xl mx-auto mb-8">Join thousands of people shaping better neighborhoods through ideas and innovation.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button className="relative px-8 py-4 w-full sm:w-auto rounded-full text-lg font-bold text-white transition-all duration-300 overflow-hidden group/btn bg-gradient-to-r from-red-600 via-red-500 to-red-600 shadow-lg shadow-red-500/20 hover:shadow-red-500/40"
                    style={{
                        backgroundSize: '200% 100%',
                        backgroundImage: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #dc2626 100%)'
                    }}
                >
                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-white/20 to-red-600/0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"
                        style={{
                            animation: 'shimmer 2s infinite linear'
                        }}
                    />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        Join Bridgehead
                        <ArrowRightIcon className="w-5 h-5 transition-transform duration-300 group-hover/btn:translate-x-1" />
                    </span>
                </button>
                <button onClick={onLearnMoreClick} className="px-8 py-4 w-full sm:w-auto rounded-full text-lg font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors">
                    Learn More
                </button>
            </div>
        </div>
    </div>
);

// Section: Newsletter
const Newsletter = () => (
    <div className="py-20 px-4 bg-[--card-color]/30">
        <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-2">Stay in the Loop</h2>
            <p className="text-[--text-secondary] mb-6">Get updates on trending business ideas and local opportunities.</p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={e => e.preventDefault()}>
                <input type="email" placeholder="Enter your email" required className="flex-grow w-full bg-transparent border-2 border-[--border-color] rounded-full px-4 py-3 placeholder-[--text-secondary] focus:outline-none focus:ring-2 focus:ring-[--primary-color] focus:border-transparent transition-all duration-300" />
                <button type="submit" className="relative px-6 py-3 rounded-full font-bold text-white transition-all duration-300 overflow-hidden group/btn bg-gradient-to-r from-red-600 via-red-500 to-red-600 shadow-lg shadow-red-500/20 hover:shadow-red-500/40"
                    style={{
                        backgroundSize: '200% 100%',
                        backgroundImage: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #dc2626 100%)'
                    }}
                >
                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-white/20 to-red-600/0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"
                        style={{
                            animation: 'shimmer 2s infinite linear'
                        }}
                    />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        Subscribe
                        <ArrowRightIcon className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                    </span>
                </button>
            </form>
            <p className="text-xs text-[--text-secondary] mt-4">No spam, just smart opportunities.</p>
        </div>
    </div>
);

const CubeSvg = () => (
    <svg viewBox="-100 -100 200 200" className="hero-3d-object w-full h-full">
        {/* Faces for subtle reflection effect */}
        <g className="cube-faces">
            {/* Back faces (drawn first) */}
            <polygon points="-20,-60 60,-60 60,20 -20,20" /> {/* Back */}
            <polygon points="-40,40 40,40 60,20 -20,20" /> {/* Bottom */}
            <polygon points="-40,-40 -40,40 -20,20 -20,-60" /> {/* Left Side */}
            {/* Front faces (drawn last to be on top) */}
            <polygon points="-40,-40 40,-40 60,-60 -20,-60" /> {/* Top */}
            <polygon points="40,-40 40,40 60,20 60,-60" /> {/* Right Side */}
            <polygon points="-40,-40 40,-40 40,40 -40,40" /> {/* Front */}
        </g>
        {/* Edges for neon glow */}
        <g className="cube-edges">
            {/* Front square */}
            <line x1="-40" y1="-40" x2="40" y2="-40" />
            <line x1="-40" y1="40" x2="40" y2="40" />
            <line x1="-40" y1="-40" x2="-40" y2="40" />
            <line x1="40" y1="-40" x2="40" y2="40" />
            {/* Back square */}
            <line x1="-20" y1="-60" x2="60" y2="-60" />
            <line x1="-20" y1="20" x2="60" y2="20" />
            <line x1="-20" y1="-60" x2="-20" y2="20" />
            <line x1="60" y1="-60" x2="60" y2="20" />
            {/* Connecting lines */}
            <line x1="-40" y1="-40" x2="-20" y2="-60" />
            <line x1="40" y1="-40" x2="60" y2="-60" />
            <line x1="-40" y1="40" x2="-20" y2="20" />
            <line x1="40" y1="40" x2="60" y2="20" />
        </g>
    </svg>
);


const Home: React.FC<HomeProps> = ({ setView }) => {
    const parallaxRef = useRef<HTMLDivElement>(null);
    const heroRef = useRef<HTMLDivElement>(null);
    const howItWorksRef = useRef<HTMLDivElement>(null);
    const [featuresVisible, setFeaturesVisible] = useState(false);

    useEffect(() => {
        // Trigger animation shortly after component mounts for a smooth entrance.
        const timer = setTimeout(() => {
            setFeaturesVisible(true);
        }, 300);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const handleMouseMoveParallax = (e: MouseEvent) => {
            if (parallaxRef.current) {
                const { clientX, clientY } = e;
                const x = (clientX - window.innerWidth / 2) / -50;
                const y = (clientY - window.innerHeight / 2) / -50;

                requestAnimationFrame(() => {
                    if (parallaxRef.current) {
                        parallaxRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
                    }
                });
            }
        };

        window.addEventListener('mousemove', handleMouseMoveParallax);

        return () => {
            window.removeEventListener('mousemove', handleMouseMoveParallax);
        };
    }, []);

    useEffect(() => {
        const heroElement = heroRef.current;
        if (!heroElement) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = heroElement.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            requestAnimationFrame(() => {
                heroElement.style.setProperty('--glow-x', `${x}px`);
                heroElement.style.setProperty('--glow-y', `${y}px`);
            });
        };

        const handleMouseEnter = () => {
            heroElement.style.setProperty('--glow-opacity', '1');
        };

        const handleMouseLeave = () => {
            heroElement.style.setProperty('--glow-opacity', '0');
        };

        heroElement.addEventListener('mousemove', handleMouseMove);
        heroElement.addEventListener('mouseenter', handleMouseEnter);
        heroElement.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            heroElement.removeEventListener('mousemove', handleMouseMove);
            heroElement.removeEventListener('mouseenter', handleMouseEnter);
            heroElement.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    const featuresData = [
        {
            icon: <PlusIcon className="w-6 h-6 text-[--primary-color]" />,
            title: "Post a Demand",
            description: "Is your neighborhood missing a late-night cafe, a dog park, or a unique retail shop? Post it here and let entrepreneurs know what the community wants.",
            buttonText: "Voice a Need",
            onClick: () => setView(View.POST_DEMAND),
        },
        {
            icon: <SparklesIcon className="w-6 h-6 text-[--primary-color]" />,
            title: "Discover Opportunities",
            description: "Browse demands from communities and find available commercial properties. Our AI can even help you generate business ideas tailored to the location.",
            buttonText: "Explore Demands",
            onClick: () => setView(View.DEMAND_FEED),
        },
        {
            icon: <LocationPinIcon className="w-6 h-6 text-[--primary-color]" />,
            title: "List Your Property",
            description: "Have a commercial space for rent? List it on Bridgehead to connect directly with entrepreneurs actively looking for a place to launch their next business.",
            buttonText: "List a Rental",
            onClick: () => setView(View.POST_RENTAL),
        },
    ];

    return (
        <div className="w-full">
            {/* Hero Section */}
            <div ref={heroRef} className="min-h-[calc(100vh-4rem)] hero-section relative flex flex-col items-center justify-center text-center px-4 overflow-hidden">

                {/* Dark Vignette Effect */}
                <div id="hero-vignette-overlay"></div>

                {/* 3D Background Animation */}
                <div className="absolute inset-0 z-0 grid place-items-center opacity-40">
                    <div ref={parallaxRef} className="w-full max-w-3xl h-[28rem] transition-transform duration-75 ease-out">
                        <div className="w-full h-full scene">
                            <div className="hero-3d-object-container">
                                {/* Cube 1 - positioned down and left */}
                                <div className="absolute inset-0 transform -translate-x-1/4 translate-y-1/4">
                                    <CubeSvg />
                                </div>
                                {/* Cube 2 - positioned up and right */}
                                <div className="absolute inset-0 transform translate-x-1/4 -translate-y-1/4">
                                    <CubeSvg />
                                </div>
                                {/* Cube 3 - new, layered in */}
                                <div className="absolute inset-0 transform -translate-x-1/3 -translate-y-1/3 scale-90 opacity-80">
                                    <CubeSvg />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Particle Network Animation */}
                <HeroAnimation />

                <div className="max-w-4xl mx-auto relative z-10 text-center">
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6">
                        <span className="bg-clip-text text-transparent bg-gradient-to-br from-white to-gray-400">Find the Next Big Thing.</span>
                        <br />
                        <span className="text-[--primary-color]">Right Here.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-[--text-secondary] max-w-3xl mx-auto">
                        Bridgehead connects community needs with entrepreneurs. Voice what your neighborhood is missing, or find the perfect opportunity to launch your next venture.
                    </p>
                </div>

            </div>

            {/* Feature Cards Section */}
            <div className="py-24 px-4 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto w-full">
                    {featuresData.map((feature, index) => (
                        <div
                            key={feature.title}
                            className={`transition-all duration-1000 ease-out ${featuresVisible
                                ? 'opacity-100 translate-y-0'
                                : 'opacity-0 translate-y-10'
                                }`}
                            style={{ transitionDelay: `${index * 250}ms` }}
                        >
                            <FeatureCard
                                icon={feature.icon}
                                title={feature.title}
                                description={feature.description}
                                buttonText={feature.buttonText}
                                onClick={feature.onClick}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* NEW SECTIONS START HERE */}
            <HowItWorks ref={howItWorksRef} />
            <SuccessStories />
            <CommunityInsights />
            <AIGeneratorCTA setView={setView} />
            <Testimonials />
            <JoinTheMovementCTA onLearnMoreClick={() => howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' })} />
            <Newsletter />
        </div>
    );
};

export default Home;
