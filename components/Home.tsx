import React from 'react';
import { View } from '../types';
import { ArrowRightIcon, SparklesIcon, LightBulbIcon, BuildingOfficeIcon, UsersIcon } from './icons';

interface HomeProps {
    setView: (view: View) => void;
}

// -----------------------------------------------------------------------------
// REUSABLE SUB-COMPONENTS (BUSINESS-TIER)
// -----------------------------------------------------------------------------

const StatCard: React.FC<{ label: string; value: string; pulse?: boolean }> = ({ label, value, pulse }) => (
    <div className="bg-white p-8 border border-ink space-y-4 relative overflow-hidden group hover:bg-foundation/10 transition-colors">
        <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-widest opacity-50">{label}</span>
            {pulse && <span className="w-2 h-2 bg-[#22C55E] rounded-full animate-pulse-green" title="LIVE" />}
        </div>
        <div className="text-5xl font-serif-italic font-bold tracking-tighter group-hover:translate-x-1 transition-transform">{value}</div>
    </div>
);

const ProtocolStep: React.FC<{ number: string; title: string; body: string; highlight?: boolean }> = ({ number, title, body, highlight }) => (
    <div className={`border border-ink p-8 flex flex-col hover:neo-shadow-sm transition-all group ${highlight ? 'bg-accent-green/5 border-l-4 border-l-accent-green' : 'bg-white'}`}>
        <div className="text-xs font-mono opacity-30 mb-8 tracking-widest uppercase">{number} — PROTOCOL</div>
        <h3 className="text-3xl font-serif-italic font-bold mb-6 tracking-tight uppercase leading-none group-hover:translate-x-1 transition-transform">{title}</h3>
        <p className="text-md opacity-60 leading-relaxed font-medium italic">
            {body}
        </p>
    </div>
);

const EngineFeedRow: React.FC<{ status: string; signal: string; detail: string; time: string; type: 'gap' | 'match' }> = ({ status, signal, detail, time, type }) => (
    <div className="border-b border-foundation/10 p-4 last:border-0 animate-feed-row">
        <div className="flex justify-between items-start mb-1">
            <span className={`flex items-center gap-2 text-[10px] font-mono font-bold tracking-widest ${type === 'match' ? 'text-accent-blue' : 'text-[#22C55E]'}`}>
                <span className={`w-1.5 h-1.5 ${type === 'match' ? 'bg-accent-blue' : 'bg-[#22C55E]'} rounded-full animate-pulse`} />
                {status}
            </span>
            <span className="text-[10px] font-mono opacity-40">{time}</span>
        </div>
        <div className="text-xs font-bold uppercase tracking-tight text-white mb-1">"{signal}"</div>
        <div className="text-[10px] font-mono opacity-50 uppercase tracking-widest">{detail}</div>
    </div>
);

