import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Database, 
  Download, 
  ExternalLink, 
  Layers, 
  LayoutDashboard, 
  Plus, 
  Search, 
  Settings, 
  Shield, 
  Zap,
  ChevronRight,
  MoreVertical,
  ArrowRight,
  Monitor,
  Smartphone,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSocket } from './hooks/useSocket';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for Tailwind class merging
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface ExtractionSession {
  id: string;
  website: string;
  url: string;
  status: 'active' | 'completed' | 'failed' | 'queued';
  itemCount: number;
  qualityScore: number;
  lastUpdated: string;
}

// --- Mock Data ---
const MOCK_SESSIONS: ExtractionSession[] = [
  {
    id: 'ext_7421',
    website: 'Justdial',
    url: 'https://justdial.com/Mumbai/Restaurants',
    status: 'completed',
    itemCount: 2450,
    qualityScore: 94.5,
    lastUpdated: '2 mins ago'
  },
  {
    id: 'ext_8912',
    website: 'Sulekha',
    url: 'https://sulekha.com/it-services',
    status: 'active',
    itemCount: 842,
    qualityScore: 91.2,
    lastUpdated: 'Just now'
  },
  {
    id: 'ext_3345',
    website: 'Yelp',
    url: 'https://yelp.com/search?find_desc=dentists',
    status: 'queued',
    itemCount: 0,
    qualityScore: 0,
    lastUpdated: '1 hour ago'
  }
];

// --- Components ---

interface ExtractionItem {
  _id: string;
  title?: string;
  price?: string;
  phone?: string;
  address?: string;
  link?: string;
  image?: string;
  _qualityScore?: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'extractions' | 'settings'>('dashboard');
  const [sessions, setSessions] = useState<ExtractionSession[]>(MOCK_SESSIONS);
  const [liveItems, setLiveItems] = useState<ExtractionItem[]>([]);
  const [isNewExtractionOpen, setIsNewExtractionOpen] = useState(false);
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Join all active sessions to receive updates
    sessions.filter(s => s.status === 'active').forEach(s => {
      socket.emit('extraction:join', { sessionId: s.id });
    });

    socket.on('data:update', (data: { sessionId: string, newItems: ExtractionItem[] }) => {
      setLiveItems(prev => [...data.newItems, ...prev].slice(0, 50));
      setSessions(prev => prev.map(s => 
        s.id === data.sessionId ? { ...s, itemCount: s.itemCount + data.newItems.length } : s
      ));
    });

    socket.on('session:created', (newSession: any) => {
      console.log('New session discovered:', newSession);
      setSessions(prev => {
        // Avoid duplicate sessions
        if (prev.find(s => s.id === newSession.id)) return prev;
        return [
          {
            ...newSession,
            itemCount: 0,
            qualityScore: 0,
            lastUpdated: 'Just now'
          },
          ...prev
        ];
      });
      // Join the new session room immediately
      socket.emit('extraction:join', { sessionId: newSession.id });
    });

