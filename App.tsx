import React, { useState, useEffect, useCallback } from 'react';
import { View, DemandPost, RentalPost, CommunityPost, MediaItem, Location, Conversation, Message, User } from './types';
import { GoogleGenAI, Chat } from "@google/genai";
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import Feed from './components/Feed';
import DemandFeed from './components/DemandFeed';
import RentalListings from './components/RentalListings';
import PostDemandForm from './components/PostDemandForm';
import PostRentalForm from './components/PostRentalForm';
import AISuggestions from './components/AISuggestions';
import AIMatches from './components/AIMatches';
import ImageViewer from './components/ImageViewer';
import Chatbot from './components/Chatbot';
import CommunityFeed from './components/CommunityFeed';
import DemandDetail from './components/DemandDetail';
import RentalDetail from './components/RentalDetail';
import SavedPosts from './components/SavedPosts';
import Collaboration from './components/Collaboration';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import Profile from './components/Profile';
import { ArrowLeftIcon, ArrowRightIcon } from './components/icons';
import ScrollToTopButton from './components/ScrollToTopButton';
import Footer from './components/Footer';

const API_BASE_URL = 'http://localhost:5001/api';

const MOCK_COMMUNITY_POSTS: CommunityPost[] = [
    {
        id: 'comm-1',
        author: 'Jane Doe',
        username: '@jane_doe',
        avatar: 'user1',
        content: 'That Neapolitan pizza demand is exactly what we need. I\'d be there every week!',
        likes: 42,
        reposts: 5,
        replies: 3,
        isLiked: false,
        isReposted: false,
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    },
    {
        id: 'comm-2',
        author: 'John Smith',
        username: '@johnsmith',
        avatar: 'user2',
        content: 'An indoor dog park would be a game-changer for this weather. Someone please make this happen.',
        media: [
            { type: 'image', url: 'https://picsum.photos/seed/communitydog/600/400' }
        ],
        likes: 101,
        reposts: 12,
        replies: 8,
        isLiked: true,
        isReposted: false,
        createdAt: new Date(Date.now() - 3600000 * 8).toISOString(), // 8 hours ago
    },
];

const ARU_CONVERSATION_ID = 'aru-ai-bot';

// Mock User for demo purposes
const MOCK_USER: User = { 
    id: 'user-1', 
    name: 'Alex Johnson', 
    email: 'alex@example.com',
    bio: 'Entrepreneur and community enthusiast looking for the next big idea. Passionate about local coffee shops and sustainable retail.',
    phone: '555-123-4567',
    isEmailVerified: true,
    isPhoneVerified: false,
};
const MOCK_ADMIN_USER: User = { 
    id: 'admin-1', 
    name: 'Shanks (Admin)', 
    email: 'shanks@gmail.com',
    bio: 'Administrator for the Bridgehead platform.',
    isEmailVerified: true,
    isPhoneVerified: true,
};

// Custom hook for the cursor follower effect
const useCustomCursor = () => {
  useEffect(() => {
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorFollower = document.querySelector('.cursor-follower');

    const handleMouseMove = (e: MouseEvent) => {
      if (!(cursorDot instanceof HTMLElement) || !(cursorFollower instanceof HTMLElement)) return;
      
      const { clientX, clientY } = e;
      const target = e.target as HTMLElement;
      
      cursorDot.style.left = `${clientX}px`;
      cursorDot.style.top = `${clientY}px`;
      cursorFollower.style.left = `${clientX}px`;
      cursorFollower.style.top = `${clientY}px`;

      if (cursorDot.style.opacity === '0') {
          cursorDot.style.opacity = '1';
          cursorFollower.style.opacity = '1';
      }
      
      const cursorFollowerSelector = 'a, button, input, textarea, select, label, p, h1, h2, h3, h4, h5, h6, span, [role="button"], [class*="cursor-pointer"]';
      const closestFollowerHover = target.closest(cursorFollowerSelector);

      // Handle cursor follower scaling effect
      if (closestFollowerHover) {
        document.body.classList.add('text-hover');
      } else {
        document.body.classList.remove('text-hover');
      }
    };
    
    const handleMouseLeave = () => {
      if (!(cursorDot instanceof HTMLElement) || !(cursorFollower instanceof HTMLElement)) return;
      cursorDot.style.opacity = '0';
      cursorFollower.style.opacity = '0';
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.body.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
      document.body.classList.remove('text-hover');
    };
  }, []);
};