const EconomicCard: React.FC<{ status: string; urgency: string; text: string; location: string; agreement: string; footfall: string }> = ({ status, urgency, text, location, agreement, footfall }) => (
    <div className="bg-white border border-ink p-6 hover:neo-shadow-sm transition-all group">
        <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4">
                <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-widest text-[#22C55E]">
                    <span className="w-1.5 h-1.5 bg-[#22C55E] rounded-full animate-pulse" />
                    {status}
                </span>
                <span className="text-[10px] font-mono font-bold tracking-widest opacity-40 uppercase">{urgency}</span>
            </div>
        </div>
        <div className="text-xl font-bold uppercase tracking-tight mb-4 leading-tight">"{text}"</div>
        <div className="space-y-4">
            <div className="text-[10px] font-mono uppercase tracking-widest">
                <span className="text-accent-green font-bold">{location}</span> · <span className="opacity-50">{agreement}</span>
            </div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-ink">{footfall}</div>
            <button className="flex items-center text-[10px] font-mono font-bold tracking-widest uppercase hover:gap-2 transition-all hover:text-accent-green pt-4 border-t border-ink/5 w-full">
                CLAIM THIS OPPORTUNITY <ArrowRightIcon className="w-3 h-3 ml-2" />
            </button>
        </div>
    </div>
);

const MoneyZoneCard: React.FC<{ type: 'HOT' | 'RISING' | 'WATCH'; location: string; count: string; status: string; topNeed: string }> = ({ type, location, count, status, topNeed }) => {
    const colorClass = type === 'HOT' ? 'text-[#22C55E]' : type === 'RISING' ? 'text-orange-500' : 'text-yellow-500';
    const dotClass = type === 'HOT' ? 'bg-[#22C55E]' : type === 'RISING' ? 'bg-orange-500' : 'bg-yellow-500';

    return (
        <div className="bg-[#141414] border border-foundation/20 p-8 space-y-6 hover:border-foundation/50 transition-colors group">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 ${dotClass} rounded-full animate-pulse`} />
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${colorClass}`}>{type} ZONE</span>
                </div>
            </div>
            <div className="text-3xl font-serif-italic font-bold text-white tracking-tight uppercase leading-none">{location}</div>
            <div className="space-y-4 pt-4 border-t border-foundation/10">
                <p className="text-xs font-mono text-foundation/60 leading-relaxed">
                    {count} want something here. {status}
                </p>
                <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-mono opacity-30 uppercase tracking-widest">#1 Need:</span>
                    <span className="text-md font-bold text-white uppercase tracking-tight">{topNeed}</span>
                </div>
            </div>
            <button className="text-[10px] font-mono font-bold tracking-widest uppercase text-white/40 group-hover:text-white transition-colors flex items-center">
                EXPLORE <ArrowRightIcon className="w-3 h-3 ml-2" />
            </button>
        </div>
    );
};

const PillarCard: React.FC<{ title: string; description: string; buttonText: string; onClick: () => void }> = ({ title, description, buttonText, onClick }) => (
    <div className="p-8 border-r border-b border-ink space-y-8 hover:bg-foundation/10 transition-colors group">
        <h3 className="text-3xl font-serif-italic font-bold border-b border-ink pb-4 uppercase">{title}</h3>
        <p className="text-sm opacity-60 leading-relaxed font-medium italic">
            {description}
        </p>
        <button onClick={onClick} className="text-xs font-bold uppercase tracking-widest group-hover:text-accent-blue flex items-center transition-colors">
            {buttonText} →
        </button>
    </div>
);

// -----------------------------------------------------------------------------
// MAIN COMPONENT (HOME)
// -----------------------------------------------------------------------------
// OPERATIONAL MASCOTS (10/10 AESTHETIC)
// -----------------------------------------------------------------------------