    return () => {
      socket.off('data:update');
      socket.off('session:created');
    };
  }, [socket, sessions.length]);

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* --- Sidebar Navigation --- */}
      <nav className="fixed left-0 top-0 h-full w-20 border-r border-[#141414] flex flex-col items-center py-8 gap-12 z-50 bg-[#E4E3E0]">
        <div className="w-10 h-10 bg-[#141414] rounded-sm flex items-center justify-center text-[#E4E3E0]">
          <Layers size={24} />
        </div>
        
        <div className="flex flex-col gap-8">
          <NavIcon 
            icon={<LayoutDashboard size={20} />} 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavIcon 
            icon={<Database size={20} />} 
            active={activeTab === 'extractions'} 
            onClick={() => setActiveTab('extractions')} 
          />
          <NavIcon 
            icon={<Settings size={20} />} 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
        </div>

        <div className="mt-auto">
          <div className={cn(
            "w-3 h-3 rounded-full",
            isConnected ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" : "bg-red-500"
          )} />
        </div>
      </nav>

      {/* --- Main Content --- */}
      <main className="pl-20 min-h-screen">
        {/* --- Header --- */}
        <header className="h-20 border-b border-[#141414] flex items-center justify-between px-12 sticky top-0 bg-[#E4E3E0]/80 backdrop-blur-md z-40">
          <div className="flex items-center gap-4">
            <h1 className="font-serif italic text-2xl tracking-tight">Bridgehead</h1>
            <span className="text-[10px] uppercase tracking-widest opacity-50 font-mono border border-[#141414]/20 px-2 py-0.5 rounded-full">v1.0.0</span>
          </div>

          <div className="flex items-center gap-6">
            <button 
              className="px-6 py-2 border border-[#141414] rounded-full text-sm font-medium flex items-center gap-2 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
              onClick={() => {
                alert("Extension source code is available in the /extension directory. You can load the 'extension/dist' folder as an unpacked extension in Chrome.");
              }}
            >
              <Download size={18} />
              Get Extension
            </button>
            <div className="relative group">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity" />
              <input 
                type="text" 
                placeholder="Search extractions..." 
                className="bg-transparent border border-[#141414]/10 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#141414] transition-all w-64"
              />
            </div>
            <button 
              onClick={() => setIsNewExtractionOpen(true)}
              className="bg-[#141414] text-[#E4E3E0] px-6 py-2 rounded-full text-sm font-medium flex items-center gap-2 hover:scale-105 transition-transform active:scale-95"
            >
              <Plus size={18} />
              New Extraction
            </button>
          </div>
        </header>

        {/* --- Dashboard Content --- */}
        <div className="p-12 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12"
              >
                {/* --- Hero Stats --- */}
                <div className="grid grid-cols-4 gap-px bg-[#141414] border border-[#141414]">
                  <StatCard label="Total Items" value={sessions.reduce((a,b)=>a+b.itemCount,0).toLocaleString()} trend="+12%" />
                  <StatCard label="Active Scrapers" value={sessions.filter(s=>s.status==='active').length.toString()} trend="Live" />
                  <StatCard label="Accuracy Rate" value="98.2%" trend="+0.4%" />
                  <StatCard label="Data Quality" value="A+" trend="Excellent" />
                </div>

                {/* --- Real-Time Data Intelligence Feed --- */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif italic text-2xl">Intelligence Stream</h2>
                    <div className="px-4 py-1 bg-[#141414] text-[#E4E3E0] rounded-full text-[10px] uppercase tracking-widest font-mono flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                      Live Feed
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence>
                      {liveItems.length === 0 ? (
                        <div className="col-span-full py-20 border border-[#141414]/10 border-dashed text-center opacity-30">
                          Waiting for extraction events...
                        </div>
                      ) : (
                        liveItems.map((item: ExtractionItem) => (
                          <DataCard key={item._id} item={item} />
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* --- Recent Activity Grid --- */}
                <div className="grid grid-cols-3 gap-12 pt-12 border-t border-[#141414]/10">
                  <div className="col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="font-serif italic text-xl">Active Sessions</h2>
                    </div>

                    <div className="border border-[#141414] divide-y divide-[#141414] bg-white/50 backdrop-blur-sm">
                      <div className="grid grid-cols-5 p-4 bg-[#141414] text-[#E4E3E0] text-[10px] uppercase tracking-widest font-mono">
                        <div className="col-span-2">Source</div>
                        <div>Status</div>
                        <div>Items</div>
                        <div className="text-right">Action</div>
                      </div>
                      {sessions.map((session) => (
                        <div key={session.id}>
                          <ExtractionRow session={session} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h2 className="font-serif italic text-xl">System Status</h2>
                    <div className="border border-[#141414] p-6 space-y-8">
                      <StatusItem label="API Gateway" status="operational" />
                      <StatusItem label="Extraction Engine" status="operational" />
                      <StatusItem label="Data Normalizer" status="operational" />
                      <StatusItem label="WebSocket Server" status={isConnected ? "operational" : "down"} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* --- New Extraction Modal --- */}
      <AnimatePresence>
        {isNewExtractionOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewExtractionOpen(false)}
              className="absolute inset-0 bg-[#141414]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-[#E4E3E0] border border-[#141414] p-12 shadow-[20px_20px_0px_#141414]"
            >
              <h2 className="font-serif italic text-3xl mb-8">Initialize Extraction</h2>
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest opacity-50 font-mono">Target URL</label>
                  <input 
                    type="url" 
                    placeholder="https://example.com/listings"
                    className="w-full bg-transparent border-b border-[#141414] py-4 text-xl focus:outline-none placeholder:opacity-20"
                  />
                </div>
                <div className="pt-8 flex gap-4">
                  <button className="flex-1 bg-[#141414] text-[#E4E3E0] py-4 font-medium hover:bg-[#141414]/90 transition-colors">
                    Start Extraction
                  </button>
                  <button 
                    onClick={() => setIsNewExtractionOpen(false)}
                    className="px-8 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Components ---

const DataCard: React.FC<{ item: ExtractionItem }> = ({ item }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white border border-[#141414] group overflow-hidden hover:shadow-[8px_8px_0px_#141414] transition-all"
    >
      {item.image && (
        <div className="h-48 overflow-hidden bg-[#141414]/5 relative">
          <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 border border-[#141414] text-[10px] font-mono">
            {item._qualityScore}% Score
          </div>
        </div>
      )}
      <div className="p-6 space-y-4">
        <h3 className="font-serif italic text-lg leading-tight">{item.title}</h3>
        
        <div className="space-y-2">
          {item.phone && (
            <div className="flex items-center gap-2 text-xs font-mono">
              <Smartphone size={14} className="opacity-40" />
              <span className="opacity-70 group-hover:opacity-100 transition-opacity">{item.phone}</span>
            </div>
          )}
          {item.address && (
            <div className="flex items-start gap-2 text-xs font-mono">
              <Globe size={14} className="opacity-40 mt-0.5 shrink-0" />
              <span className="opacity-50 line-clamp-2 leading-relaxed">{item.address}</span>
            </div>
          )}
        </div>

        {item.link && (
          <a 
            href={item.link} 
            target="_blank" 
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold border-b border-[#141414] pb-0.5 mt-2 hover:gap-4 transition-all"
          >
            Full Profile <ChevronRight size={12} />
          </a>
        )}
      </div>
    </motion.div>
  );
}

function NavIcon({ icon, active, onClick }: { icon: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center transition-all",
        active ? "bg-[#141414] text-[#E4E3E0]" : "text-[#141414] opacity-40 hover:opacity-100 hover:bg-[#141414]/5"
      )}
    >
      {icon}
    </button>
  );
}

function StatCard({ label, value, trend }: { label: string, value: string, trend: string }) {
  return (
    <div className="bg-[#E4E3E0] p-8 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest opacity-50 font-mono">{label}</span>
        <span className={cn(
          "text-[10px] font-mono px-2 py-0.5 rounded-full",
          trend.startsWith('+') ? "bg-green-100 text-green-700" : "bg-[#141414]/5 opacity-50"
        )}>{trend}</span>
      </div>
      <div className="text-4xl font-serif italic">{value}</div>
    </div>
  );
}

const ExtractionRow = ({ session }: { session: ExtractionSession }) => {
  return (
    <div className="grid grid-cols-5 p-6 group hover:bg-[#141414] hover:text-[#E4E3E0] transition-all cursor-pointer items-center">
      <div className="col-span-2 flex flex-col gap-1">
        <span className="font-medium">{session.website}</span>
        <span className="text-xs opacity-50 font-mono truncate pr-8 group-hover:opacity-70">{session.url}</span>
      </div>
      <div>
        <span className={cn(
          "text-[10px] uppercase tracking-widest font-mono px-2 py-1 rounded-sm border",
          session.status === 'active' ? "border-blue-500 text-blue-500 group-hover:border-blue-400 group-hover:text-blue-400" :
          session.status === 'completed' ? "border-green-500 text-green-500 group-hover:border-green-400 group-hover:text-green-400" :
          "border-[#141414]/20 opacity-50"
        )}>
          {session.status}
        </span>
      </div>
      <div className="font-mono text-sm">
        {session.itemCount.toLocaleString()}
      </div>
      <div className="text-right">
        <button className="p-2 opacity-30 group-hover:opacity-100 hover:bg-white/10 rounded-full transition-all">
          <MoreVertical size={16} />
        </button>
      </div>
    </div>
  );
}

function StatusItem({ label, status }: { label: string, status: 'operational' | 'degraded' | 'down' }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest opacity-50 font-mono">{status}</span>
        <div className={cn(
          "w-2 h-2 rounded-full",
          status === 'operational' ? "bg-green-500" : "bg-yellow-500"
        )} />
      </div>
    </div>
  );
}