const App: React.FC = () => {
  useCustomCursor(); // Activate the custom cursor effect

  const [view, setView] = useState<View>(View.HOME);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [demandPosts, setDemandPosts] = useState<DemandPost[]>([]);
  const [rentalPosts, setRentalPosts] = useState<RentalPost[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(MOCK_COMMUNITY_POSTS);
  const [imageViewerState, setImageViewerState] = useState<{ images: string[]; startIndex: number } | null>(null);
  const [selectedPost, setSelectedPost] = useState<DemandPost | RentalPost | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [aruChat, setAruChat] = useState<Chat | null>(null);
  
  const [savedDemandIds, setSavedDemandIds] = useState<string[]>([]);
  const [savedRentalIds, setSavedRentalIds] = useState<string[]>([]);

  const handleSetView = (newView: View) => {
    // Views that are entirely protected and require a user to be logged in.
    const protectedViews = [
      View.POST_DEMAND,
      View.POST_RENTAL,
      View.SAVED_POSTS,
      View.COLLABORATION,
    ];

    if (protectedViews.includes(newView) && !currentUser) {
      setView(View.SIGN_IN);
    } else {
      setView(newView);
    }
    window.scrollTo(0, 0);
  };

  // --- Authentication Handlers ---
  const handleSignIn = (email: string, password: string):boolean => {
    // Mock login logic
    if (email === MOCK_USER.email && password === 'password123') {
        setCurrentUser(MOCK_USER);
        handleSetView(View.FEED);
        return true;
    }
    // Admin user
    if (email === MOCK_ADMIN_USER.email && password === 'shanks@123') {
      setCurrentUser(MOCK_ADMIN_USER);
      handleSetView(View.FEED);
      return true;
    }
    return false;
  };

  const handleSignUp = (name: string, email: string, password: string):boolean => {
    // Mock sign up logic
    const newUser: User = { 
        id: crypto.randomUUID(), 
        name, 
        email,
        isEmailVerified: false,
        isPhoneVerified: false,
    };
    setCurrentUser(newUser);
    handleSetView(View.FEED);
    return true;
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    handleSetView(View.HOME);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
  };

  // Initialize ARU chat instance
  useEffect(() => {
    if (!process.env.API_KEY) {
        console.error("API_KEY not found for ARU chatbot.");
        return;
    };
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemInstruction = "You are ARU, a helpful AI assistant for the Bridgehead app. Bridgehead connects community needs (demands) with entrepreneurs. Users can post demands for businesses they want, and entrepreneurs can find rental properties and get business ideas. Keep your answers concise and helpful. Be friendly and engaging. When providing instructions or steps, always use a numbered or bulleted list. Do not write steps in a single paragraph.";

    const chatInstance = ai.chats.create({
        model: 'gemini-flash-lite-latest',
        config: { systemInstruction },
    });
    setAruChat(chatInstance);
  }, []);

  // Load saved IDs from localStorage on mount
  useEffect(() => {
    try {
        const savedDemands = localStorage.getItem('bridgehead_saved_demands');
        if (savedDemands) setSavedDemandIds(JSON.parse(savedDemands));
        const savedRentals = localStorage.getItem('bridgehead_saved_rentals');
        if (savedRentals) setSavedRentalIds(JSON.parse(savedRentals));
    } catch (error) {
        console.error("Failed to parse saved items from localStorage", error);
    }
  }, []);
  
  useEffect(() => {
    // Open sidebar by default on desktop
    if (window.innerWidth > 768) {
        setIsSidebarOpen(true);
    }
  }, []);

  // Save demand IDs to localStorage when they change
  useEffect(() => {
    localStorage.setItem('bridgehead_saved_demands', JSON.stringify(savedDemandIds));
  }, [savedDemandIds]);
  
  // Save rental IDs to localStorage when they change
  useEffect(() => {
    localStorage.setItem('bridgehead_saved_rentals', JSON.stringify(savedRentalIds));
  }, [savedRentalIds]);

  const handleDemandSaveToggle = (id: string) => {
    setSavedDemandIds(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);
  };

  const handleRentalSaveToggle = (id: string) => {
    setSavedRentalIds(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);
  };

  // --- DATA FETCHING AND MUTATIONS ---
  useEffect(() => {
    const fetchPosts = async () => {
        try {
            const [demandsRes, rentalsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/posts/demands`),
                fetch(`${API_BASE_URL}/posts/rentals`)
            ]);
            if (!demandsRes.ok || !rentalsRes.ok) {
                throw new Error('Failed to fetch posts');
            }
            const demandsData = await demandsRes.json();
            const rentalsData = await rentalsRes.json();
            
            setDemandPosts(demandsData);
            setRentalPosts(rentalsData);

        } catch (error) {
            console.error(error);
        }
    };
    
    fetchPosts();

    // MOCK DATA for Conversations (can be migrated later)
    const MOCK_CONVERSATIONS: Conversation[] = [
        {
            id: ARU_CONVERSATION_ID,
            postId: 'ai-assistant',
            participant: {
                id: 'aru-bot',
                name: 'ARU',
                avatar: 'aru-avatar',
                postTitle: 'AI Assistant',
            },
            messages: [{
                id: 'aru-msg-1',
                senderId: 'aru-bot',
                text: "Hello! I'm ARU, your personal AI assistant for Bridgehead. How can I help you today?",
                timestamp: new Date().toISOString(),
            }],
            lastMessageTimestamp: new Date().toISOString(),
            unreadCount: 0,
        },
        {
            id: 'convo-1',
            postId: 'demand-1',
            participant: { id: 'user-pizza', name: 'Pizza Lover', avatar: 'user_pizza', postTitle: 'Authentic Neapolitan Pizza Joint' },
            messages: [
                { id: 'msg-1', senderId: 'user-pizza', text: 'Hey, I saw your demand for a pizza place. I\'m an entrepreneur and I\'m interested.', timestamp: new Date(Date.now() - 3600000 * 24).toISOString() },
                { id: 'msg-2', senderId: 'currentUser', text: 'That\'s great to hear! What are your thoughts?', timestamp: new Date(Date.now() - 3600000 * 23).toISOString() },
            ],
            lastMessageTimestamp: new Date(Date.now() - 3600000 * 23).toISOString(),
            unreadCount: 0,
        }
    ];
    setConversations(MOCK_CONVERSATIONS);
  }, []);

  const addDemandPost = async (post: Omit<DemandPost, 'id' | 'createdAt' | 'upvotes'>) => {
    try {
        const res = await fetch(`${API_BASE_URL}/posts/demands`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(post)
        });
        if (!res.ok) throw new Error('Failed to create demand post');
        const newPost = await res.json();
        setDemandPosts(prev => [newPost, ...prev]);
    } catch (error) {
        console.error(error);
    }
  };
  
  const addRentalPost = async (post: Omit<RentalPost, 'id' | 'createdAt'>) => {
    try {
        const res = await fetch(`${API_BASE_URL}/posts/rentals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(post)
        });
        if (!res.ok) throw new Error('Failed to create rental post');
        const newPost = await res.json();
        setRentalPosts(prev => [newPost, ...prev]);
    } catch (error) {
        console.error(error);
    }
  };

  const handleUpvote = async (id: string) => {
    try {
        const res = await fetch(`${API_BASE_URL}/posts/demands/${id}/upvote`, { method: 'PUT' });
        if (!res.ok) throw new Error('Failed to upvote post');
        const updatedPost = await res.json();
        setDemandPosts(posts => posts.map(p => p.id === id ? updatedPost : p));
    } catch (error) {
        console.error(error);
    }
  };

  const addCommunityPost = (content: string, media: MediaItem[]) => {
    const newPost: CommunityPost = {
        id: crypto.randomUUID(),
        author: currentUser?.name || 'Current User',
        username: currentUser ? `@${currentUser.name.toLowerCase().replace(' ', '_')}` : '@current_user',
        avatar: 'user_self',
        content,
        media: media.length > 0 ? media : undefined,
        likes: 0,
        reposts: 0,
        replies: 0,
        isLiked: false,
        isReposted: false,
        createdAt: new Date().toISOString(),
    };
    setCommunityPosts(prev => [newPost, ...prev]);
  };
  
  const handleLikePost = (id: string) => {
    setCommunityPosts(posts => posts.map(p => {
        if (p.id === id) {
            return { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 };
        }
        return p;
    }));
  };
  
  const handleRepostPost = (id: string) => {
    setCommunityPosts(posts => posts.map(p => {
        if (p.id === id) {
            return { ...p, isReposted: !p.isReposted, reposts: p.isReposted ? p.reposts - 1 : p.reposts + 1 };
        }
        return p;
    }));
  };

  const handleEditPost = (id: string, newContent: string, newMedia: MediaItem[]) => {
    setCommunityPosts(posts => posts.map(p => {
        if (p.id === id) {
            return { 
                ...p, 
                content: newContent, 
                media: newMedia.length > 0 ? newMedia : undefined 
            };
        }
        return p;
    }));
  };
  
  const handleReplyPost = (postId: string, content: string, media: MediaItem[]) => {
    // 1. Create and add the new reply post
    addCommunityPost(content, media);

    // 2. Increment the reply count of the original post
    setCommunityPosts(posts => posts.map(p => {
        if (p.id === postId) {
            return { ...p, replies: p.replies + 1 };
        }
        return p;
    }));
  };

  const handleImageClick = useCallback((images: string[], startIndex: number) => {
    setImageViewerState({ images, startIndex });
  }, []);
  
  const closeImageViewer = useCallback(() => {
    setImageViewerState(null);
  }, []);
  
  const handlePostSelect = (post: DemandPost | RentalPost) => {
    setSelectedPost(post);
    if ('upvotes' in post) { // Type guard for DemandPost
        handleSetView(View.DEMAND_DETAIL);
    } else {
        handleSetView(View.RENTAL_DETAIL);
    }
  };

  const handleBackToFeed = () => {
    if (selectedPost && 'upvotes' in selectedPost) {
        handleSetView(View.DEMAND_FEED);
    } else {
        handleSetView(View.RENTAL_LISTINGS);
    }
    setSelectedPost(null);
  };
  
  const handleSendMessage = async (conversationId: string, text: string) => {
    const newMessage: Message = {
        id: crypto.randomUUID(),
        senderId: 'currentUser',
        text,
        timestamp: new Date().toISOString(),
    };

    setConversations(prev => {
        const updatedConversations = prev.map(convo => {
            if (convo.id === conversationId) {
                return {
                    ...convo,
                    messages: [...convo.messages, newMessage],
                    lastMessageTimestamp: newMessage.timestamp,
                };
            }
            return convo;
        });
        return updatedConversations.sort((a,b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime());
    });

    if (conversationId === ARU_CONVERSATION_ID) {
        if (!aruChat) {
            console.error("ARU chat not initialized");
            return;
        }

        try {
            const result = await aruChat.sendMessageStream({ message: text });
            
            let modelResponse = '';
            const responseMessageId = crypto.randomUUID();
            
            setConversations(prev => prev.map(convo => {
                if (convo.id === ARU_CONVERSATION_ID) {
                    return {
                        ...convo,
                        messages: [
                            ...convo.messages,
                            { id: responseMessageId, senderId: 'aru-bot', text: '...', timestamp: new Date().toISOString() }
                        ],
                    };
                }
                return convo;
            }));

            for await (const chunk of result) {
                modelResponse += chunk.text;
                setConversations(prev => prev.map(convo => {
                    if (convo.id === ARU_CONVERSATION_ID) {
                        const updatedMessages = convo.messages.map(msg => 
                            msg.id === responseMessageId ? { ...msg, text: modelResponse } : msg
                        );
                        return { 
                            ...convo, 
                            messages: updatedMessages,
                            lastMessageTimestamp: new Date().toISOString() 
                        };
                    }
                    return convo;
                }));
            }
        } catch (error) {
            console.error("ARU chat error:", error);
            const errorMessage: Message = {
                id: crypto.randomUUID(),
                senderId: 'aru-bot',
                text: "Sorry, I'm having trouble connecting right now. Please try again later.",
                timestamp: new Date().toISOString(),
            };
            setConversations(prev => prev.map(convo =>
                convo.id === ARU_CONVERSATION_ID
                ? { ...convo, messages: [...convo.messages, errorMessage], lastMessageTimestamp: errorMessage.timestamp }
                : convo
            ));
        }

    } else {
        // Existing mock peer-to-peer reply logic
        setTimeout(() => {
            const conversation = conversations.find(c => c.id === conversationId);
            if (!conversation) return;

            const replyMessage: Message = {
                id: crypto.randomUUID(),
                senderId: conversation.participant.id,
                text: "Thanks for your message! I'll get back to you shortly.",
                timestamp: new Date().toISOString(),
            };
            setConversations(prev => prev.map(convo => {
                 if (convo.id === conversationId) {
                    return {
                        ...convo,
                        messages: [...convo.messages, replyMessage],
                        lastMessageTimestamp: replyMessage.timestamp,
                    };
                }
                return convo;
            }));
        }, 1500);
    }
  };

  const handleStartCollaboration = (post: DemandPost | RentalPost) => {
      const existingConvo = conversations.find(c => c.postId === post.id);
      if (existingConvo) {
          setSelectedConversationId(existingConvo.id);
      } else {
          const newConvo: Conversation = {
              id: crypto.randomUUID(),
              postId: post.id,
              participant: {
                  id: `user-${post.id}`,
                  name: `Owner of "${post.title.substring(0, 15)}..."`, // Mock name
                  avatar: `user-avatar-${post.id}`,
                  postTitle: post.title,
              },
              messages: [],
              lastMessageTimestamp: new Date().toISOString(),
              unreadCount: 0,
          };
          setConversations(prev => [newConvo, ...prev]);
          setSelectedConversationId(newConvo.id);
      }
      handleSetView(View.COLLABORATION);
  };

  const handleNavigateToAIAssistant = () => {
    setSelectedConversationId(ARU_CONVERSATION_ID);
    handleSetView(View.COLLABORATION);
  };

  const renderView = () => {
    switch (view) {
      case View.FEED:
        return <Feed
            demandPosts={demandPosts}
            rentalPosts={rentalPosts}
            communityPosts={communityPosts}
            savedDemandIds={savedDemandIds}
            savedRentalIds={savedRentalIds}
            onPostSelect={handlePostSelect}
            onDemandUpvote={handleUpvote}
            onDemandSaveToggle={handleDemandSaveToggle}
            onRentalSaveToggle={handleRentalSaveToggle}
            onCommunityLike={handleLikePost}
            onCommunityRepost={handleRepostPost}
            onCommunityEdit={handleEditPost}
            onCommunityReply={handleReplyPost}
            currentUser={currentUser}
            setView={handleSetView}
        />;
      case View.DEMAND_FEED:
        return <DemandFeed posts={demandPosts} onPostSelect={handlePostSelect} onUpvote={handleUpvote} savedPostIds={savedDemandIds} onSaveToggle={handleDemandSaveToggle} />;
      case View.POST_DEMAND:
        return <PostDemandForm addDemandPost={addDemandPost} setView={handleSetView} />;
      case View.RENTAL_LISTINGS:
        return <RentalListings posts={rentalPosts} onPostSelect={handlePostSelect} savedPostIds={savedRentalIds} onSaveToggle={handleRentalSaveToggle} />;
      case View.POST_RENTAL:
        return <PostRentalForm addRentalPost={addRentalPost} setView={handleSetView} />;
      case View.AI_SUGGESTIONS:
        return <AISuggestions demands={demandPosts} />;
      case View.AI_MATCHES:
        return <AIMatches 
            demands={demandPosts} 
            rentals={rentalPosts}
            onPostSelect={handlePostSelect}
            onDemandUpvote={handleUpvote}
            onDemandSaveToggle={handleDemandSaveToggle}
            onRentalSaveToggle={handleRentalSaveToggle}
            savedDemandIds={savedDemandIds}
            savedRentalIds={savedRentalIds}
        />;
      case View.COMMUNITY_FEED:
        return <CommunityFeed 
          posts={communityPosts} 
          addPost={addCommunityPost} 
          onLike={handleLikePost} 
          onRepost={handleRepostPost} 
          onEditPost={handleEditPost} 
          onReply={handleReplyPost}
          currentUser={currentUser}
          setView={handleSetView}
        />;
      case View.DEMAND_DETAIL:
        return selectedPost ? <DemandDetail post={selectedPost as DemandPost} onBack={handleBackToFeed} onImageClick={handleImageClick} onStartCollaboration={handleStartCollaboration} /> : <Home setView={handleSetView} />;
      case View.RENTAL_DETAIL:
        return selectedPost ? <RentalDetail post={selectedPost as RentalPost} onBack={handleBackToFeed} onImageClick={handleImageClick} onStartCollaboration={handleStartCollaboration} /> : <Home setView={handleSetView} />;
      case View.SAVED_POSTS:
        return <SavedPosts
            demandPosts={demandPosts}
            rentalPosts={rentalPosts}
            savedDemandIds={savedDemandIds}
            savedRentalIds={savedRentalIds}
            onDemandSaveToggle={handleDemandSaveToggle}
            onRentalSaveToggle={handleRentalSaveToggle}
            onDemandUpvote={handleUpvote}
            onPostSelect={handlePostSelect}
        />;
      case View.COLLABORATION:
        return <Collaboration conversations={conversations} onSendMessage={handleSendMessage} selectedConversationId={selectedConversationId} setSelectedConversationId={setSelectedConversationId} />;
      case View.SIGN_IN:
        return <SignIn onSignIn={handleSignIn} setView={handleSetView} />;
      case View.SIGN_UP:
        return <SignUp onSignUp={handleSignUp} setView={handleSetView} />;
      case View.PROFILE:
        return currentUser ? <Profile user={currentUser} onUpdateUser={handleUpdateUser} /> : <SignIn onSignIn={handleSignIn} setView={handleSetView} />;
      case View.HOME:
      default:
        return <Home setView={handleSetView} />;
    }
  };

  return (
    <>
      <Header 
        setIsSidebarOpen={setIsSidebarOpen} 
        isSidebarOpen={isSidebarOpen}
        currentView={view}
        currentUser={currentUser}
        onSignOut={handleSignOut}
        setView={handleSetView}
      />
      <Sidebar 
        onNavigate={handleSetView}
        currentView={view} 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen}
        currentUser={currentUser}
        onSignOut={handleSignOut}
      />
       {/* Sidebar Toggle for Desktop */}
       <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        onMouseEnter={() => {
            if (!isSidebarOpen && window.innerWidth > 768) setIsSidebarOpen(true);
        }}
        className={`hidden md:flex items-center justify-center fixed top-1/2 -translate-y-1/2 z-[60] w-6 h-16 bg-[--card-color] border-y border-r border-[--border-color] rounded-r-lg text-white hover:bg-[--primary-color] transition-all duration-300 ease-in-out ${isSidebarOpen ? 'left-64' : 'left-0'}`}
        aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {isSidebarOpen ? <ArrowLeftIcon className="w-4 h-4" /> : <ArrowRightIcon className="w-4 h-4" />}
      </button>

      <main className={`pt-16 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
        {renderView()}
      </main>
      <Footer setView={handleSetView} onNavigateToAIAssistant={handleNavigateToAIAssistant} />
      {imageViewerState && (
        <ImageViewer 
          images={imageViewerState.images} 
          startIndex={imageViewerState.startIndex} 
          onClose={closeImageViewer} 
        />
      )}
      <Chatbot />
      <ScrollToTopButton />
    </>
  );
};

export default App;