const AOTMascot: React.FC = () => (
    <div className="hidden lg:flex flex-col items-center select-none pointer-events-none">
        <div className="relative">
            {/* mascot Body - Large Scale Sharp Neo-Brutalist */}
            <div className="w-80 h-80 bg-[#22C55E] border-4 border-ink rounded-none neo-shadow-lg flex flex-col items-center justify-center gap-10 overflow-hidden relative group">
                {/* --- MASKED EYE SYSTEM --- */}
                <div className="flex gap-12 mb-4 animate-aot-eyes transform transition-transform duration-1000 relative">
                    <div className="w-10 h-10 bg-ink rounded-none shadow-[4px_4px_0_rgba(0,0,0,0.2)] animate-blink" />
                    <div className="w-10 h-10 bg-ink rounded-none shadow-[4px_4px_0_rgba(0,0,0,0.2)] animate-blink" />
                </div>

                {/* --- MASKED MOUTH SYSTEM --- */}
                <div className="bg-ink rounded-none relative overflow-hidden animate-aot-mouth flex items-center justify-center">
                </div>

                {/* Tactical Scanning Light */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-white/40 animate-scan-line-fast" />
            </div>
        </div>
    </div>
);

// -----------------------------------------------------------------------------


const Home: React.FC<HomeProps> = ({ setView }) => {
    return (
        <div className="w-full bg-foundation">
            {/* 🔲 HERO SECTION (Operational Refinement) */}
            <section className="bg-grid-simple px-6 md:px-12 pt-4 md:pt-8 pb-20 md:pb-32 border-b-2 border-ink relative overflow-hidden group">
                <div className="max-w-7xl mx-auto relative z-10">
                    {/* AOT Mascot Floating Layer */}
                    <div className="absolute top-1/2 -translate-y-1/2 right-0 md:right-12 lg:right-24">
                        <AOTMascot />
                    </div>

                    <div className="relative">
                        <h1 className="text-5xl md:text-7xl lg:text-[7.5rem] font-serif-italic font-black tracking-[calc(-0.04em)] leading-[0.82] uppercase mb-8">
                            OWN THE <span className="text-[#22C55E]">ZONE</span><br />
                            BEFORE YOU<br />
                            <span className="text-[#22C55E]">OPEN</span> THE DOOR.
                        </h1>
                    </div>

                    <div className="flex flex-col gap-6 mb-12">
                        <p className="text-sm md:text-base font-bold uppercase tracking-tight leading-relaxed opacity-40 max-w-xl">
                            ZONEK is the market intelligence infrastructure that gives entrepreneurs the ground-truth data needed to dominate local territories.
                        </p>
                    </div>

                    <div className="max-w-2xl space-y-8">
                        <div className="flex flex-col sm:flex-row gap-6">
                            <button onClick={() => setView(View.DEMAND_FEED)} className="neo-button bg-ink text-white text-xl px-12 py-5 border-2 border-ink hover:bg-white hover:text-ink transition-all">
                                EXPLORE OPPORTUNITIES
                            </button>
                            <button onClick={() => setView(View.POST_DEMAND)} className="neo-button bg-accent-green text-ink text-xl px-12 py-5 border-2 border-ink">
                                REQUEST A BUSINESS
                            </button>
                        </div>
                    </div>
                </div>

                {/* Live Ticker Strip */}
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-white border-t border-ink flex items-center overflow-hidden">
                    <div className="flex whitespace-nowrap animate-ticker items-center">
                        {[1, 2, 3].map((i) => (
                            <span key={i} className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] flex items-center gap-8 mx-8">
                                <span className="text-[#22C55E]">● LIVE</span>
                                <span>3,291 demands captured</span>
                                <span className="opacity-20">·</span>
                                <span>842 gaps unfilled</span>
                                <span className="opacity-20">·</span>
                                <span>156 matches made today</span>
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* 🔲 STATS BAR */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-b border-ink">
                <StatCard label="Voices Heard" value="3,292" pulse />
                <StatCard label="Gaps Still Open" value="842" pulse />
                <StatCard label="Businesses Matched" value="156" />
                <StatCard label="Neighborhoods Mapped" value="42" />
            </section>

            {/* 🔲 THE PROTOCOL */}
            <section className="px-6 md:px-12 py-24 border-b border-ink">
                <div className="max-w-7xl mx-auto">
                    <div className="pt-8 border-t border-ink/20 flex flex-col items-start gap-4">
                        <span className="text-[10px] font-mono tracking-widest uppercase opacity-40">— The ZONEK Development Team</span>
                        <div className="flex gap-4">
                        </div>
                        <h2 className="text-5xl md:text-8xl font-serif-italic font-bold tracking-tight mt-4 uppercase leading-none">
                            THE PROTOCOL
                        </h2>
                        <p className="text-xl md:text-2xl opacity-60 mt-4 leading-none font-medium">"How it works — in 60 seconds."</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-ink overflow-hidden">
                        <ProtocolStep
                            number="01"
                            title="WE LISTEN"
                            body="Every complaint, every wish, every 'why isn't there a ___ near me?' We capture it. We count it. We find out how many people feel the same. That's your business idea — proven before you spend a single rupee."
                        />
                        <ProtocolStep
                            number="02"
                            title="WE FIND THE PATTERN"
                            body="1,000 people want a laundromat in the same 2km radius. That's not a coincidence. That's a market. We score it, rank it, and tell you exactly how big the opportunity is."
                            highlight
                        />
                        <ProtocolStep
                            number="03"
                            title="WE MAKE THE INTRODUCTION"
                            body="The right business. The right building. The right neighborhood. We don't just show you a map. We hand you a matched opportunity — demand proven, location locked, ready to launch."
                        />
                    </div>
                </div>
            </section>

            {/* 🔲 THE ENGINE (Neural Core Redesign) */}
            <section className="bg-ink text-foundation px-6 md:px-12 py-32 border-b border-ink relative overflow-hidden">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                    <div className="space-y-12">
                        <div>
                            <span className="text-[10px] font-mono text-foundation/40 tracking-[0.4em] uppercase font-bold">ALWAYS ON  ·  ALWAYS MATCHING</span>
                            <h2 className="text-6xl md:text-8xl font-serif-italic font-bold tracking-tighter leading-[0.85] uppercase mt-8">
                                WHILE YOU SLEEP,<br />
                                <span className="text-white">WE'RE WORKING.</span>
                            </h2>
                        </div>

                        <p className="text-xl font-bold uppercase tracking-tight leading-tight">
                            We built ZONEK to close that gap permanently. 
                            By aggregating hard community signals with asset data, 
                            we ensure your first day in business is a win, not a gamble.
                        </p>

                        <div className="grid grid-cols-2 gap-x-12 gap-y-8 pt-8 border-t border-foundation/10">
                            <div>
                                <div className="text-5xl font-bold text-white font-serif-italic">99.2%</div>
                                <div className="text-[10px] font-mono uppercase tracking-widest opacity-40 mt-2">of matches are the right fit — verified by the community</div>
                            </div>
                            <div>
                                <div className="text-5xl font-bold text-white font-serif-italic">8,400</div>
                                <div className="text-[10px] font-mono uppercase tracking-widest opacity-40 mt-2">signals scored every single second</div>
                            </div>
                            <div>
                                <div className="text-5xl font-bold text-white font-serif-italic">&lt; 1 sec</div>
                                <div className="text-[10px] font-mono uppercase tracking-widest opacity-40 mt-2">from demand captured to match delivered</div>
                            </div>
                            <div>
                                <div className="text-5xl font-bold text-white font-serif-italic">0</div>
                                <div className="text-[10px] font-mono uppercase tracking-widest opacity-40 mt-2">guesswork. Every gap is community-proven.</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-foundation/5 border border-foundation/10 neo-shadow-sm">
                        <div className="p-4 border-b border-foundation/10 flex justify-between items-center bg-white/5">
                            <div className="text-[10px] font-mono font-bold tracking-widest opacity-50 uppercase">LIVE ACTIVITY ENGINE</div>
                            <div className="text-[10px] font-mono font-bold tracking-widest text-[#22C55E] animate-pulse uppercase">ACTIVE</div>
                        </div>
                        <div className="min-h-[400px]">
                            <EngineFeedRow status="NEW GAP DETECTED" signal="Need a bakery near the metro" detail="South Bengaluru · 94 people agree" time="just now" type="gap" />
                            <EngineFeedRow status="✓ MATCH MADE" signal="Pharmacy demand → Corner unit, Indiranagar" detail="Owner contacted · Deal in review" time="12 sec ago" type="match" />
                            <EngineFeedRow status="NEW GAP DETECTED" signal="No affordable gym in walking distance" detail="Whitefield · 67 people agree" time="31 sec ago" type="gap" />
                            <EngineFeedRow status="NEW SIGNAL" signal="Category: Education/Daycare" detail="HSR Layout · 12 voices" time="45 sec ago" type="gap" />
                            <EngineFeedRow status="✓ MATCH MADE" signal="Co-working demand → HSR Hub" detail="Location locked · Launch ready" time="1 min ago" type="match" />
                        </div>
                    </div>
                </div>
            </section>

            {/* 🔲 THE ECONOMIC FEED */}
            <section className="px-6 md:px-12 py-32 border-b border-ink">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-20 items-start">
                    <div className="lg:col-span-1 space-y-8 lg:sticky lg:top-32">
                        <div>
                            <span className="text-[10px] font-mono tracking-[0.2em] uppercase opacity-40 font-bold">"Right now, your city is asking for these businesses."</span>
                            <h2 className="text-5xl font-serif-italic font-bold tracking-tight uppercase leading-none mt-8">
                                842 OPEN GAPS.<br />ZERO BUSINESSES<br />TO FILL THEM.
                            </h2>
                        </div>
                        <p className="text-lg opacity-60 leading-relaxed font-medium">
                            These aren't surveys. These aren't guesses. These are real people, in real neighborhoods, telling you exactly what they'll spend money on — and nobody's opened it yet.
                        </p>
                        <button onClick={() => setView(View.DEMAND_FEED)} className="neo-button bg-accent-green text-ink text-md py-4 px-8 w-full uppercase">
                            SEE ALL 842 OPEN OPPORTUNITIES  →
                        </button>
                    </div>

                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <EconomicCard status="OPEN" urgency="URGENT" text="No affordable laundromat within 3km" location="South HSR Layout" agreement="42 people agree" footfall="Est. monthly footfall: 800–1,200 customers" />
                        <EconomicCard status="OPEN" urgency="HIGH DEMAND" text="We need a co-working space near the school" location="Indiranagar" agreement="89 people agree" footfall="Est. monthly footfall: 400–600 members" />
                        <EconomicCard status="MATCHED" urgency="JUST FILLED" text="Community needs a pharmacy open past 10pm" location="Koramangala" agreement="61 people agree" footfall="Status: Entrepreneur contacted · In review" />
                        <EconomicCard status="OPEN" urgency="URGENT" text="No healthy food options near the tech park" location="Whitefield" agreement="124 people agree" footfall="Est. monthly footfall: 1,500+ customers" />
                    </div>
                </div>
            </section>

            {/* 🔲 WHERE THE MONEY IS (Heatmaps redesign) */}
            <section className="bg-ink text-foundation px-6 md:px-12 py-32 border-b border-ink">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-20 items-center">
                    <div className="lg:col-span-1 space-y-8">
                        <div>
                            <span className="text-[10px] font-mono text-[#22C55E] tracking-[0.4em] uppercase font-bold">WHERE THE MONEY IS</span>
                            <h2 className="text-5xl font-serif-italic font-bold text-white tracking-tight leading-none uppercase mt-6">
                                WE KNOW WHICH<br />NEIGHBORHOODS<br />ARE READY.
                            </h2>
                        </div>
                        <p className="text-lg opacity-60 leading-relaxed font-medium">
                            Some areas have dozens of unmet needs and zero businesses filling them. We call these Hot Zones — and first movers here win big.
                        </p>
                        <button className="text-[10px] font-mono font-bold tracking-widest uppercase border border-foundation/20 py-3 px-6 hover:bg-white hover:text-ink transition-colors">
                            ACCESS FULL PROPERTY INTELLIGENCE  →
                        </button>
                    </div>

                    <div className="lg:col-span-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <MoneyZoneCard type="HOT" location="Koramangala" count="1,204 people" status="Nobody's opened it yet." topNeed="Food & Bakery" />
                            <MoneyZoneCard type="RISING" location="Whitefield" count="891 people" status="2 matches in progress." topNeed="Health & Pharma" />
                            <MoneyZoneCard type="WATCH" location="HSR Layout" count="673 people" status="Moving fast." topNeed="Co-working" />
                        </div>
                    </div>
                </div>
            </section>

            {/* 🔲 MARKET DOMINANCE — 4 PILLARS */}
            <section className="px-6 md:px-12 py-32 border-b border-ink">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-20">
                        <span className="text-[10px] font-mono tracking-[0.2em] uppercase opacity-40 font-bold">One Platform. Four ways to win.</span>
                        <h2 className="text-6xl md:text-8xl font-serif-italic font-bold tracking-tighter mt-4 leading-[0.8] uppercase">
                            MARKET<br />DOMINANCE
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border border-ink overflow-hidden bg-white">
                        <PillarCard
                            title="THE COMMUNITY"
                            description="You have a problem. Tell us. We'll find 1,000 people who feel the same — and the entrepreneur ready to solve it."
                            buttonText="VOICE A DEMAND"
                            onClick={() => setView(View.POST_DEMAND)}
                        />
                        <PillarCard
                            title="THE ENTREPRENEUR"
                            description="You want a business that actually works. We'll show you exactly where to open, what to sell, and who's already waiting for you."
                            buttonText="FIND MY OPPORTUNITY"
                            onClick={() => setView(View.DEMAND_FEED)}
                        />
                        <PillarCard
                            title="THE LANDLORD"
                            description="You have a space. It's sitting empty. We'll match it to a business that has proven demand before they sign."
                            buttonText="LIST MY PROPERTY"
                            onClick={() => setView(View.RENTAL_LISTINGS)}
                        />
                        <PillarCard
                            title="THE INVESTOR"
                            description="You want to back businesses that won't fail. Every deal on ZONEK comes with community proof before a single rupee is spent."
                            buttonText="SEE DEAL FLOW"
                            onClick={() => setView(View.DEMAND_FEED)}
                        />
                    </div>
                </div>
            </section>

            {/* 🔲 THE FOUNDER'S VISION */}
            <section className="bg-foundation px-6 md:px-12 py-32 border-b border-ink">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <div className="border-l-4 border-[#22C55E] pl-12 h-fit">
                        <h2 className="text-4xl md:text-6xl font-serif-italic font-bold tracking-tighter leading-[0.85] uppercase">
                            "NEIGHBORHOODS<br />AREN'T BROKEN.<br />THEY'RE JUST<br />UNHEARD."
                        </h2>
                    </div>

                    <div className="space-y-10">
                        <div className="h-px bg-ink/10 w-24" />
                        <div className="space-y-6 text-lg md:text-xl leading-relaxed font-medium opacity-80">
                            <p>Every city has neighborhoods that are ready for business — but nobody built the infrastructure to capture what they actually need.</p>
                            <p>Great entrepreneurs fail in the wrong location. Great locations sit empty for years. Communities wait a decade for a pharmacy, a bakery, a gym — while investors wait for "proof" that nobody was collecting.</p>
                            <p>We built ZONEK to close that gap permanently.</p>
                            <p>Not with surveys. Not with guesswork. With the real, verified voices of real communities — turned into investment-ready opportunities that entrepreneurs can act on today.</p>
                            <p>The neighborhood already knows what it needs. We just built the machine to hear it.</p>
                        </div>
                        <div className="pt-8">
                            <div className="text-2xl font-serif-italic font-bold uppercase tracking-tight">WELCOME TO THE INFRASTRUCTURE.</div>
                            <div className="text-md font-mono opacity-40 uppercase tracking-[0.2em] mt-2">— THE ZONEK TEAM</div>
                        </div>
                        <button className="text-xs font-bold uppercase tracking-[0.3em] border-b border-ink/40 pb-1 hover:border-ink transition-colors">
                            READ OUR FULL STORY →
                        </button>
                    </div>
                </div>
            </section>

            {/* 🔲 ENTERPRISE ECOSYSTEM */}
            <section className="bg-white py-24 border-b border-ink overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 mb-12">
                    <div className="text-[10px] font-mono font-bold tracking-[0.4em] uppercase opacity-30 text-center uppercase">TRUSTED BY BUILDERS, INVESTORS, AND CITY-MAKERS</div>
                </div>

                <div className="space-y-12">
                    <div className="flex whitespace-nowrap animate-ticker items-center">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <React.Fragment key={i}>
                                <span className="text-3xl font-serif-italic font-bold opacity-30 uppercase tracking-tighter mx-12">METROPOLITAN REAL ESTATE</span>
                                <span className="text-3xl font-serif-italic font-bold opacity-30 uppercase tracking-tighter mx-12">GLOBAL VENTURE PARTNERS</span>
                                <span className="text-3xl font-serif-italic font-bold opacity-30 uppercase tracking-tighter mx-12">URBAN STRATEGIC CAPITAL</span>
                                <span className="text-3xl font-serif-italic font-bold opacity-30 uppercase tracking-tighter mx-12">CIVIC GROWTH FUND</span>
                            </React.Fragment>
                        ))}
                    </div>
                    <div className="flex whitespace-nowrap animate-ticker-reverse items-center">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <React.Fragment key={i}>
                                <span className="text-3xl font-serif-italic font-bold opacity-30 uppercase tracking-tighter mx-12">APEX COMMERCIAL BROKERS</span>
                                <span className="text-3xl font-serif-italic font-bold opacity-30 uppercase tracking-tighter mx-12">DISTRICT CAPITAL GROUP</span>
                                <span className="text-3xl font-serif-italic font-bold opacity-30 uppercase tracking-tighter mx-12">TIER-1 URBAN VENTURES</span>
                                <span className="text-3xl font-serif-italic font-bold opacity-30 uppercase tracking-tighter mx-12">COMMUNITY ASSET PARTNERS</span>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </section>

            {/* 🔲 FINAL CTA */}
            <section className="bg-ink text-foundation px-6 md:px-12 py-40 border-b border-ink relative overflow-hidden">
                <div className="max-w-5xl mx-auto space-y-16 text-center relative z-10">
                    <div className="space-y-6">
                        <div className="flex flex-center justify-center gap-4 text-[#22C55E]">
                            <span className="w-1.5 h-1.5 bg-[#22C55E] rounded-full animate-pulse" />
                            <span className="text-[10px] font-mono font-bold tracking-[0.5em] uppercase">842 OPEN OPPORTUNITIES LIVE</span>
                        </div>
                        <h2 className="text-8xl md:text-[12rem] font-serif-italic font-bold tracking-tighter leading-[0.85] uppercase text-white">
                            READY TO<br />CAPTURE<br />THE FUTURE?
                        </h2>
                    </div>

                    <div className="max-w-3xl mx-auto space-y-12">
                        <p className="text-2xl md:text-3xl opacity-60 font-medium italic leading-tight">
                            842 open opportunities. Real communities. Real demand. The only question is whether you move first.
                        </p>

                        <div className="flex flex-center justify-center gap-6">
                            <button onClick={() => setView(View.SIGN_UP)} className="bg-[#22C55E] text-ink font-bold px-12 py-6 text-xl uppercase tracking-tighter hover:bg-white hover:text-ink transition-all border border-ink neo-shadow-sm">
                                DEPLOY YOUR ACCOUNT — FREE
                            </button>
                            <button className="bg-ink text-[#22C55E] font-bold px-12 py-6 text-xl uppercase tracking-tighter hover:bg-[#22C55E] hover:text-ink transition-all border border-[#22C55E]">
                                TALK TO OUR TEAM
                            </button>
                        </div>

                        <div className="space-y-1 px-4">
                            <div className="text-[10px] font-mono opacity-30 uppercase tracking-widest">Free to join. No credit card. Community-verified opportunities.</div>
                            <div className="text-[10px] font-mono font-bold text-[#22C55E] tracking-widest mt-2 uppercase">● 842 gaps are unfilled right now · UPDATED 3 SECONDS AGO</div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default React.memo(Home);
